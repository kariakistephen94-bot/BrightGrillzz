'use client'

import * as React from 'react'
import { Loader2, Mail, MapPin, Phone, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import { PageHeader, Pill, StatusBadge, type OrderStatus } from '@/components/admin/ui'
import type { AdminOrderRow } from '@/lib/supabase/queries'
import { deleteOrder, updateOrderStatus } from '@/app/admin/(protected)/actions'

const TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const paymentLabel = (p: AdminOrderRow['payment']) =>
  p === 'paystack' ? 'Paystack' : 'Bank transfer'

export function OrdersView({ orders }: { orders: AdminOrderRow[] }) {
  const [tab, setTab] = React.useState<OrderStatus | 'all'>('all')
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<AdminOrderRow | null>(null)

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1
    return c
  }, [orders])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (tab !== 'all' && o.status !== tab) return false
      if (!q) return true
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.items.toLowerCase().includes(q)
      )
    })
  }, [tab, query, orders])

  const revenueDone = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage incoming orders." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total orders" value={String(orders.length)} />
        <MiniStat label="Pending" value={String(counts.pending ?? 0)} tone="chart-3" />
        <MiniStat label="In kitchen" value={String(counts.preparing ?? 0)} tone="primary" />
        <MiniStat label="Revenue (completed)" value={formatNaira(revenueDone)} tone="success" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 text-[0.7rem] font-semibold', tab === t.key ? 'bg-primary-foreground/20' : 'bg-muted')}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders…"
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
              {filtered.map((o) => (
                <tr
                  key={o.dbId}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">#{o.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-foreground">{o.customer}</div>
                    <div className="text-xs text-muted-foreground">{o.area}</div>
                  </td>
                  <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">{o.items}</td>
                  <td className="px-5 py-3.5 font-medium tabular-nums text-foreground">{formatNaira(o.amount)}</td>
                  <td className="px-5 py-3.5">
                    <Pill tone={o.payment === 'paystack' ? 'primary' : 'muted'}>{paymentLabel(o.payment)}</Pill>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground">{o.placed}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDrawer order={selected} onClose={() => setSelected(null)} />
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

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}

function OrderDrawer({ order, onClose }: { order: AdminOrderRow | null; onClose: () => void }) {
  const [pending, startTransition] = React.useTransition()

  const advance = order ? NEXT_STATUS[order.status] : undefined

  const run = (fn: () => Promise<void>, closeAfter = false) =>
    startTransition(async () => {
      await fn()
      if (closeAfter) onClose()
    })

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
                <h2 className="text-lg font-bold text-foreground">#{order.id}</h2>
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

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{order.customer}</p>
                <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {order.phone}</p>
                  {order.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {order.email}</p>}
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {order.fulfillment === 'delivery' ? order.area : 'Pickup at kitchen'}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</p>
                <div className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                  {order.items}
                  <p className="mt-1 text-xs text-muted-foreground">{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-border bg-background p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment</span>
                  <span className="font-medium text-foreground">{paymentLabel(order.payment)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fulfillment</span>
                  <span className="font-medium capitalize text-foreground">{order.fulfillment}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatNaira(order.amount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2 border-t border-border p-5">
              <div className="grid grid-cols-2 gap-2">
                {advance ? (
                  <button
                    disabled={pending}
                    onClick={() => run(() => updateOrderStatus(order.dbId, advance))}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Mark {advance}
                  </button>
                ) : (
                  <button disabled className="h-10 rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground">
                    {order.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'completed' ? (
                  <button
                    disabled={pending}
                    onClick={() => run(() => updateOrderStatus(order.dbId, 'cancelled'))}
                    className="h-10 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    Cancel order
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <button
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete order #${order.id}? This cannot be undone.`)) {
                    run(() => deleteOrder(order.dbId), true)
                  }
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete order
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
