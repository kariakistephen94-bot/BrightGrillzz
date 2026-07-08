import { createClient } from './server'

// Server-side data access for the admin dashboard. These run under the
// signed-in admin's session, so RLS (is_staff) governs what they can read.

export type OrderStatus =
  | 'awaiting_quote'
  | 'quoted'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export interface OrderLineItem {
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface AdminOrderRow {
  dbId: string
  id: string // tracking id
  customer: string
  email: string
  phone: string
  items: string // one-line summary, used in the table + search
  lineItems: OrderLineItem[]
  itemCount: number
  subtotal: number
  amount: number
  status: OrderStatus
  payment: 'paystack' | 'bank_transfer'
  paymentConfirmed: boolean
  paymentReference: string | null
  fulfillment: 'delivery' | 'pickup'
  area: string
  address: string | null
  notes: string | null
  cancellationNote: string | null
  riderNumber: string | null
  outForDeliveryAt: string | null
  customerPaidNotice: boolean
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

/* ----------------------------- pagination ------------------------------ */

export const ADMIN_PAGE_SIZE = 20

export interface Paged<T> {
  rows: T[]
  total: number // total matching rows across all pages
  page: number // 1-based
  pageSize: number
  pageCount: number
}

const emptyPage = <T>(page: number, pageSize = ADMIN_PAGE_SIZE): Paged<T> => ({
  rows: [],
  total: 0,
  page,
  pageSize,
  pageCount: 0,
})

// Clamp to a valid 1-based page and derive the inclusive Supabase .range().
function paginate(page: number | undefined, pageSize: number) {
  const p = Math.max(1, Math.floor(Number(page)) || 1)
  const from = (p - 1) * pageSize
  return { from, to: from + pageSize - 1, page: p, pageSize }
}

const pageCountOf = (total: number, pageSize: number) =>
  total > 0 ? Math.ceil(total / pageSize) : 0

// PostgREST `.or()`/`.ilike()` treat commas, parens and % specially, strip them
// from free-text search so a user's punctuation can't break the filter.
function sanitizeSearch(q: string | undefined): string {
  return (q ?? '').replace(/[,()%*\\]/g, ' ').trim()
}

/* ------------------------------- orders -------------------------------- */

const ORDER_SELECT =
  'id, tracking_id, status, customer_name, customer_email, customer_phone, fulfillment_type, address, area, notes, subtotal, total, payment_method, payment_confirmed, payment_reference, cancellation_note, rider_number, out_for_delivery_at, customer_paid_notice, created_at, order_items(name, qty, unit_price, line_total)'

type RawOrder = {
  id: string
  tracking_id: string
  status: OrderStatus
  customer_name: string
  customer_email: string | null
  customer_phone: string
  fulfillment_type: 'delivery' | 'pickup'
  address: string | null
  area: string | null
  notes: string | null
  subtotal: number
  total: number
  payment_method: 'paystack' | 'bank_transfer'
  payment_confirmed: boolean
  payment_reference: string | null
  cancellation_note: string | null
  rider_number: string | null
  out_for_delivery_at: string | null
  customer_paid_notice: boolean | null
  created_at: string
  order_items: { name: string; qty: number; unit_price: number; line_total: number }[] | null
}

function mapOrder(o: RawOrder): AdminOrderRow {
  const items = o.order_items ?? []
  const itemCount = items.reduce((n, it) => n + (it.qty || 0), 0)
  const lineItems: OrderLineItem[] = items.map((it) => ({
    name: it.name,
    qty: it.qty || 0,
    unitPrice: it.unit_price || 0,
    lineTotal: it.line_total ?? (it.unit_price || 0) * (it.qty || 0),
  }))
  const summary =
    lineItems.length === 0
      ? 'No items'
      : lineItems
          .map((it) => (it.qty > 1 ? `${it.name} ×${it.qty}` : it.name))
          .join(', ')
  return {
    dbId: o.id,
    id: o.tracking_id,
    customer: o.customer_name,
    email: o.customer_email ?? '',
    phone: o.customer_phone,
    items: summary,
    lineItems,
    itemCount,
    subtotal: o.subtotal ?? o.total,
    amount: o.total,
    status: o.status,
    payment: o.payment_method,
    paymentConfirmed: o.payment_confirmed,
    paymentReference: o.payment_reference,
    fulfillment: o.fulfillment_type,
    area: o.fulfillment_type === 'pickup' ? 'Kitchen pickup' : o.area ?? 'N/A',
    address: o.address,
    notes: o.notes,
    cancellationNote: o.cancellation_note,
    riderNumber: o.rider_number,
    outForDeliveryAt: o.out_for_delivery_at,
    customerPaidNotice: Boolean(o.customer_paid_notice),
    placed: fmtDateTime(o.created_at),
    createdAt: o.created_at,
  }
}

// Recent-orders list (dashboard). For the paginated admin table use getOrdersPage.
export async function getOrders(limit?: number): Promise<AdminOrderRow[]> {
  const supabase = await createClient()
  // Auto-complete any delivery still out for 24h+ before reading (no trigger).
  await supabase.rpc('complete_stale_deliveries')
  let query = supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error || !data) return []
  return (data as unknown as RawOrder[]).map(mapOrder)
}

export interface OrdersQuery {
  page?: number
  q?: string
  status?: OrderStatus | 'all'
}

// Server-side paginated + filtered orders for the admin table.
export async function getOrdersPage(opts: OrdersQuery = {}): Promise<Paged<AdminOrderRow>> {
  const supabase = await createClient()
  await supabase.rpc('complete_stale_deliveries')
  const { from, to, page, pageSize } = paginate(opts.page, ADMIN_PAGE_SIZE)

  let query = supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status)

  const q = sanitizeSearch(opts.q)
  if (q) {
    query = query.or(
      `tracking_id.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`,
    )
  }

  const { data, error, count } = await query.range(from, to)
  if (error || !data) return emptyPage<AdminOrderRow>(page)
  const total = count ?? 0
  return {
    rows: (data as unknown as RawOrder[]).map(mapOrder),
    total,
    page,
    pageSize,
    pageCount: pageCountOf(total, pageSize),
  }
}

