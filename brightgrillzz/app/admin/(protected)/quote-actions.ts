'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings.server'
import { createPaystackLink } from '@/lib/paystack.server'
import { sendQuoteEmail, sendOrderStatusEmail } from '@/lib/email/send'
import { waLink } from '@/lib/whatsapp'
import { formatNaira } from '@/lib/format'

// All mutations run under the signed-in admin's session (RLS is_staff).

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface QuoteLine {
  orderItemId: string
  menuItemId: string | null
  name: string
  qty: number
  /** Prefilled price: today's locked price, else the menu reference, else 0. */
  suggested: number
  /** True when the suggestion came from a price already set for today. */
  lockedToday: boolean
}

export interface QuoteDraft {
  ok: boolean
  error?: string
  trackingId: string
  customerName: string
  email: string
  phone: string
  status: string
  lines: QuoteLine[]
}

type OrderItemRow = { id: string; name: string; qty: number; menu_item_id: string | null; unit_price: number | null }

/** Loads a request's items with a suggested price per line (daily → reference). */
export async function getQuoteDraft(dbId: string): Promise<QuoteDraft> {
  const empty: QuoteDraft = { ok: false, trackingId: '', customerName: '', email: '', phone: '', status: '', lines: [] }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('tracking_id, customer_name, customer_email, customer_phone, status, order_items(id, name, qty, menu_item_id, unit_price)')
    .eq('id', dbId)
    .single()
  if (error || !data) return { ...empty, error: 'Order not found' }

  const o = data as {
    tracking_id: string
    customer_name: string
    customer_email: string | null
    customer_phone: string
    status: string
    order_items: OrderItemRow[] | null
  }
  const items = o.order_items ?? []
  const menuIds = [...new Set(items.map((it) => it.menu_item_id).filter(Boolean))] as string[]

  const [dailyRes, menuRes] = await Promise.all([
    menuIds.length
      ? supabase.from('daily_item_prices').select('menu_item_id, price').eq('day', today()).in('menu_item_id', menuIds)
      : Promise.resolve({ data: [] as { menu_item_id: string; price: number }[] }),
    menuIds.length
      ? supabase.from('menu_items').select('id, price').in('id', menuIds)
      : Promise.resolve({ data: [] as { id: string; price: number }[] }),
  ])
  const daily = new Map((dailyRes.data ?? []).map((d) => [d.menu_item_id, d.price]))
  const reference = new Map((menuRes.data ?? []).map((m) => [m.id, m.price]))

  const lines: QuoteLine[] = items.map((it) => {
    const lockedToday = it.menu_item_id != null && daily.has(it.menu_item_id)
    const suggested =
      it.unit_price ??
      (it.menu_item_id != null ? daily.get(it.menu_item_id) ?? reference.get(it.menu_item_id) : undefined) ??
      0
    return {
      orderItemId: it.id,
      menuItemId: it.menu_item_id,
      name: it.name,
      qty: it.qty,
      suggested,
      lockedToday,
    }
  })

  return {
    ok: true,
    trackingId: o.tracking_id,
    customerName: o.customer_name,
    email: o.customer_email ?? '',
    phone: o.customer_phone,
    status: o.status,
    lines,
  }
}

/** Saves per-item prices, totals the order, marks it 'quoted', and locks today's prices. */
export async function saveQuote(dbId: string, lines: { orderItemId: string; menuItemId: string | null; unitPrice: number }[]) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  for (const line of lines) {
    const price = Math.max(0, Math.round(Number(line.unitPrice) || 0))
    await supabase.from('order_items').update({ unit_price: price } as never).eq('id', line.orderItemId)
  }

  // Lock today's price for each known menu item.
  const dailyRows = lines
    .filter((l) => l.menuItemId)
    .map((l) => ({ menu_item_id: l.menuItemId, day: today(), price: Math.max(0, Math.round(Number(l.unitPrice) || 0)), updated_at: now }))
  if (dailyRows.length) {
    await supabase.from('daily_item_prices').upsert(dailyRows as never, { onConflict: 'menu_item_id,day' })
  }

  // Recompute totals from the freshly-priced items.
  const { data: fresh } = await supabase.from('order_items').select('unit_price, qty').eq('order_id', dbId)
  const total = ((fresh ?? []) as { unit_price: number | null; qty: number }[]).reduce(
    (sum, it) => sum + (it.unit_price ?? 0) * it.qty,
    0,
  )

  // Clear any previously generated pay link: the amount may have changed, so a
  // fresh Paystack link must be created for the new total on the next send/pay.
  const { error } = await supabase
    .from('orders')
    .update({
      subtotal: total,
      total,
      status: 'quoted',
      quoted_at: now,
      pay_url: null,
      pay_reference: null,
    } as never)
    .eq('id', dbId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/orders')
  return { ok: true as const, total }
}

