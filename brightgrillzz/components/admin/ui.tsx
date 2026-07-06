import * as React from 'react'
import { cn } from '@/lib/utils'

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

/** Human label for a status (enum values can carry underscores). */
export const statusLabel = (status: OrderStatus): string =>
  status === 'out_for_delivery' ? 'Out for delivery' : status

/** Page title + subtitle with an optional actions slot on the right. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

const orderStatusStyles: Record<OrderStatus, string> = {
  completed: 'bg-success/10 text-success',
  preparing: 'bg-primary/10 text-primary',
  ready: 'bg-chart-4/15 text-chart-4',
  out_for_delivery: 'bg-secondary/10 text-secondary',
  pending: 'bg-chart-3/15 text-chart-3',
  cancelled: 'bg-destructive/10 text-destructive',
}

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        orderStatusStyles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  )
}

/** A soft neutral pill for secondary metadata (payment, channel, segment…). */
export function Pill({
  children,
  tone = 'muted',
  className,
}: {
  children: React.ReactNode
  tone?: 'muted' | 'primary' | 'secondary' | 'success'
  className?: string
}) {
  const tones: Record<string, string> = {
    muted: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Bordered card surface used across the admin pages. */
export function Panel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-sm', className)}>
      {children}
    </div>
  )
}
