import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { sendOrderEmails } from '@/lib/email/send'
import type { OrderEmailPayload } from '@/lib/email/templates'

interface IncomingItem {
  name: string
  qty: number
  /** Undefined for request-a-quote orders (no price set yet). */
  price?: number
  image?: string | null
}

// Persists a placed order to Supabase and fires the confirmation emails.
// Called from checkout after the order is finalized. Insert failures never
// block the customer, the order is also mirrored to localStorage client-side.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const order = normalizeOrder(body)
  if (!order) {
    return NextResponse.json({ ok: false, error: 'Invalid order payload' }, { status: 400 })
  }

  let saved = false
  if (isServiceRoleConfigured) {
    saved = await insertOrder(order)
  } else {
    console.warn('[orders] SUPABASE_SERVICE_ROLE_KEY not set, order not persisted')
  }

  // Emails are best-effort and independent of persistence.
  const email = await sendOrderEmails(order)

  return NextResponse.json({ ok: true, saved, emailed: email.sent, trackingId: order.trackingId })
}

async function insertOrder(order: Omit<OrderEmailPayload, 'items'> & { items: IncomingItem[] }): Promise<boolean> {
  const admin = createAdminClient()

  // A request-a-quote order has no amounts or payment yet, it enters at
  // 'awaiting_quote' with null money. Legacy paid orders keep their amounts.
  const isRequest = order.awaitingQuote === true

  const orderRow = {
    tracking_id: order.trackingId,
    status: isRequest ? 'awaiting_quote' : 'pending',
    customer_name: order.customer.fullName,
    customer_phone: order.customer.phone,
    customer_email: order.customer.email || null,
    fulfillment_type: order.fulfillment.type,
    address: order.fulfillment.address || null,
    area: order.fulfillment.area || null,
    notes: order.fulfillment.notes || null,
    subtotal: isRequest ? null : order.subtotal ?? null,
    total: isRequest ? null : order.total ?? null,
    payment_method: isRequest ? null : order.paymentMethod ?? 'bank_transfer',
    payment_reference: order.paymentReference || null,
    payment_confirmed: !isRequest && order.paymentMethod === 'paystack',
  }

  const { data, error } = await admin
    .from('orders')
    .insert(orderRow as never)
    .select('id')
    .single()

  if (error || !data) {
    console.error('[orders] insert failed:', error?.message)
    return false
  }

  const orderId = (data as { id: string }).id
  const itemRows = order.items.map((it) => ({
    order_id: orderId,
    name: it.name,
    unit_price: it.price ?? null,
    qty: it.qty,
    image: it.image ?? null,
  }))

  const { error: itemsError } = await admin.from('order_items').insert(itemRows as never)
  if (itemsError) {
    console.error('[orders] order_items insert failed:', itemsError.message)
    return false
  }
  return true
}

function normalizeOrder(body: unknown): (Omit<OrderEmailPayload, 'items'> & { items: IncomingItem[] }) | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const customer = (b.customer ?? {}) as Record<string, unknown>
  const fulfillment = (b.fulfillment ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(b.items) ? b.items : []

  const awaitingQuote = b.awaitingQuote === true
  const trackingId = String(b.trackingId ?? '').trim()
  const items: IncomingItem[] = rawItems
    .map((it) => {
      const i = (it ?? {}) as Record<string, unknown>
      return {
        name: String(i.name ?? '').trim(),
        qty: Number(i.qty) || 0,
        // Requests carry no price, keep it undefined so it stays null in the DB.
        price: awaitingQuote ? undefined : Number(i.price) || 0,
        image: i.image ? String(i.image) : null,
      }
    })
    .filter((i) => i.name && i.qty > 0)

  if (!trackingId || items.length === 0) return null

  return {
    trackingId,
    createdAt: typeof b.createdAt === 'string' ? b.createdAt : undefined,
    customer: {
      fullName: String(customer.fullName ?? '').trim(),
      phone: String(customer.phone ?? '').trim(),
      email: String(customer.email ?? '').trim(),
    },
    fulfillment: {
      type: fulfillment.type === 'pickup' ? 'pickup' : 'delivery',
      address: fulfillment.address ? String(fulfillment.address) : undefined,
      area: fulfillment.area ? String(fulfillment.area) : undefined,
      notes: fulfillment.notes ? String(fulfillment.notes) : undefined,
    },
    items,
    awaitingQuote,
    subtotal: awaitingQuote ? undefined : Number(b.subtotal) || 0,
    total: awaitingQuote ? undefined : Number(b.total) || 0,
    paymentMethod: awaitingQuote ? undefined : b.paymentMethod === 'paystack' ? 'paystack' : 'bank_transfer',
    paymentReference: b.paymentReference ? String(b.paymentReference) : undefined,
  }
}