/**
 * Admin confirms a bank transfer for a quoted order: marks it paid and starts
 * the kitchen (status → preparing), then notifies the customer. Online payments
 * confirm themselves via the Paystack callback, so this is the bank-transfer path.
 */
export async function confirmQuotePaid(dbId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('orders')
    .update({
      payment_confirmed: true,
      payment_method: 'bank_transfer',
      status: 'preparing',
      updated_at: now,
    } as never)
    .eq('id', dbId)
  if (error) return { ok: false as const, error: error.message }

  const { data } = await supabase
    .from('orders')
    .select('tracking_id, customer_name, customer_email, fulfillment_type, total')
    .eq('id', dbId)
    .single()
  const row = data as { tracking_id: string; customer_name: string; customer_email: string | null; fulfillment_type: 'delivery' | 'pickup'; total: number } | null
  if (row?.customer_email) {
    await sendOrderStatusEmail('preparing', row.customer_email, {
      trackingId: row.tracking_id,
      customerName: row.customer_name,
      fulfillmentType: row.fulfillment_type,
      total: row.total,
    })
  }

  revalidatePath('/admin/orders')
  return { ok: true as const }
}

/**
 * Sends the priced quote to the customer: email (with bank details + a Paystack
 * pay link) and a prefilled WhatsApp deep link the admin opens to send.
 */
export async function sendOrderQuote(dbId: string, note?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('tracking_id, customer_name, customer_email, customer_phone, total, order_items(name, qty, unit_price)')
    .eq('id', dbId)
    .single()
  if (error || !data) return { ok: false as const, error: 'Order not found' }

  const o = data as {
    tracking_id: string
    customer_name: string
    customer_email: string | null
    customer_phone: string
    total: number | null
    order_items: { name: string; qty: number; unit_price: number | null }[] | null
  }
  const items = (o.order_items ?? []).map((it) => ({ name: it.name, qty: it.qty, unitPrice: it.unit_price ?? 0 }))
  const total = o.total ?? items.reduce((s, it) => s + it.unitPrice * it.qty, 0)
  if (total <= 0) return { ok: false as const, error: 'Set the prices and save the quote first.' }

  const settings = await getSiteSettings()
  const bank = { bank: settings.bank, accountNumber: settings.accountNumber, accountName: settings.accountName }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const link = o.customer_email
    ? await createPaystackLink({
        email: o.customer_email,
        amountNaira: total,
        reference: o.tracking_id,
        callbackUrl: baseUrl ? `${baseUrl}/order/paid?tracking=${encodeURIComponent(o.tracking_id)}` : undefined,
      })
    : null
  const payLink = link?.authorizationUrl ?? null

  // Persist the pay link on the order so the tracking page can offer it too.
  if (link) {
    await supabase.from('orders').update({ pay_url: link.authorizationUrl, pay_reference: link.reference } as never).eq('id', dbId)
  }

  let emailed = false
  if (o.customer_email) {
    const res = await sendQuoteEmail(o.customer_email, {
      trackingId: o.tracking_id,
      customerName: o.customer_name,
      items,
      total,
      note,
      bank,
      payLink: payLink ?? undefined,
    })
    emailed = res.sent
  }

  // Prefilled WhatsApp message for the admin to send.
  const lines = [
    `Hello ${o.customer_name.split(/\s+/)[0]}, here is your Bright Grillzz quote.`,
    `Tracking ID: ${o.tracking_id}`,
    '',
    ...items.map((it) => `• ${it.name} × ${it.qty}: ${formatNaira(it.unitPrice * it.qty)}`),
    `Total: ${formatNaira(total)}`,
    '',
    payLink ? `Pay online: ${payLink}` : '',
    `Or transfer to ${bank.bank} ${bank.accountNumber} (${bank.accountName}).`,
    note ? `\n${note}` : '',
  ].filter(Boolean)
  const whatsappUrl = waLink(o.customer_phone, lines.join('\n'))

  return { ok: true as const, emailed, whatsappUrl, payLink }
}
