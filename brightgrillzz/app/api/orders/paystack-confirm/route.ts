import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { verifyPaystackReference } from '@/lib/paystack.server'

// Customer-facing: called when Paystack redirects back after a quote payment.
// Verifies the transaction against Paystack, checks it matches this order's
// stored reference + amount, then marks the order paid and starts the kitchen.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  const b = (body ?? {}) as { tracking?: unknown; reference?: unknown }
  const tracking = String(b.tracking ?? '').trim()
  const reference = String(b.reference ?? '').trim()
  if (!tracking || !reference) {
    return NextResponse.json({ ok: false, error: 'Missing tracking or reference' }, { status: 400 })
  }
  if (!isServiceRoleConfigured) {
    return NextResponse.json({ ok: false, error: 'Payments not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('id, total, pay_reference, payment_confirmed')
    .ilike('tracking_id', tracking)
    .single()
  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
  }
  const order = data as { id: string; total: number | null; pay_reference: string | null; payment_confirmed: boolean }

  if (order.payment_confirmed) {
    return NextResponse.json({ ok: true, confirmed: true, already: true })
  }
  // The reference must be the one we created for THIS order.
  if (order.pay_reference && order.pay_reference !== reference) {
    return NextResponse.json({ ok: false, error: 'Reference does not match this order' }, { status: 400 })
  }

  const verified = await verifyPaystackReference(reference)
  if (!verified) {
    return NextResponse.json({ ok: false, error: 'Could not verify payment' }, { status: 502 })
  }
  const expectedKobo = Math.round((order.total ?? 0) * 100)
  if (!verified.success || (expectedKobo > 0 && verified.amountKobo !== expectedKobo)) {
    return NextResponse.json({ ok: false, error: 'Payment not successful or amount mismatch' }, { status: 400 })
  }

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
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, confirmed: true }, { headers: { 'Cache-Control': 'no-store' } })
}
