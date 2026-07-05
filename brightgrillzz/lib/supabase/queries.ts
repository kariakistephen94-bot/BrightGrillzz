import { createClient } from './server'

// Server-side data access for the admin dashboard. These run under the
// signed-in admin's session, so RLS (is_staff) governs what they can read.

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export interface AdminOrderRow {
  dbId: string
  id: string // tracking id
  customer: string
  email: string
  phone: string
  items: string
  itemCount: number
  amount: number
  status: OrderStatus
  payment: 'paystack' | 'bank_transfer'
  fulfillment: 'delivery' | 'pickup'
  area: string
  placed: string
  createdAt: string
}

export interface AdminCustomerRow {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  spent: number
  lastOrder: string
  segment: 'vip' | 'returning' | 'new'
}

export interface AdminReviewRow {
  id: string
  author: string
  role: string
  comment: string
  rating: number
  date: string
  source: string
  published: boolean
}

export interface DashboardOverview {
  revenue_30d: number
  orders_30d: number
  avg_order_value: number
  new_customers_30d: number
  revenue_delta_pct: number | null
  orders_delta_pct: number | null
}

const dateFmt = new Intl.DateTimeFormat('en-NG', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const dayFmt = new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric' })

function fmtDateTime(iso: string): string {
  try {
    return dateFmt.format(new Date(iso))
  } catch {
    return iso
  }
}

/* ------------------------------- orders -------------------------------- */

type RawOrder = {
  id: string
  tracking_id: string
  status: OrderStatus
  customer_name: string
  customer_email: string | null
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup'
  area: string | null
  total: number
  payment_method: 'paystack' | 'bank_transfer'
  created_at: string
  order_items: { name: string; qty: number }[] | null
}

function mapOrder(o: RawOrder): AdminOrderRow {
  const items = o.order_items ?? []
  const itemCount = items.reduce((n, it) => n + (it.qty || 0), 0)
  const summary =
    items.length === 0
      ? '—'
      : items
          .map((it) => (it.qty > 1 ? `${it.name} ×${it.qty}` : it.name))
          .join(', ')
  return {
    dbId: o.id,
    id: o.tracking_id,
    customer: o.customer_name,
    email: o.customer_email ?? '',
    phone: o.customer_phone,
    items: summary,
    itemCount,
    amount: o.total,
    status: o.status,
    payment: o.payment_method,
    fulfillment: o.fulfillment_type,
    area: o.fulfillment_type === 'pickup' ? 'Kitchen pickup' : o.area ?? '—',
    placed: fmtDateTime(o.created_at),
    createdAt: o.created_at,
  }
}

export async function getOrders(limit?: number): Promise<AdminOrderRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select(
      'id, tracking_id, status, customer_name, customer_email, customer_phone, fulfillment_type, area, total, payment_method, created_at, order_items(name, qty)',
    )
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error || !data) return []
  return (data as unknown as RawOrder[]).map(mapOrder)
}

/* ------------------------------ customers ------------------------------ */

export async function getCustomers(): Promise<AdminCustomerRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('customer_name, customer_email, customer_phone, total, created_at')
    .order('created_at', { ascending: false })
  if (error || !data) return []

  const rows = data as unknown as {
    customer_name: string
    customer_email: string | null
    customer_phone: string
    total: number
    created_at: string
  }[]

  const map = new Map<string, AdminCustomerRow & { _last: number }>()
  for (const r of rows) {
    const key = (r.customer_email || r.customer_phone || r.customer_name).toLowerCase()
    const ts = new Date(r.created_at).getTime()
    const existing = map.get(key)
    if (existing) {
      existing.orders += 1
      existing.spent += r.total
      if (ts > existing._last) {
        existing._last = ts
        existing.lastOrder = dayFmt.format(new Date(r.created_at))
      }
    } else {
      map.set(key, {
        id: key,
        name: r.customer_name,
        email: r.customer_email ?? '',
        phone: r.customer_phone,
        orders: 1,
        spent: r.total,
        lastOrder: dayFmt.format(new Date(r.created_at)),
        segment: 'new',
        _last: ts,
      })
    }
  }

  return Array.from(map.values())
    .map(({ _last, ...c }) => ({
      ...c,
      segment: (c.orders >= 10 ? 'vip' : c.orders > 1 ? 'returning' : 'new') as
        | 'vip'
        | 'returning'
        | 'new',
    }))
    .sort((a, b) => b.spent - a.spent)
}

/* ------------------------------- reviews ------------------------------- */

export async function getReviews(): Promise<AdminReviewRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author, role, comment, rating, source, is_published, created_at')
    .order('created_at', { ascending: false })
  if (error || !data) return []

  return (data as unknown as {
    id: string
    author: string
    role: string | null
    comment: string
    rating: number
    source: string | null
    is_published: boolean
    created_at: string
  }[]).map((r) => ({
    id: r.id,
    author: r.author,
    role: r.role ?? '',
    comment: r.comment,
    rating: r.rating,
    date: dayFmt.format(new Date(r.created_at)),
    source: r.source ?? 'Website',
    published: r.is_published,
  }))
}

/* ------------------------------ analytics ------------------------------ */

export async function getOverview(): Promise<DashboardOverview> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_overview')
  const empty: DashboardOverview = {
    revenue_30d: 0,
    orders_30d: 0,
    avg_order_value: 0,
    new_customers_30d: 0,
    revenue_delta_pct: null,
    orders_delta_pct: null,
  }
  if (error || !data) return empty
  return { ...empty, ...(data as Partial<DashboardOverview>) }
}

export async function getRevenueByWeek(): Promise<
  { period: string; revenue: number; orders: number }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_revenue_by_week')
    .select('week_start, revenue, orders')
  if (!data) return []
  return (data as unknown as { week_start: string; revenue: number; orders: number }[]).map(
    (r) => ({ period: dayFmt.format(new Date(r.week_start)), revenue: r.revenue, orders: r.orders }),
  )
}

export async function getOrdersByWeekday(): Promise<{ day: string; orders: number }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_orders_by_weekday')
    .select('iso_dow, day, orders')
  if (!data) return []
  return (data as unknown as { day: string; orders: number }[]).map((r) => ({
    day: r.day,
    orders: r.orders,
  }))
}

export async function getSalesByCategory(): Promise<
  { category: string; value: number; key: string }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_sales_by_category')
    .select('category, revenue')
  if (!data) return []
  const rows = data as unknown as { category: string; revenue: number }[]
  const total = rows.reduce((s, r) => s + Number(r.revenue), 0) || 1
  return rows.map((r) => ({
    category: r.category,
    value: Math.round((Number(r.revenue) / total) * 100),
    key: r.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }))
}

export async function getTopItems(): Promise<
  { name: string; orders: number; revenue: number }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_top_items')
    .select('name, orders, revenue')
    .limit(5)
  if (!data) return []
  return data as unknown as { name: string; orders: number; revenue: number }[]
}
