import { NextResponse } from 'next/server'
import { sendOrderEmails } from '@/lib/email/send'
import type { OrderEmailPayload } from '@/lib/email/templates'

// Sends the customer confirmation + restaurant new-order alert.
// Frontend calls this after an order is placed (fire-and-forget, keepalive).
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

  const result = await sendOrderEmails(order)
  return NextResponse.json({ ok: true, ...result })
}

function normalizeOrder(body: unknown): OrderEmailPayload | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const customer = (b.customer ?? {}) as Record<string, unknown>
  const fulfillment = (b.fulfillment ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(b.items) ? b.items : []

  const trackingId = String(b.trackingId ?? '').trim()
  const items = rawItems
    .map((it) => {
      const i = (it ?? {}) as Record<string, unknown>
      return {
        name: String(i.name ?? '').trim(),
        qty: Number(i.qty) || 0,
        price: Number(i.price) || 0,
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
    subtotal: Number(b.subtotal) || 0,
    total: Number(b.total) || 0,
    paymentMethod: b.paymentMethod === 'paystack' ? 'paystack' : 'bank_transfer',
    paymentReference: b.paymentReference ? String(b.paymentReference) : undefined,
  }
}
