'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Drives server-side list state (page, search, tab/segment/category) through the
 * URL. Changing a filter resets to page 1; changing the page preserves filters.
 * Navigations run in a transition so `pending` can drive a subtle loading state.
 */
export function useListNav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = React.useTransition()

  const setParams = React.useCallback(
    (
      updates: Record<string, string | number | null | undefined>,
      opts: { resetPage?: boolean } = {},
    ) => {
      const { resetPage = true } = opts
      const sp = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '') sp.delete(key)
        else sp.set(key, String(value))
      }
      // A filter change invalidates the current page number.
      if (resetPage && !('page' in updates)) sp.delete('page')
      const qs = sp.toString()
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
    },
    [router, pathname, searchParams],
  )

  return { setParams, pending }
}
