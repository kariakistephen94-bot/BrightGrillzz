import Link from 'next/link'
import { CalendarDays, TrendingUp } from 'lucide-react'
import { formatNaira, formatNairaCompact } from '@/lib/format'
import { StatCard } from '@/components/admin/StatCard'
import { StatusBadge } from '@/components/admin/ui'
import { RevenueAreaChart, CategoryDonut } from '@/components/admin/charts'
import {
  getOverview,
  getRevenueByWeek,
  getSalesByCategory,
  getTopItems,
  getOrders,
} from '@/lib/supabase/queries'
import { requireAdmin } from '@/lib/admin/require-admin'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const [overview, revenueByWeek, salesByCategory, topItems, recentOrders] = await Promise.all([
    getOverview(),
    getRevenueByWeek(),
    getSalesByCategory(),
    getTopItems(),
    getOrders(6),
  ])

  const maxItemOrders = Math.max(...topItems.map((t) => t.orders), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&rsquo;s what&rsquo;s happening at BrightGrillzz.
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Last 30 days
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatNaira(overview.revenue_30d)} compactValue={formatNairaCompact(overview.revenue_30d)} delta={overview.revenue_delta_pct} hint="vs. previous 30 days" />
        <StatCard label="Orders" value={overview.orders_30d.toLocaleString()} delta={overview.orders_delta_pct} hint="vs. previous 30 days" />
        <StatCard label="Avg. Order Value" value={formatNaira(overview.avg_order_value)} compactValue={formatNairaCompact(overview.avg_order_value)} hint="last 30 days" />
        <StatCard label="New Customers" value={overview.new_customers_30d.toLocaleString()} hint="last 30 days" />
      </div>

      {/* Revenue + category */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Revenue overview</h2>
              <p className="text-sm text-muted-foreground">Weekly revenue, last 12 weeks</p>
            </div>
            {overview.revenue_delta_pct != null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${overview.revenue_delta_pct >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <TrendingUp className="h-3.5 w-3.5" />
                {overview.revenue_delta_pct >= 0 ? '+' : ''}{overview.revenue_delta_pct}%
              </span>
            )}
          </div>
          <div className="mt-4">
            <RevenueAreaChart data={revenueByWeek} />
          </div>
        </section>

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
      </div>

      {/* Top items + recent orders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      <p className="shrink-0 text-sm font-semibold text-foreground">
                        <span className="sm:hidden">{formatNairaCompact(item.revenue)}</span>
                        <span className="hidden sm:inline">{formatNaira(item.revenue)}</span>
                      </p>
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

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent orders</h2>
              <p className="text-sm text-muted-foreground">Latest activity</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.dbId} className="border-t border-border/60 transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium text-foreground">#{o.id}</td>
                      <td className="px-5 py-3 text-muted-foreground">{o.customer}</td>
                      <td className="px-5 py-3 font-medium tabular-nums text-foreground">{formatNaira(o.amount)}</td>
                      <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