export interface OrderStats {
  total: number
  awaiting_quote: number
  quoted: number
  pending: number
  preparing: number
  ready: number
  out_for_delivery: number
  completed: number
  cancelled: number
  revenueCompleted: number
}

// Whole-dataset counts for the stat cards + status tab badges.
export async function getOrderStats(): Promise<OrderStats> {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_order_stats').select('*').single()
  const d = (data ?? {}) as Record<string, number>
  return {
    total: d.total ?? 0,
    awaiting_quote: d.awaiting_quote ?? 0,
    quoted: d.quoted ?? 0,
    pending: d.pending ?? 0,
    preparing: d.preparing ?? 0,
    ready: d.ready ?? 0,
    out_for_delivery: d.out_for_delivery ?? 0,
    completed: d.completed ?? 0,
    cancelled: d.cancelled ?? 0,
    revenueCompleted: d.revenue_completed ?? 0,
  }
}

/* ------------------------------ customers ------------------------------ */

type CustomerSegment = AdminCustomerRow['segment']

const segmentOf = (orders: number): CustomerSegment =>
  orders >= 10 ? 'vip' : orders > 1 ? 'returning' : 'new'

export interface CustomersQuery {
  page?: number
  q?: string
  segment?: CustomerSegment | 'all'
}

// Server-side paginated customers, aggregated by the admin_customers view
// (grouped per customer) so grouping/sort/search all run in Postgres.
export async function getCustomersPage(opts: CustomersQuery = {}): Promise<Paged<AdminCustomerRow>> {
  const supabase = await createClient()
  const { from, to, page, pageSize } = paginate(opts.page, ADMIN_PAGE_SIZE)

  let query = supabase
    .from('admin_customers')
    .select('id, name, email, phone, orders, spent, last_order_at', { count: 'exact' })
    .order('spent', { ascending: false })

  // Segments are exclusive: vip ≥ 10, returning 2–9, new = 1.
  if (opts.segment === 'vip') query = query.gte('orders', 10)
  else if (opts.segment === 'returning') query = query.gte('orders', 2).lt('orders', 10)
  else if (opts.segment === 'new') query = query.eq('orders', 1)

  const q = sanitizeSearch(opts.q)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error, count } = await query.range(from, to)
  if (error || !data) return emptyPage<AdminCustomerRow>(page)

  const rows = (data as unknown as {
    id: string
    name: string
    email: string
    phone: string
    orders: number
    spent: number
    last_order_at: string
  }[]).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    orders: r.orders,
    spent: r.spent,
    lastOrder: dayFmt.format(new Date(r.last_order_at)),
    segment: segmentOf(r.orders),
  }))
  const total = count ?? 0
  return { rows, total, page, pageSize, pageCount: pageCountOf(total, pageSize) }
}

