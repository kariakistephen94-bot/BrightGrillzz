import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { verifyPaystackReference } from '@/lib/paystack.server'

// Customer-facing: called when Paystack redirects back after a quote payment.
// Verifies the transaction against Paystack, checks it matches this order's
// stored reference + amount, then marks the order paid and starts the kitchen.
//
// Response shape (always includes `order` when the order exists, so the paid
// page can render a receipt on success AND on a decline):
//   { ok, status: 'success' | 'declined' | 'error', confirmed, reason?, order? }
//    - success  → payment verified and the order is now paid.
//    - declined → Paystack says the charge failed/was abandoned (order unpaid).
//    - error    → we could not verify (network, bad reference, amount mismatch).

interface DbItem {
  name: string
  unit_price: number | null
  qty: number
  image: string | null
}

interface DbOrder {
  id: string
  tracking_id: string
  created_at: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  fulfillment_type: 'delivery' | 'pickup'
  address: string | null
  area: string | null
  subtotal: number | null
  total: number | null
  payment_method: string | null
  payment_reference: string | null
  pay_reference: string | null
  payment_confirmed: boolean
  order_items: DbItem[] | null
}

// Shapes the DB row into the receipt payload the client turns into an Order.
// Never leaks anything the paying customer doesn't already own.
function toReceipt(o: DbOrder, overrides?: { paymentConfirmed?: boolean; paymentReference?: string }) {
  return {
    trackingId: o.tracking_id,
    createdAt: o.created_at,
    customer: {
      fullName: o.customer_name ?? '',
      phone: o.customer_phone ?? '',
      email: o.customer_email ?? '',
    },
    fulfillment: {
      type: o.fulfillment_type,
      address: o.address ?? '',
      area: o.area ?? '',
    },
    items: (o.order_items ?? []).map((it) => ({
      name: it.name,
      qty: it.qty,
      price: it.unit_price ?? 0,
      image: it.image ?? '',
    })),
    subtotal: o.subtotal ?? 0,
    total: o.total ?? 0,
    paymentMethod: 'paystack' as const,
    paymentReference: overrides?.paymentReference ?? o.payment_reference ?? '',
    paymentConfirmed: overrides?.paymentConfirmed ?? o.payment_confirmed,
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, status: 'error', error: 'Invalid JSON' }, { status: 400 })
  }
  const b = (body ?? {}) as { tracking?: unknown; reference?: unknown }
  const tracking = String(b.tracking ?? '').trim()
  const reference = String(b.reference ?? '').trim()
  if (!tracking || !reference) {
    return NextResponse.json(
      { ok: false, status: 'error', error: 'Missing tracking or reference' },
      { status: 400 },
    )
  }
  if (!isServiceRoleConfigured) {
    return NextResponse.json({ ok: false, status: 'error', error: 'Payments not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select(
      'id, tracking_id, created_at, customer_name, customer_phone, customer_email, fulfillment_type, address, area, subtotal, total, payment_method, payment_reference, pay_reference, payment_confirmed, order_items(name, unit_price, qty, image)',
    )
    .ilike('tracking_id', tracking)
    .single()
  if (error || !data) {
    return NextResponse.json({ ok: false, status: 'error', error: 'Order not found' }, { status: 404 })
  }
  const order = data as unknown as DbOrder

  const noStore = { headers: { 'Cache-Control': 'no-store' } }

  // Idempotent: an already-paid order is a success no matter how often the
  // callback fires (Paystack can redirect + webhook the same reference).
  if (order.payment_confirmed) {
    return NextResponse.json(
      { ok: true, status: 'success', confirmed: true, already: true, order: toReceipt(order) },
      noStore,
    )
  }

  // The reference must be the one we created for THIS order.
  if (order.pay_reference && order.pay_reference !== reference) {
    return NextResponse.json(
      { ok: false, status: 'error', error: 'Reference does not match this order', order: toReceipt(order) },
      { status: 400, ...noStore },
    )
  }

  const verified = await verifyPaystackReference(reference)
  if (!verified) {
    return NextResponse.json(
      { ok: false, status: 'error', error: 'Could not verify payment', order: toReceipt(order) },
      { status: 502, ...noStore },
    )
  }

  const expectedKobo = Math.round((order.total ?? 0) * 100)

  // Verified as successful, but the paid amount doesn't match the quote.
  if (verified.success && expectedKobo > 0 && verified.amountKobo !== expectedKobo) {
    return NextResponse.json(
      { ok: false, status: 'error', error: 'Paid amount does not match order total', order: toReceipt(order) },
      { status: 400, ...noStore },
    )
  }

  // Not successful → a genuine decline (failed / abandoned / reversed / ongoing).
  if (!verified.success) {
    return NextResponse.json(
      {
        ok: true,
        status: 'declined',
        confirmed: false,
        reason: verified.gatewayStatus,
        order: toReceipt(order, { paymentConfirmed: false, paymentReference: reference }),
      },
      noStore,
    )
  }

  // Success: mark the order paid and start the kitchen.
  const { error: updErr } = await admin
    .from('orders')
    .update({
      payment_confirmed: true,
      payment_method: 'paystack',
      payment_reference: reference,
      status: 'preparing',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', order.id)
  if (updErr) {
    return NextResponse.json({ ok: false, status: 'error', error: updErr.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      ok: true,
      status: 'success',
      confirmed: true,
      order: toReceipt(order, { paymentConfirmed: true, paymentReference: reference }),
    },
    noStore,
  )
}
