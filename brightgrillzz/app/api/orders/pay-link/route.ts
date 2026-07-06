import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { createPaystackLink } from '@/lib/paystack.server'

// Customer-facing: returns a Paystack payment link for a quoted, unpaid order so
// the customer can pay online from their tracking page. Reuses the order's
// stored link when present, otherwise creates one and saves it.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  const id = String((body as { id?: unknown })?.id ?? '').trim()
  if (!id) return NextResponse.json({ ok: false, error: 'Missing tracking id' }, { status: 400 })
  if (!isServiceRoleConfigured) {
    return NextResponse.json({ ok: false, error: 'Online payment unavailable' }, { status: 503 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('id, tracking_id, total, customer_email, status, payment_confirmed, pay_url')
    .ilike('tracking_id', id)
    .single()
  if (error || !data) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })

  const o = data as {
    id: string
    tracking_id: string
    total: number | null
    customer_email: string | null
    status: string
    payment_confirmed: boolean
    pay_url: string | null
  }

  if (o.payment_confirmed) return NextResponse.json({ ok: false, error: 'This order is already paid' }, { status: 409 })
  if (o.status !== 'quoted' && o.status !== 'pending') {
    return NextResponse.json({ ok: false, error: 'This order is not ready for payment yet' }, { status: 409 })
  }
  if (!(Number(o.total) > 0)) {
    return NextResponse.json({ ok: false, error: 'No quote amount set yet' }, { status: 409 })
  }
  if (o.pay_url) return NextResponse.json({ ok: true, url: o.pay_url })

  if (!o.customer_email) {
    return NextResponse.json({ ok: false, error: 'No email on file for online payment' }, { status: 409 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const link = await createPaystackLink({
    email: o.customer_email,
    amountNaira: Number(o.total),
    reference: o.tracking_id,
    callbackUrl: baseUrl ? `${baseUrl}/order/paid?tracking=${encodeURIComponent(o.tracking_id)}` : undefined,
  })
  if (!link) {
    return NextResponse.json({ ok: false, error: 'Online payment unavailable right now' }, { status: 503 })
  }

  await admin
    .from('orders')
    .update({ pay_url: link.authorizationUrl, pay_reference: link.reference } as never)
    .eq('id', o.id)

  return NextResponse.json({ ok: true, url: link.authorizationUrl }, { headers: { 'Cache-Control': 'no-store' } })
}