export interface CustomerStats {
  total: number
  vips: number
  avgSpent: number
  repeatRate: number // percent
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_customer_stats').select('*').single()
  const d = (data ?? {}) as Record<string, number>
  const total = d.total ?? 0
  return {
    total,
    vips: d.vips ?? 0,
    avgSpent: d.avg_spent ?? 0,
    repeatRate: total ? Math.round(((d.repeat_customers ?? 0) / total) * 100) : 0,
  }
}

/* ------------------------------- reviews ------------------------------- */

type RawReview = {
  id: string
  author: string
  role: string | null
  comment: string
  rating: number
  source: string | null
  is_published: boolean
  created_at: string
}

const mapReview = (r: RawReview): AdminReviewRow => ({
  id: r.id,
  author: r.author,
  role: r.role ?? '',
  comment: r.comment,
  rating: r.rating,
  date: dayFmt.format(new Date(r.created_at)),
  source: r.source ?? 'Website',
  published: r.is_published,
})

export interface ReviewsQuery {
  page?: number
  tab?: 'all' | 'published' | 'hidden'
}

export async function getReviewsPage(opts: ReviewsQuery = {}): Promise<Paged<AdminReviewRow>> {
  const supabase = await createClient()
  const { from, to, page, pageSize } = paginate(opts.page, ADMIN_PAGE_SIZE)

  let query = supabase
    .from('reviews')
    .select('id, author, role, comment, rating, source, is_published, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (opts.tab === 'published') query = query.eq('is_published', true)
  else if (opts.tab === 'hidden') query = query.eq('is_published', false)

  const { data, error, count } = await query.range(from, to)
  if (error || !data) return emptyPage<AdminReviewRow>(page)
  const total = count ?? 0
  return {
    rows: (data as unknown as RawReview[]).map(mapReview),
    total,
    page,
    pageSize,
    pageCount: pageCountOf(total, pageSize),
  }
}

export interface ReviewStats {
  total: number
  published: number
  hidden: number
  avg: number
  distribution: { star: number; count: number }[]
}

export async function getReviewStats(): Promise<ReviewStats> {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_review_stats').select('*').single()
  const d = (data ?? {}) as Record<string, number>
  const total = d.total ?? 0
  return {
    total,
    published: d.published ?? 0,
    hidden: total - (d.published ?? 0),
    avg: d.avg_rating ?? 0,
    distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: d[`r${star}`] ?? 0 })),
  }
}

/* ------------------------------ analytics ------------------------------ */

export type AnalyticsRange = '24h' | '7d' | '30d' | '3m' | '1y'

export interface AnalyticsData {
  range: AnalyticsRange
  bucket: 'hour' | 'day' | 'week' | 'month'
  kpis: {
    revenue: number
    orders: number
    avg_order_value: number
    customers: number
    revenue_delta_pct: number | null
    orders_delta_pct: number | null
  }
  series: { ts: string; revenue: number; orders: number }[]
  by_category: { category: string; revenue: number }[]
  top_items: { name: string; orders: number; revenue: number }[]
  splits: { delivery: number; pickup: number; paystack: number; bank_transfer: number }
}

