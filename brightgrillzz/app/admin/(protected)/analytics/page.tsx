import Link from 'next/link'
import { formatNaira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/admin/ui'
import { StatCard } from '@/components/admin/StatCard'
import {
  RevenueAreaChart,
  OrdersBarChart,
  CategoryDonut,
  AovLineChart,
} from '@/components/admin/charts'
import { getAnalytics, type AnalyticsRange } from '@/lib/supabase/queries'
import { requireAdmin } from '@/lib/admin/require-admin'

export const dynamic = 'force-dynamic'

const RANGES: { key: AnalyticsRange; label: string; hint: string }[] = [
  { key: '24h', label: '24 hours', hint: 'vs. previous 24 hours' },
  { key: '7d', label: 'Last 7 days', hint: 'vs. previous 7 days' },
  { key: '30d', label: 'Last 30 days', hint: 'vs. previous 30 days' },
  { key: '3m', label: 'Last 3 months', hint: 'vs. previous 3 months' },
  { key: '1y', label: 'Yearly', hint: 'vs. previous year' },
]

const hourFmt = new Intl.DateTimeFormat('en-NG', { hour: 'numeric' })
const dayFmt = new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('en-NG', { month: 'short' })

function labelFor(ts: string, bucket: string): string {
  const d = new Date(ts)
  if (bucket === 'hour') return hourFmt.format(d)
  if (bucket === 'month') return monthFmt.format(d)
  return dayFmt.format(d) // day + week
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  await requireAdmin()
  const rangeParam = (await searchParams).range
  const range: AnalyticsRange = RANGES.some((r) => r.key === rangeParam)
    ? (rangeParam as AnalyticsRange)
    : '30d'
  const active = RANGES.find((r) => r.key === range)!

  const data = await getAnalytics(range)

  const series = data.series.map((s) => ({
    label: labelFor(s.ts, data.bucket),
    revenue: s.revenue,
    orders: s.orders,
  }))
  const revenueSeries = series.map((s) => ({ period: s.label, revenue: s.revenue }))
  const ordersSeries = series.map((s) => ({ day: s.label, orders: s.orders }))
  const aovTrend = series.map((s) => ({
    period: s.label,
    aov: s.orders ? Math.round(s.revenue / s.orders) : 0,
  }))

  const catTotal = data.by_category.reduce((s, c) => s + c.revenue, 0) || 1
  const salesByCategory = data.by_category.map((c, i) => ({
    category: c.category,
    value: Math.round((c.revenue / catTotal) * 100),
    key: `${c.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
  }))

  const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)
  const totalOrders = data.kpis.orders
  const fulfillmentSplit = [
    { name: 'Delivery', key: 'delivery', value: pct(data.splits.delivery, totalOrders) },
    { name: 'Pickup', key: 'pickup', value: pct(data.splits.pickup, totalOrders) },
  ]
  const paymentSplit = [
    { name: 'Paystack', key: 'paystack', value: pct(data.splits.paystack, totalOrders) },
    { name: 'Bank transfer', key: 'bank', value: pct(data.splits.bank_transfer, totalOrders) },
  ]
  const topItems = data.top_items
  const maxItemOrders = Math.max(...topItems.map((t) => t.orders), 1)

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Performance across revenue, orders and menu.">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              scroll={false}
              className={cn(
                'inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                r.key === range
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatNaira(data.kpis.revenue)} delta={data.kpis.revenue_delta_pct} hint={active.hint} />
        <StatCard label="Orders" value={data.kpis.orders.toLocaleString()} delta={data.kpis.orders_delta_pct} hint={active.hint} />
        <StatCard label="Avg. Order Value" value={formatNaira(data.kpis.avg_order_value)} hint={active.label.toLowerCase()} />
        <StatCard label="Customers" value={data.kpis.customers.toLocaleString()} hint={active.label.toLowerCase()} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Revenue overview</h2>
        <p className="text-sm text-muted-foreground">Revenue · {active.label.toLowerCase()}</p>
        <div className="mt-4">
          <RevenueAreaChart data={revenueSeries} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Average order value</h2>
          <p className="text-sm text-muted-foreground">Trend · {active.label.toLowerCase()}</p>
          <div className="mt-4">
            <AovLineChart data={aovTrend} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Orders over time</h2>
          <p className="text-sm text-muted-foreground">Orders · {active.label.toLowerCase()}</p>
          <div className="mt-4">
            <OrdersBarChart data={ordersSeries} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Sales by category</h2>
          <p className="text-sm text-muted-foreground">Share of total sales</p>
          <CategoryDonut data={salesByCategory} />
          <ul className="mt-2 space-y-2.5">
            {salesByCategory.map((c, i) => (
              <li key={c.key} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: `var(--color-chart-${(i % 5) + 1})` }} />
                <span className="flex-1 text-muted-foreground">{c.category}</span>
                <span className="font-medium tabular-nums text-foreground">{c.value}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <SplitCard title="Fulfillment" subtitle="Delivery vs pickup" data={fulfillmentSplit} />
          <SplitCard title="Payment method" subtitle="How guests pay" data={paymentSplit} />
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Top selling items</h2>
        <p className="text-sm text-muted-foreground">By quantity ordered · {active.label.toLowerCase()}</p>
        {topItems.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {topItems.map((item, i) => (
              <li key={item.name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="shrink-0 text-sm font-semibold text-foreground">{formatNaira(item.revenue)}</p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(item.orders / maxItemOrders) * 100}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.orders} sold</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SplitCard({
  title,
  subtitle,
  data,
}: {
  title: string
  subtitle: string
  data: { name: string; value: number; key: string }[]
}) {
  const colors = ['bg-primary', 'bg-secondary']
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4 space-y-4">
        {data.map((d, i) => (
          <div key={d.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-semibold text-foreground">{d.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${d.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
