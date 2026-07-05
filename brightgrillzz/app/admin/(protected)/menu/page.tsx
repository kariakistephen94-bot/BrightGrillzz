'use client'

import * as React from 'react'
import Image from 'next/image'
import { Pencil, Plus, Search, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import { PageHeader } from '@/components/admin/ui'
import { FULL_MENU } from '@/lib/contact'

export default function MenuPage() {
  const categories = React.useMemo(
    () => ['All', ...Array.from(new Set(FULL_MENU.map((m) => m.category)))],
    [],
  )
  const [category, setCategory] = React.useState('All')
  const [query, setQuery] = React.useState('')
  const [available, setAvailable] = React.useState<Record<number, boolean>>({})

  const isAvailable = (id: number) => available[id] ?? true
  const toggle = (id: number) =>
    setAvailable((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))

  const items = FULL_MENU.filter((m) => {
    if (category !== 'All' && m.category !== category) return false
    const q = query.trim().toLowerCase()
    if (q && !m.name.toLowerCase().includes(q)) return false
    return true
  })

  const availableCount = FULL_MENU.filter((m) => isAvailable(m.id)).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu"
        description={`${FULL_MENU.length} dishes · ${availableCount} available`}
      >
        <button className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                category === c
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes…"
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const on = isAvailable(item.id)
          return (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className={cn(
                    'object-cover transition-all duration-300 group-hover:scale-105',
                    !on && 'grayscale',
                  )}
                />
                {item.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-secondary-foreground shadow">
                    {item.badge}
                  </span>
                )}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow backdrop-blur">
                  <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
                  {item.rating}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <p className="shrink-0 font-bold text-foreground">{formatNaira(item.price)}</p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <button
                    onClick={() => toggle(item.id)}
                    className="inline-flex items-center gap-2"
                    role="switch"
                    aria-checked={on}
                  >
                    <span
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        on ? 'bg-success' : 'bg-muted-foreground/30',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                          on ? 'translate-x-[1.15rem]' : 'translate-x-0.5',
                        )}
                      />
                    </span>
                    <span className={cn('text-xs font-medium', on ? 'text-success' : 'text-muted-foreground')}>
                      {on ? 'Available' : 'Hidden'}
                    </span>
                  </button>

                  <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
