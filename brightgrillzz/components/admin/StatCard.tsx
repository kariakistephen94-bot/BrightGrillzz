import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  delta,
  trend,
  hint,
}: {
  label: string
  value: string
  delta?: number | null
  trend?: 'up' | 'down'
  hint: string
}) {
  // Derive trend from the delta's sign when not given explicitly.
  const resolvedTrend = trend ?? ((delta ?? 0) >= 0 ? 'up' : 'down')
  const positive = resolvedTrend === 'up'
  const showDelta = delta !== null && delta !== undefined

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {showDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
