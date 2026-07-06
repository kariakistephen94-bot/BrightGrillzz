'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

/** Compact light/dark switch, Apple-style pill with an animated thumb. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Until mounted, resolvedTheme is unknown, keep the first client render
  // identical to the server render (isDark=false) to avoid a hydration mismatch
  // that would otherwise leave this button's onClick unattached.
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {/* Render nothing theme-specific until mounted to avoid hydration mismatch */}
      <Sun
        className={cn(
          'h-[1.15rem] w-[1.15rem] transition-all duration-300',
          mounted && isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
      />
      <Moon
        className={cn(
          'absolute h-[1.15rem] w-[1.15rem] transition-all duration-300',
          mounted && isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0',
        )}
      />
    </button>
  )
}
