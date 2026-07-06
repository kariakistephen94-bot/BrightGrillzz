'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendOrderStatusEmail } from '@/lib/email/send'
import type { OrderStatusEventKind } from '@/lib/email/templates'
import type { OrderStatus } from '@/lib/supabase/queries'

// All mutations run under the signed-in admin's session — RLS (is_staff)
// enforces that only staff/admins can write.

type OrderStateRow = {
  status: OrderStatus
  out_for_delivery_at: string | null
  tracking_id: string
  customer_name: string
  customer_email: string | null
  fulfillment_type: 'delivery' | 'pickup'
  total: number
}

type OrderEmailRow = Pick<
  OrderStateRow,
  'tracking_id' | 'customer_name' | 'customer_email' | 'fulfillment_type' | 'total'
>;

const DAY_MS = 24 * 60 * 60 * 1000

// Maps a status transition to the customer-facing email we fire (if any).
const STATUS_EMAIL: Partial<Record<OrderStatus, OrderStatusEventKind>> = {
  preparing: 'preparing',
  ready: 'ready',
  out_for_delivery: 'out_for_delivery',
  completed: 'delivered',
  cancelled: 'cancelled',
}

export async function updateOrderStatus(
  dbId: string,
  status: OrderStatus,
  opts: { note?: string; riderNumber?: string } = {},
) {
  const { note, riderNumber } = opts
  const supabase = await createClient()

  // Current state — needed for the 24h completion gate and the email payload.
  const { data } = await supabase
    .from('orders')
    .select('status, out_for_delivery_at, tracking_id, customer_name, customer_email, fulfillment_type, total')
    .eq('id', dbId)
    .single()
  const cur = data as OrderStateRow | null

  // Dispatching a delivery requires the rider's number.
  if (status === 'out_for_delivery' && !riderNumber?.trim()) {
    return { ok: false as const, error: 'A rider number is required to send an order out for delivery.' }
  }

  // An out-for-delivery order can only be MANUALLY completed 24h after dispatch
  // — before that, completion comes from the customer's confirm (or auto-sweep).
  if (
    status === 'completed' &&
    cur?.status === 'out_for_delivery' &&
    cur.out_for_delivery_at &&
    Date.now() - new Date(cur.out_for_delivery_at).getTime() < DAY_MS
  ) {
    return {
      ok: false as const,
      error: 'You can complete this 24h after dispatch, or once the customer confirms delivery.',
    }
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'cancelled') patch.cancellation_note = note?.trim() || null
  if (status === 'out_for_delivery') {
    patch.rider_number = riderNumber!.trim()
    patch.out_for_delivery_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orders')
    .update(patch as never)
    .eq('id', dbId)

  if (error) return { ok: false as const, error: error.message }

  // Fire the matching customer email (best-effort, never blocks the update).
  const kind = STATUS_EMAIL[status]
  if (kind && cur?.customer_email) {
    await sendOrderStatusEmail(kind, cur.customer_email, {
      trackingId: cur.tracking_id,
      customerName: cur.customer_name,
      fulfillmentType: cur.fulfillment_type,
      total: cur.total,
      note: status === 'cancelled' ? note?.trim() : undefined,
      riderNumber: status === 'out_for_delivery' ? riderNumber?.trim() : undefined,
    })
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true as const }
}

export async function setPaymentConfirmed(dbId: string, confirmed: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ payment_confirmed: confirmed, updated_at: new Date().toISOString() } as never)
    .eq('id', dbId)

  if (error) return { ok: false as const, error: error.message }

  if (confirmed) {
    const { data } = await supabase
      .from('orders')
      .select('tracking_id, customer_name, customer_email, fulfillment_type, total')
      .eq('id', dbId)
      .single()
    const row = data as OrderEmailRow | null
    if (row?.customer_email) {
      await sendOrderStatusEmail('payment_confirmed', row.customer_email, {
        trackingId: row.tracking_id,
        customerName: row.customer_name,
        fulfillmentType: row.fulfillment_type,
        total: row.total,
      })
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true as const }
}

export async function deleteOrder(dbId: string) {
  const supabase = await createClient()
  await supabase.from('orders').delete().eq('id', dbId)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true as const }
}

export async function setReviewPublished(id: string, published: boolean) {
  const supabase = await createClient()
  await supabase
    .from('reviews')
    .update({ is_published: published } as never)
    .eq('id', id)
  revalidatePath('/admin/reviews')
}

export async function deleteReview(id: string) {
  const supabase = await createClient()
  await supabase.from('reviews').delete().eq('id', id)
  revalidatePath('/admin/reviews')
}
