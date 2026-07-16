import type { CartItem } from '@/context/cart-context'

export type FulfillmentType = 'delivery' | 'pickup'

export type PaymentMethod = 'bank_transfer' | 'paystack'

export interface OrderCustomer {
  fullName: string
  phone: string
  email: string
}

export interface OrderFulfillment {
  type: FulfillmentType
  address: string
  area: string
  notes: string
}

export interface Order {
  trackingId: string
  createdAt: string
  customer: OrderCustomer
  fulfillment: OrderFulfillment
  items: CartItem[]
  /**
   * True for a request-a-quote order: the customer has picked items but no price
   * has been set yet. Amounts and payment stay undefined until we send a quote.
   */
  awaitingQuote?: boolean
  subtotal?: number
  total?: number
  paymentConfirmed?: boolean
  /** Optional because orders saved before Paystack existed default to bank transfer. */
  paymentMethod?: PaymentMethod
  /** Paystack transaction reference, only present on Paystack orders. */
  paymentReference?: string
}

export function getPaymentMethod(order: Order): PaymentMethod {
  return order.paymentMethod ?? 'bank_transfer'
}

export function paymentMethodLabel(order: Order): string {
  return getPaymentMethod(order) === 'paystack' ? 'Paystack (online)' : 'Bank Transfer'
}

const ORDERS_KEY = 'brightgrillzz-orders'
const LAST_ORDER_KEY = 'brightgrillzz-last-order'

export function generateTrackingId(): string {
  const time = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BG-${time.slice(-5)}${rand}`
}

export function saveOrder(order: Order): void {
  if (typeof window === 'undefined') return
  const existing = getOrders()
  existing.unshift(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(existing.slice(0, 50)))
  sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
}

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

export function getLastOrder(): Order | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY)
    return raw ? (JSON.parse(raw) as Order) : null
  } catch {
    return null
  }
}

export function getOrderByTrackingId(trackingId: string): Order | null {
  const normalized = trackingId.trim().toUpperCase()
  return getOrders().find((o) => o.trackingId.toUpperCase() === normalized) ?? null
}

/**
 * Builds an Order from the `order` payload returned by /api/orders/paystack-confirm
 * so the Paystack callback page can render a receipt without relying on
 * localStorage (which is missing when the customer paid on another device).
 * `fallback` (a matching local order, if any) fills in anything the API omits.
 */
export function orderFromApiReceipt(raw: unknown, fallback?: Order | null): Order | null {
  if (!raw || typeof raw !== 'object') return fallback ?? null
  const o = raw as Record<string, unknown>
  const trackingId = String(o.trackingId ?? '').trim()
  if (!trackingId) return fallback ?? null

  const customer = (o.customer ?? {}) as Record<string, unknown>
  const fulfillment = (o.fulfillment ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : []

  const items: CartItem[] = rawItems.map((it, i) => {
    const id = String(it.id ?? `${trackingId}-${i}`)
    return {
      id,
      cartId: id,
      name: String(it.name ?? ''),
      qty: Number(it.qty) || 0,
      image: String(it.image ?? ''),
      price: Number(it.price) || 0,
    }
  })

  return {
    trackingId,
    createdAt: String(o.createdAt ?? fallback?.createdAt ?? new Date().toISOString()),
    customer: {
      fullName: String(customer.fullName ?? '').trim() || fallback?.customer.fullName || '',
      phone: String(customer.phone ?? '').trim() || fallback?.customer.phone || '',
      email: String(customer.email ?? '').trim() || fallback?.customer.email || '',
    },
    fulfillment: {
      type: fulfillment.type === 'pickup' ? 'pickup' : 'delivery',
      address: String(fulfillment.address ?? '').trim() || fallback?.fulfillment.address || '',
      area: String(fulfillment.area ?? '').trim() || fallback?.fulfillment.area || '',
      notes: fallback?.fulfillment.notes ?? '',
    },
    items: items.length > 0 ? items : fallback?.items ?? [],
    subtotal: Number(o.subtotal) || fallback?.subtotal || 0,
    total: Number(o.total) || fallback?.total || 0,
    paymentMethod: 'paystack',
    paymentReference: String(o.paymentReference ?? '').trim() || fallback?.paymentReference,
    paymentConfirmed: Boolean(o.paymentConfirmed),
  }
}
