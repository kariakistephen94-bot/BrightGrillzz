import { CalendarDays } from 'lucide-react'
import { formatNaira } from '@/lib/format'
import { PageHeader } from '@/components/admin/ui'
import { StatCard } from '@/components/admin/StatCard'
import {
  RevenueAreaChart,
  OrdersBarChart,
  CategoryDonut,
  AovLineChart,
} from '@/components/admin/charts'
import {
  getOverview,
  getRevenueByWeek,
  getOrdersByWeekday,
  getSalesByCategory,
  getTopItems,
  getOrders,
} from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [overview, revenueByWeek, ordersByWeekday, salesByCategory, topItems, orders] =
    await Promise.all([
      getOverview(),
      getRevenueByWeek(),
      getOrdersByWeekday(),
      getSalesByCategory(),
      getTopItems(),
      getOrders(),
    ])

  const aovTrend = revenueByWeek.map((w) => ({
    period: w.period,
    aov: w.orders ? Math.round(w.revenue / w.orders) : 0,
  }))

  const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)
  const total = orders.length
  const fulfillmentSplit = [
    { name: 'Delivery', key: 'delivery', value: pct(orders.filter((o) => o.fulfillment === 'delivery').length, total) },
    { name: 'Pickup', key: 'pickup', value: pct(orders.filter((o) => o.fulfillment === 'pickup').length, total) },
  ]
  const paymentSplit = [
    { name: 'Paystack', key: 'paystack', value: pct(orders.filter((o) => o.payment === 'paystack').length, total) },
    { name: 'Bank transfer', key: 'bank', value: pct(orders.filter((o) => o.payment === 'bank_transfer').length, total) },
  ]
  const maxItemOrders = Math.max(...topItems.map((t) => t.orders), 1)

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Performance across revenue, orders and menu.">
        <button className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Last 12 weeks
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatNaira(overview.revenue_30d)} delta={overview.revenue_delta_pct} hint="vs. previous 30 days" />
        <StatCard label="Orders" value={overview.orders_30d.toLocaleString()} delta={overview.orders_delta_pct} hint="vs. previous 30 days" />
        <StatCard label="Avg. Order Value" value={formatNaira(overview.avg_order_value)} hint="last 30 days" />
        <StatCard label="New Customers" value={overview.new_customers_30d.toLocaleString()} hint="last 30 days" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Revenue overview</h2>
        <p className="text-sm text-muted-foreground">Weekly revenue, last 12 weeks</p>
        <div className="mt-4">
          <RevenueAreaChart data={revenueByWeek} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Average order value</h2>
          <p className="text-sm text-muted-foreground">Trend across the last 12 weeks</p>
          <div className="mt-4">
            <AovLineChart data={aovTrend} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Orders by day</h2>
          <p className="text-sm text-muted-foreground">Orders per weekday</p>
          <div className="mt-4">
            <OrdersBarChart data={ordersByWeekday} />
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
        <p className="text-sm text-muted-foreground">By quantity ordered</p>
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
