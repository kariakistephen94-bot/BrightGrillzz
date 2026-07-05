'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import { PageHeader } from '@/components/admin/ui'
import type { AdminCustomerRow } from '@/lib/supabase/queries'

type Segment = 'vip' | 'returning' | 'new'

const SEGMENTS: { key: Segment | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vip', label: 'VIP' },
  { key: 'returning', label: 'Returning' },
  { key: 'new', label: 'New' },
]

const segmentStyles: Record<Segment, string> = {
  vip: 'bg-chart-3/15 text-chart-3',
  returning: 'bg-primary/10 text-primary',
  new: 'bg-success/10 text-success',
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

export function CustomersView({ customers }: { customers: AdminCustomerRow[] }) {
  const [segment, setSegment] = React.useState<Segment | 'all'>('all')
  const [query, setQuery] = React.useState('')

  const filtered = customers.filter((c) => {
    if (segment !== 'all' && c.segment !== segment) return false
    const q = query.trim().toLowerCase()
    if (q && !(c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))) return false
    return true
  })

  const totalSpent = customers.reduce((s, c) => s + c.spent, 0)
  const avgSpent = customers.length ? Math.round(totalSpent / customers.length) : 0
  const vips = customers.filter((c) => c.segment === 'vip').length
  const repeat = customers.filter((c) => c.orders > 1).length
  const repeatRate = customers.length ? Math.round((repeat / customers.length) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Your guests, ranked by spend and loyalty." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total customers" value={String(customers.length)} />
        <MiniStat label="VIPs" value={String(vips)} tone="chart-3" />
        <MiniStat label="Avg. lifetime spend" value={formatNaira(avgSpent)} tone="primary" />
        <MiniStat label="Repeat rate" value={`${repeatRate}%`} tone="success" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 rounded-full border border-border bg-card p-1">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                segment === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers…"
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 text-right font-medium">Orders</th>
                <th className="px-5 py-3 text-right font-medium">Total spent</th>
                <th className="px-5 py-3 font-medium">Last order</th>
                <th className="px-5 py-3 font-medium">Segment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(c.name)}
                      </span>
                      <div className="font-medium text-foreground">{c.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {c.email && <div>{c.email}</div>}
                    <div className="text-xs">{c.phone}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium tabular-nums text-foreground">{c.orders}</td>
                  <td className="px-5 py-3.5 text-right font-medium tabular-nums text-foreground">{formatNaira(c.spent)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.lastOrder}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', segmentStyles[c.segment])}>
                      {c.segment}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {customers.length === 0 ? 'No customers yet.' : 'No customers match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
