'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Paged } from '@/lib/supabase/queries'
import { useListNav } from './useListNav'

// First page, last page, and the current page ±1, with ellipses between gaps.
function pageWindow(current: number, count: number): (number | 'gap')[] {
  const wanted = new Set<number>([1, count])
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= count) wanted.add(p)
  }
  const sorted = Array.from(wanted).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('gap')
    out.push(p)
    prev = p
  }
  return out
}

const cellBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none'

type Props = Pick<Paged<unknown>, 'page' | 'pageCount' | 'total' | 'pageSize'>

export function Pagination({ page, pageCount, total, pageSize }: Props) {
  const { setParams, pending } = useListNav()
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  // Page 1 is the bare URL (no ?page=1), keeps links clean.
  const go = (p: number) => setParams({ page: p <= 1 ? null : p }, { resetPage: false })

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from.toLocaleString()}–{to.toLocaleString()}</span> of{' '}
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => go(page - 1)}
            disabled={pending || page <= 1}
            className={cellBase}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageWindow(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => go(p)}
                disabled={pending}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  cellBase,
                  p === page && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
                )}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => go(page + 1)}
            disabled={pending || page >= pageCount}
            className={cellBase}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
