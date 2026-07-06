'use client'

import * as React from 'react'
import { Loader2, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader, Pill } from '@/components/admin/ui'
import type { AdminReviewRow, Paged, ReviewStats } from '@/lib/supabase/queries'
import { deleteReview, setReviewPublished } from '@/app/admin/(protected)/actions'
import { Pagination } from './Pagination'
import { useListNav } from './useListNav'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'hidden', label: 'Hidden' },
] as const

type TabKey = (typeof TABS)[number]['key']

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-3.5 w-3.5', i < rating ? 'fill-chart-3 text-chart-3' : 'fill-muted text-muted')} />
      ))}
    </span>
  )
}

export function ReviewsView({
  data,
  stats,
  tab,
}: {
  data: Paged<AdminReviewRow>
  stats: ReviewStats
  tab: TabKey
}) {
  const { setParams } = useListNav()
  const reviews = data.rows
  const avg = stats.avg.toFixed(1)
  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1)
  const tabCount = (key: TabKey) =>
    key === 'all' ? stats.total : key === 'published' ? stats.published : stats.hidden

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="What guests are saying — and what shows on your site." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-5xl font-bold tracking-tight text-foreground">{avg}</p>
          <Stars rating={Math.round(stats.avg)} className="mt-2" />
          <p className="mt-2 text-sm text-muted-foreground">{stats.total} reviews</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Rating distribution</h2>
          <div className="mt-4 space-y-2.5">
            {stats.distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-sm">
                <span className="flex w-8 items-center gap-1 text-muted-foreground">
                  {d.star}
                  <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-3" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-6 text-right tabular-nums text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-fit gap-1.5 rounded-full border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParams({ tab: t.key === 'all' ? null : t.key })}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {stats.total === 0 ? 'No reviews yet.' : 'No reviews in this view.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      <Pagination page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} />
    </div>
  )
}

function ReviewCard({ review: r }: { review: AdminReviewRow }) {
  const [pending, startTransition] = React.useTransition()

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {r.author.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
          </span>
          <div>
            <p className="font-semibold text-foreground">{r.author}</p>
            {r.role && <p className="text-xs text-muted-foreground">{r.role}</p>}
          </div>
        </div>
        <Pill tone="muted">{r.source}</Pill>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Stars rating={r.rating} />
        <span className="text-xs text-muted-foreground">{r.date}</span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">&ldquo;{r.comment}&rdquo;</p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <button
          disabled={pending}
          onClick={() => startTransition(() => setReviewPublished(r.id, !r.published))}
          role="switch"
          aria-checked={r.published}
          className="inline-flex items-center gap-2 disabled:opacity-60"
        >
          <span className={cn('relative h-5 w-9 rounded-full transition-colors', r.published ? 'bg-success' : 'bg-muted-foreground/30')}>
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', r.published ? 'translate-x-[1.15rem]' : 'translate-x-0.5')} />
          </span>
          <span className={cn('text-xs font-medium', r.published ? 'text-success' : 'text-muted-foreground')}>
            {r.published ? 'Shown on site' : 'Hidden'}
          </span>
        </button>

        <button
          disabled={pending}
          onClick={() => {
            if (confirm('Delete this review? This cannot be undone.')) {
              startTransition(() => deleteReview(r.id))
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </button>
      </div>
    </div>
  )
}
