'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useListNav } from './useListNav'

/**
 * Search box bound to a URL param (default `q`). Seeded from the server-provided
 * value and debounced, so typing updates the query, and the server page, a
 * beat after the user stops.
 */
export function SearchInput({
  initial = '',
  param = 'q',
  placeholder = 'Search…',
  className,
}: {
  initial?: string
  param?: string
  placeholder?: string
  className?: string
}) {
  const { setParams } = useListNav()
  const [value, setValue] = React.useState(initial)
  // What's currently reflected in the URL, avoids re-pushing an unchanged query.
  const committed = React.useRef(initial)

  React.useEffect(() => {
    if (value.trim() === committed.current.trim()) return
    const t = setTimeout(() => {
      committed.current = value
      setParams({ [param]: value.trim() || null })
    }, 350)
    return () => clearTimeout(t)
  }, [value, param, setParams])

  return (
    <div className={cn('relative w-full lg:w-72', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
      />
    </div>
  )
}
