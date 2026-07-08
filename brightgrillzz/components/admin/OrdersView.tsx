'use client'

import * as React from 'react'
import {
  BadgeCheck,
  BadgeX,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Tag,
  Truck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import { PageHeader, Pill, StatusBadge, type OrderStatus } from '@/components/admin/ui'
import type { AdminOrderRow, OrderStats, Paged } from '@/lib/supabase/queries'
import { setPaymentConfirmed, updateOrderStatus } from '@/app/admin/(protected)/actions'
import { Pagination } from './Pagination'
import { CopyButton } from '@/components/ui/CopyButton'
import { SearchInput } from './SearchInput'
import { useListNav } from './useListNav'
import { QuoteDialog } from './QuoteDialog'
import { confirmQuotePaid } from '@/app/admin/(protected)/quote-actions'

const TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_quote', label: 'To quote' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const paymentLabel = (p: AdminOrderRow['payment']) =>
  p === 'paystack' ? 'Paystack' : 'Bank transfer'

export function OrdersView({
  data,
  stats,
  q,
  status,
}: {
  data: Paged<AdminOrderRow>
  stats: OrderStats
  q: string
  status: OrderStatus | 'all'
}) {
  const { setParams, pending } = useListNav()
  const [orders, setOrders] = React.useState(data.rows)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Optimistic active tab so the highlight moves the instant you click, without
  // waiting for the server round-trip. Reconciled when the server status lands.
  const [activeTab, setActiveTab] = React.useState<OrderStatus | 'all'>(status)
  const [prevStatus, setPrevStatus] = React.useState(status)
  if (status !== prevStatus) {
    setPrevStatus(status)
    setActiveTab(status)
  }

  // Reconcile with fresh server data after a revalidation or page/filter change,
  // without dropping the open drawer (the drawer reads the order out of this same
  // list). Done in render (not an effect) so the new server truth shows without
  // an extra pass.
  const [prevRows, setPrevRows] = React.useState(data.rows)
  if (data.rows !== prevRows) {
    setPrevRows(data.rows)
    setOrders(data.rows)
  }

  const patchOrder = React.useCallback((dbId: string, patch: Partial<AdminOrderRow>) => {
    setOrders((prev) => prev.map((o) => (o.dbId === dbId ? { ...o, ...patch } : o)))
  }, [])

  const removeOrder = React.useCallback((dbId: string) => {
    setOrders((prev) => prev.filter((o) => o.dbId !== dbId))
  }, [])

  const selected = React.useMemo(
    () => orders.find((o) => o.dbId === selectedId) ?? null,
    [orders, selectedId],
  )

  // Tab badges reflect the whole dataset (from the DB), not just this page.
  const tabCount = (key: OrderStatus | 'all') => (key === 'all' ? stats.total : stats[key])

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage incoming orders." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total orders" value={String(stats.total)} />
        <MiniStat label="Pending" value={String(stats.pending)} tone="chart-3" />
        <MiniStat label="In kitchen" value={String(stats.preparing)} tone="primary" />
        <MiniStat label="Revenue (completed)" value={formatNaira(stats.revenueCompleted)} tone="success" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key)
                setParams({ status: t.key === 'all' ? null : t.key })
              }}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 text-[0.7rem] font-semibold', activeTab === t.key ? 'bg-primary-foreground/20' : 'bg-muted')}>
                {tabCount(t.key)}
              </span>
            </button>
          ))}
        </div>

        <SearchInput initial={q} placeholder="Search orders…" />
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-opacity',
          pending && 'pointer-events-none opacity-60',
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.dbId}
                  onClick={() => setSelectedId(o.dbId)}
                  className="cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-3.5 text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{o.id}</span>
                      <CopyButton value={o.id} label="Tracking ID" className="h-6 w-6 text-muted-foreground hover:bg-muted/50 hover:text-foreground" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-foreground">{o.customer}</div>
                    <div className="text-xs text-muted-foreground">{o.area}</div>
                  </td>
                  <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">{o.items}</td>
                  <td className="px-5 py-3.5 font-medium tabular-nums text-foreground">{formatNaira(o.amount)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Pill tone={o.payment === 'paystack' ? 'primary' : 'muted'}>{paymentLabel(o.payment)}</Pill>
                      {o.payment === 'bank_transfer' && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                            o.paymentConfirmed ? 'bg-success/10 text-success' : 'bg-chart-3/15 text-chart-3',
                          )}
                        >
                          {o.paymentConfirmed ? 'Paid' : 'Unpaid'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground">{o.placed}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {stats.total === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} />

      <OrderDrawer
        order={selected}
        onClose={() => setSelectedId(null)}
        onPatch={patchOrder}
        onRemove={removeOrder}
      />
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone = 'foreground',
}: {
  label: string
  value: string
  tone?: 'foreground' | 'primary' | 'success' | 'chart-3'
}) {
  const toneClass: Record<string, string> = {
    foreground: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    'chart-3': 'text-chart-3',
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1.5 text-2xl font-bold tracking-tight', toneClass[tone])}>{value}</p>
    </div>
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

// The next status in the pipeline. Delivery orders route through
// out_for_delivery; pickup orders go straight from ready to completed.
function nextStatus(order: AdminOrderRow): OrderStatus | undefined {
  switch (order.status) {
    case 'pending':
      return 'preparing'
    case 'preparing':
      return 'ready'
    case 'ready':
      return order.fulfillment === 'delivery' ? 'out_for_delivery' : 'completed'
    case 'out_for_delivery':
      return 'completed'
    case 'quoted':
      // Once the customer has paid the quote, start the kitchen.
      return 'preparing'
    default:
      return undefined
  }
}

function advanceLabel(next: OrderStatus, order: AdminOrderRow): string {
  switch (next) {
    case 'preparing':
      return 'Mark preparing'
    case 'ready':
      return 'Mark ready'
    case 'out_for_delivery':
      return 'Send out for delivery'
    case 'completed':
      return order.fulfillment === 'pickup' ? 'Mark picked up' : 'Mark completed'
    default:
      return `Mark ${next}`
  }
}

function OrderDrawer({
  order,
  onClose,
  onPatch,
  onRemove,
}: {
  order: AdminOrderRow | null
  onClose: () => void
  onPatch: (dbId: string, patch: Partial<AdminOrderRow>) => void
  onRemove: (dbId: string) => void
}) {
  const [busy, setBusy] = React.useState<null | 'status' | 'payment' | 'delete'>(null)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [cancelNote, setCancelNote] = React.useState('')
  const [dispatchOpen, setDispatchOpen] = React.useState(false)
  const [rider, setRider] = React.useState('')
  const [quoteOpen, setQuoteOpen] = React.useState(false)

  // Reset the inline forms whenever a different order opens (render-phase sync,
  // cheaper and lint-clean vs. an effect).
  const dbId = order?.dbId
  const [prevDbId, setPrevDbId] = React.useState(dbId)
  if (dbId !== prevDbId) {
    setPrevDbId(dbId)
    setCancelOpen(false)
    setCancelNote('')
    setDispatchOpen(false)
    setRider('')
    setBusy(null)
    setQuoteOpen(false)
  }

  const advance = order ? nextStatus(order) : undefined

  // Optimistically apply a patch, run the server action, keep the drawer open.
  // Reverts the optimistic patch if the server rejects (e.g. the 24h gate).
  const runStatus = async (
    status: OrderStatus,
    opts: { note?: string; riderNumber?: string } = {},
  ) => {
    if (!order) return
    const prev = order
    setBusy('status')
    onPatch(order.dbId, {
      status,
      ...(status === 'cancelled' ? { cancellationNote: opts.note?.trim() || null } : {}),
      ...(status === 'out_for_delivery'
        ? { riderNumber: opts.riderNumber?.trim() || null, outForDeliveryAt: new Date().toISOString() }
        : {}),
    })
    const res = await updateOrderStatus(order.dbId, status, opts)
    if (res && !res.ok) {
      onPatch(prev.dbId, {
        status: prev.status,
        riderNumber: prev.riderNumber,
        outForDeliveryAt: prev.outForDeliveryAt,
        cancellationNote: prev.cancellationNote,
      })
      alert(res.error)
    }
    setBusy(null)
    setCancelOpen(false)
    setCancelNote('')
    setDispatchOpen(false)
    setRider('')
  }

  const runPayment = async (confirmed: boolean) => {
    if (!order) return
    setBusy('payment')
    onPatch(order.dbId, { paymentConfirmed: confirmed })
    await setPaymentConfirmed(order.dbId, confirmed)
    setBusy(null)
  }

  // Quoted order paid by bank transfer: confirm + start the kitchen in one step.
  const runQuotePaid = async () => {
    if (!order) return
    const prev = order
    setBusy('payment')
    onPatch(order.dbId, { status: 'preparing', paymentConfirmed: true })
    const res = await confirmQuotePaid(order.dbId)
    if (res && !res.ok) {
      onPatch(prev.dbId, { status: prev.status, paymentConfirmed: prev.paymentConfirmed })
      alert(res.error)
    }
    setBusy(null)
  }


  const pending = busy !== null

  // A clock that ticks each minute, kept in state so render stays pure and the
  // 24h gate/countdown update on their own while the drawer is open.
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  // 24h completion gate for an out-for-delivery order.
  const dispatchedAt = order?.outForDeliveryAt ? new Date(order.outForDeliveryAt).getTime() : null
  const msSinceDispatch = dispatchedAt != null ? now - dispatchedAt : null
  const completeGated = order?.status === 'out_for_delivery'
  const canComplete = !completeGated || (msSinceDispatch != null && msSinceDispatch >= DAY_MS)
  const hoursLeft = msSinceDispatch != null ? Math.max(1, Math.ceil((DAY_MS - msSinceDispatch) / 3_600_000)) : null

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity',
          order ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out',
          order ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {order && (
          <div className="flex min-h-full flex-col">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Order</p>
                <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">#{order.id}</h2>
            <CopyButton value={order.id} label="Tracking ID" className="h-7 w-7" />
          </div>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between">
                <StatusBadge status={order.status} />
                <span className="text-sm text-muted-foreground">{order.placed}</span>
              </div>

              {(order.status === 'awaiting_quote' || order.status === 'quoted') && (
                <button
                  onClick={() => setQuoteOpen(true)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-secondary to-[#9e1730] text-sm font-semibold text-white"
                >
                  <Tag className="h-4 w-4" />
                  {order.status === 'awaiting_quote' ? 'Quote this request' : 'Edit or resend quote'}
                </button>
              )}

              {order.status === 'quoted' && (
                <div className="rounded-2xl border border-chart-3/30 bg-chart-3/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-chart-3">Payment</p>
                  <p className="mt-1 text-sm text-foreground">
                    {order.customerPaidNotice
                      ? 'The customer reported a bank transfer. Confirm once it lands in your account.'
                      : 'Waiting on payment. Online (Paystack) payments confirm automatically; confirm a bank transfer here once it lands.'}
                  </p>
                  <button
                    disabled={pending}
                    onClick={() => runQuotePaid()}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-success text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-60"
                  >
                    {busy === 'payment' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                    Confirm bank payment &amp; start
                  </button>
                </div>
              )}

              {order.status === 'cancelled' && order.cancellationNote && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Note to customer</p>
                  <p className="mt-1 text-foreground">{order.cancellationNote}</p>
                </div>
              )}

              {order.riderNumber && (order.status === 'out_for_delivery' || order.status === 'completed') && (
                <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Rider</p>
                  <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
                    <Truck className="h-3.5 w-3.5" /> {order.riderNumber}
                  </p>
                  {order.outForDeliveryAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Dispatched {new Date(order.outForDeliveryAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Recipient & fulfillment details */}
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2">
                  {order.fulfillment === 'delivery' ? (
                    <Truck className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}
                  </p>
                </div>

                <dl className="mt-3 space-y-3">
                  <div>
                    <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Name</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{order.customer}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Phone</dt>
                    <dd className="mt-0.5 text-sm">
                      <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {order.phone}
                      </a>
                    </dd>
                  </div>
                  {order.email && (
                    <div>
                      <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
                      <dd className="mt-0.5 text-sm">
                        <a href={`mailto:${order.email}`} className="inline-flex max-w-full items-center gap-1.5 truncate font-medium text-foreground hover:text-primary">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{order.email}</span>
                        </a>
                      </dd>
                    </div>
                  )}
                  {order.fulfillment === 'delivery' ? (
                    <>
                      <div>
                        <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Delivery address</dt>
                        <dd className="mt-0.5 text-sm font-medium text-foreground">{order.address || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Area / landmark</dt>
                        <dd className="mt-0.5 text-sm font-medium text-foreground">
                          {order.area && order.area !== 'N/A' ? order.area : 'N/A'}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <div>
                      <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Pickup</dt>
                      <dd className="mt-0.5 text-sm font-medium text-foreground">Collect at our kitchen</dd>
                    </div>
                  )}
                </dl>

                {order.notes && (
                  <div className="mt-3 rounded-xl bg-muted/60 p-3">
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Note</p>
                    <p className="mt-0.5 text-sm text-foreground">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Itemized order */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Items · {order.itemCount}
                </p>
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
                  {order.lineItems.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">No items recorded.</p>
                  ) : (
                    order.lineItems.map((it, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 p-3.5">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="mt-0.5 inline-flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums text-foreground">
                            {it.qty}×
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                            <p className="text-xs text-muted-foreground">{formatNaira(it.unitPrice)} each</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatNaira(it.lineTotal)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment & totals */}
              <div className="space-y-2 rounded-2xl border border-border bg-background p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-foreground">{formatNaira(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment</span>
                  <span className="font-medium text-foreground">{paymentLabel(order.payment)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment status</span>
                  <span className={cn('font-semibold', order.paymentConfirmed ? 'text-success' : 'text-chart-3')}>
                    {order.paymentConfirmed ? 'Confirmed' : 'Awaiting confirmation'}
                  </span>
                </div>
                {order.payment === 'paystack' && order.paymentReference && (
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span className="shrink-0">Reference</span>
                    <span className="truncate font-mono text-xs text-foreground">{order.paymentReference}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Fulfillment</span>
                  <span className="font-medium capitalize text-foreground">{order.fulfillment}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums text-primary">{formatNaira(order.amount)}</span>
                </div>
              </div>

              {/* Bank-transfer payment confirmation */}
              {order.payment === 'bank_transfer' && order.status !== 'quoted' && order.status !== 'awaiting_quote' && (
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank transfer</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.paymentConfirmed
                      ? 'Payment confirmed. You can revert if this was a mistake.'
                      : 'Confirm once the transfer lands in your account.'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      disabled={pending || order.paymentConfirmed}
                      onClick={() => runPayment(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-success text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-50"
                    >
                      {busy === 'payment' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                      Confirm payment
                    </button>
                    <button
                      disabled={pending || !order.paymentConfirmed}
                      onClick={() => runPayment(false)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <BadgeX className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-2 border-t border-border p-5">
              {/* Inline cancel form with a note to the customer */}
              {cancelOpen ? (
                <div className="space-y-2 rounded-2xl border border-border bg-background p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Note to customer (optional)
                  </label>
                  <textarea
                    value={cancelNote}
                    onChange={(e) => setCancelNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Sorry, we&rsquo;re out of an item, a refund is on the way."
                    className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={pending}
                      onClick={() => runStatus('cancelled', { note: cancelNote })}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-destructive text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-60"
                    >
                      {busy === 'status' && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm cancel
                    </button>
                    <button
                      disabled={pending}
                      onClick={() => {
                        setCancelOpen(false)
                        setCancelNote('')
                      }}
                      className="h-10 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : dispatchOpen ? (
                <div className="space-y-2 rounded-2xl border border-border bg-background p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rider phone number
                  </label>
                  <input
                    autoFocus
                    value={rider}
                    onChange={(e) => setRider(e.target.value)}
                    inputMode="tel"
                    placeholder="e.g. 0803 000 0000"
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                  <p className="text-xs text-muted-foreground">
                    Shared with the customer so they can reach the rider.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={pending || !rider.trim()}
                      onClick={() => runStatus('out_for_delivery', { riderNumber: rider })}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {busy === 'status' && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send out
                    </button>
                    <button
                      disabled={pending}
                      onClick={() => {
                        setDispatchOpen(false)
                        setRider('')
                      }}
                      className="h-10 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {completeGated && !canComplete && (
                    <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Out for delivery, waiting for the customer to confirm. You can mark it completed in ~{hoursLeft}h if they don&rsquo;t.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {advance ? (
                      <button
                        disabled={pending || (advance === 'completed' && !canComplete)}
                        onClick={() => {
                          if (advance === 'out_for_delivery') setDispatchOpen(true)
                          else runStatus(advance)
                        }}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        {busy === 'status' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {advanceLabel(advance, order)}
                      </button>
                    ) : (
                      <button disabled className="h-10 rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground">
                        {order.status === 'completed'
                          ? 'Completed'
                          : order.status === 'awaiting_quote'
                            ? 'Quote to proceed'
                            : 'Cancelled'}
                      </button>
                    )}
                    {order.status === 'pending' ||
                    order.status === 'preparing' ||
                    order.status === 'ready' ||
                    order.status === 'awaiting_quote' ||
                    order.status === 'quoted' ? (
                      <button
                        disabled={pending}
                        onClick={() => setCancelOpen(true)}
                        className="h-10 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                      >
                        Cancel order
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {quoteOpen && dbId && <QuoteDialog dbId={dbId} onClose={() => setQuoteOpen(false)} />}
    </>
  )
}