const EMPTY_ANALYTICS = (range: AnalyticsRange): AnalyticsData => ({
  range,
  bucket: range === '24h' ? 'hour' : range === '3m' ? 'week' : range === '1y' ? 'month' : 'day',
  kpis: { revenue: 0, orders: 0, avg_order_value: 0, customers: 0, revenue_delta_pct: null, orders_delta_pct: null },
  series: [],
  by_category: [],
  top_items: [],
  splits: { delivery: 0, pickup: 0, paystack: 0, bank_transfer: 0 },
})

/** One-call, window-scoped analytics (KPIs + time series + splits). */
export async function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_analytics', { p_range: range } as never)
  if (error || !data) return EMPTY_ANALYTICS(range)
  return { ...EMPTY_ANALYTICS(range), ...(data as Partial<AnalyticsData>) }
}

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

/* --------------------------------- menu -------------------------------- */

export interface AdminMenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string | null
  badge: string | null
  rating: number
  isAvailable: boolean
  sortOrder: number
}

type RawMenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  image: string | null
  badge: string | null
  rating: number | null
  is_available: boolean
  sort_order: number
}

const MENU_SELECT = 'id, name, description, price, category, image, badge, rating, is_available, sort_order'

const mapMenuItem = (m: RawMenuItem): AdminMenuItem => ({
  id: m.id,
  name: m.name,
  description: m.description ?? '',
  price: m.price,
  category: m.category ?? '',
  image: m.image,
  badge: m.badge,
  rating: m.rating ?? 0,
  isAvailable: m.is_available,
  sortOrder: m.sort_order,
})

export interface MenuQuery {
  page?: number
  q?: string
  category?: string
}

export async function getMenuPage(opts: MenuQuery = {}): Promise<Paged<AdminMenuItem>> {
  const supabase = await createClient()
  const { from, to, page, pageSize } = paginate(opts.page, ADMIN_PAGE_SIZE)

  let query = supabase
    .from('menu_items')
    .select(MENU_SELECT, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (opts.category && opts.category !== 'All') query = query.eq('category', opts.category)
  const q = sanitizeSearch(opts.q)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error, count } = await query.range(from, to)
  if (error || !data) return emptyPage<AdminMenuItem>(page)
  const total = count ?? 0
  return {
    rows: (data as unknown as RawMenuItem[]).map(mapMenuItem),
    total,
    page,
    pageSize,
    pageCount: pageCountOf(total, pageSize),
  }
}

export interface MenuFacets {
  categories: string[]
  badges: string[]
  total: number
  available: number
}

// Distinct categories/badges (for the filter tabs + modal dropdowns) and the
// whole-menu counts, independent of the current page. Menus are small, so the
// two-column scan for distinct values is cheap.
export async function getMenuFacets(): Promise<MenuFacets> {
  const supabase = await createClient()
  const [facetRes, statsRes] = await Promise.all([
    supabase.from('menu_items').select('category, badge'),
    supabase.from('admin_menu_stats').select('*').single(),
  ])
  const rows = (facetRes.data ?? []) as { category: string | null; badge: string | null }[]
  const categories = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[]
  const badges = Array.from(new Set(rows.map((r) => r.badge).filter(Boolean))) as string[]
  const s = (statsRes.data ?? {}) as Record<string, number>
  return { categories, badges, total: s.total ?? 0, available: s.available ?? 0 }
}

/* ---------------------------- reservations ----------------------------- */

export type ReservationStatus = 'new' | 'confirmed' | 'closed' | 'cancelled'

export interface AdminReservationRow {
  id: string
  name: string
  phone: string
  email: string
  eventType: string
  location: string
  eventAt: string | null
  eventAtLabel: string
  guests: number | null
  package: string
  notes: string
  status: ReservationStatus
  placed: string
  createdAt: string
}

type RawReservation = {
  id: string
  name: string
  phone: string
  email: string | null
  event_type: string | null
  location: string | null
  event_at: string | null
  guests: number | null
  package: string | null
  notes: string | null
  status: string | null
  created_at: string
}

