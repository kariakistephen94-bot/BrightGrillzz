'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, Menu, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { signOut } from '@/app/admin/actions'
import { NAV_SECTIONS } from './nav'

export type AdminUser = {
  name: string
  email: string
  role: 'admin' | 'staff' | 'customer'
}

export function AdminShell({
  children,
  user,
  previewMode = false,
}: {
  children: React.ReactNode
  user: AdminUser
  previewMode?: boolean
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes
  React.useEffect(() => setMobileOpen(false), [pathname])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar, fixed on desktop, slide-over on mobile */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={user.role}
      />

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-64">
        <Topbar onMenu={() => setMobileOpen(true)} user={user} previewMode={previewMode} />
        {previewMode && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
            Preview mode, set your Supabase keys in{' '}
            <code className="font-mono">.env.local</code> to enable authentication.
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'A'
}

function UserMenu({ user, previewMode }: { user: AdminUser; previewMode: boolean }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials(user.name)}
        </span>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold leading-tight text-foreground">{user.name}</p>
          <p className="text-[0.7rem] capitalize leading-tight text-muted-foreground">
            {user.role}
          </p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          {previewMode ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Not signed in (preview mode).
            </p>
          ) : (
            <form action={signOut}>
              <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted">
                <LogOut className="h-4 w-4 text-muted-foreground" />
                Sign out
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function Sidebar({
  mobileOpen,
  onClose,
  role,
}: {
  mobileOpen: boolean
  onClose: () => void
  role: AdminUser['role']
}) {
  const pathname = usePathname()

  // Staff don't see admin-only sections (dashboard, analytics, users, settings).
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => role === 'admin' || !item.adminOnly),
  })).filter((section) => section.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="BrightGrillzz"
            width={140}
            height={140}
            className="h-9 w-auto object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Admin
          </span>
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-accent lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-sidebar-muted/70">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[1.15rem] w-[1.15rem] shrink-0',
                          active ? 'text-primary-foreground' : 'text-sidebar-muted group-hover:text-sidebar-foreground',
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                            active
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-secondary/10 text-secondary',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer card */}
      <div className="p-3">
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <p className="text-sm font-semibold text-sidebar-foreground">Bright Grillzz</p>
          <p className="mt-0.5 text-xs text-sidebar-muted">Wuse 2, Abuja · 9am to 6pm</p>
          <Link
            href="/"
            className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            View storefront →
          </Link>
        </div>
      </div>
    </aside>
  )
}

function Topbar({
  onMenu,
  user,
  previewMode,
}: {
  onMenu: () => void
  user: AdminUser
  previewMode: boolean
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search orders, customers, items…"
            className="h-10 w-full rounded-full border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="relative rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-[1.15rem] w-[1.15rem]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
          </button>

          <ThemeToggle />

          <UserMenu user={user} previewMode={previewMode} />
        </div>
      </div>
    </header>
  )
}