const mapReservation = (r: RawReservation): AdminReservationRow => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email ?? '',
  eventType: r.event_type ?? '',
  location: r.location ?? '',
  eventAt: r.event_at,
  eventAtLabel: r.event_at ? fmtDateTime(r.event_at) : 'Not set',
  guests: r.guests,
  package: r.package ?? '',
  notes: r.notes ?? '',
  status: (r.status as ReservationStatus) ?? 'new',
  placed: fmtDateTime(r.created_at),
  createdAt: r.created_at,
})

export interface ReservationsQuery {
  page?: number
  q?: string
  status?: ReservationStatus | 'all'
}

const RESERVATION_SELECT =
  'id, name, phone, email, event_type, location, event_at, guests, package, notes, status, created_at'

export async function getReservationsPage(opts: ReservationsQuery = {}): Promise<Paged<AdminReservationRow>> {
  const supabase = await createClient()
  const { from, to, page, pageSize } = paginate(opts.page, ADMIN_PAGE_SIZE)

  let query = supabase
    .from('reservations')
    .select(RESERVATION_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status)

  const q = sanitizeSearch(opts.q)
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)

  const { data, error, count } = await query.range(from, to)
  if (error || !data) return emptyPage<AdminReservationRow>(page)
  const total = count ?? 0
  return {
    rows: (data as unknown as RawReservation[]).map(mapReservation),
    total,
    page,
    pageSize,
    pageCount: pageCountOf(total, pageSize),
  }
}

export interface ReservationStats {
  total: number
  new: number
  confirmed: number
  closed: number
  cancelled: number
}

export async function getReservationStats(): Promise<ReservationStats> {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_reservation_stats').select('*').single()
  const d = (data ?? {}) as Record<string, number>
  return {
    total: d.total ?? 0,
    new: d.new ?? 0,
    confirmed: d.confirmed ?? 0,
    closed: d.closed ?? 0,
    cancelled: d.cancelled ?? 0,
  }
}

/* -------------------------------- users -------------------------------- */

export type UserRole = 'customer' | 'staff' | 'admin'

export interface AdminUserRow {
  id: string
  name: string
  email: string
  role: UserRole
  joined: string
  createdAt: string
}

type RawProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  created_at: string
}

const mapProfile = (p: RawProfile): AdminUserRow => ({
  id: p.id,
  name: p.full_name || (p.email ? p.email.split('@')[0] : 'User'),
  email: p.email ?? '',
  role: p.role,
  joined: dayFmt.format(new Date(p.created_at)),
  createdAt: p.created_at,
})

export interface UsersQuery {
  page?: number
  q?: string
  role?: UserRole | 'all'
}

// Server-side paginated + filtered users (profiles). RLS lets staff/admin read.
export async function getUsersPage(opts: UsersQuery = {}): Promise<Paged<AdminUserRow>> {
  const supabase = await createClient()
  const { from, to, page, pageSize } = paginate(opts.page, ADMIN_PAGE_SIZE)

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (opts.role && opts.role !== 'all') query = query.eq('role', opts.role)

  const q = sanitizeSearch(opts.q)
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)

  const { data, error, count } = await query.range(from, to)
  if (error || !data) return emptyPage<AdminUserRow>(page)
  const total = count ?? 0
  return {
    rows: (data as unknown as RawProfile[]).map(mapProfile),
    total,
    page,
    pageSize,
    pageCount: pageCountOf(total, pageSize),
  }
}

export interface UserStats {
  total: number
  admin: number
  staff: number
  customer: number
}

export async function getUserStats(): Promise<UserStats> {
  const supabase = await createClient()
  const countRole = async (role?: UserRole): Promise<number> => {
    let q = supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (role) q = q.eq('role', role)
    const { count } = await q
    return count ?? 0
  }
  const [total, admin, staff, customer] = await Promise.all([
    countRole(),
    countRole('admin'),
    countRole('staff'),
    countRole('customer'),
  ])
  return { total, admin, staff, customer }
}
