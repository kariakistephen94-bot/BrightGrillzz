'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/admin/ui'
import type { AdminUserRow, UserRole, UserStats, Paged } from '@/lib/supabase/queries'
import { setUserRole } from '@/app/admin/(protected)/user-actions'
import { Pagination } from './Pagination'
import { SearchInput } from './SearchInput'
import { useListNav } from './useListNav'

const ROLE_TABS: { key: UserRole | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'staff', label: 'Staff' },
  { key: 'customer', label: 'Customers' },
]

const ROLE_OPTIONS: UserRole[] = ['customer', 'staff', 'admin']

const roleStyles: Record<UserRole, string> = {
  admin: 'bg-secondary/10 text-secondary',
  staff: 'bg-primary/10 text-primary',
  customer: 'bg-muted text-muted-foreground',
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

export function UsersView({
  data,
  stats,
  q,
  role,
}: {
  data: Paged<AdminUserRow>
  stats: UserStats
  q: string
  role: UserRole | 'all'
}) {
  const { setParams } = useListNav()
  const [users, setUsers] = React.useState(data.rows)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Reconcile with fresh server data on filter/page change.
  const [prevRows, setPrevRows] = React.useState(data.rows)
  if (data.rows !== prevRows) {
    setPrevRows(data.rows)
    setUsers(data.rows)
  }

  const changeRole = async (id: string, next: UserRole) => {
    const prev = users.find((u) => u.id === id)?.role
    if (!prev || prev === next) return
    setError(null)
    setSavingId(id)
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: next } : u)))
    const res = await setUserRole(id, next)
    if (!res.ok) {
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: prev } : u)))
      setError(res.error)
    }
    setSavingId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Everyone with an account. Set who can access the dashboard." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total users" value={stats.total.toLocaleString()} />
        <MiniStat label="Admins" value={String(stats.admin)} tone="secondary" />
        <MiniStat label="Staff" value={String(stats.staff)} tone="primary" />
        <MiniStat label="Customers" value={String(stats.customer)} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 rounded-full border border-border bg-card p-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setParams({ role: t.key === 'all' ? null : t.key })}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                role === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SearchInput initial={q} placeholder="Search users…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(u.name)}
                      </span>
                      <div className="font-medium text-foreground">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.email || 'N/A'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.joined}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', roleStyles[u.role])}>
                        {u.role}
                      </span>
                      <div className="relative">
                        <select
                          value={u.role}
                          disabled={savingId === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                          className="h-8 rounded-lg border border-border bg-background pl-2 pr-7 text-xs font-medium text-foreground outline-none focus:border-primary disabled:opacity-50"
                          aria-label={`Set role for ${u.name}`}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                        {savingId === u.id && (
                          <Loader2 className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {stats.total === 0 ? 'No users yet.' : 'No users match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} />
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
  tone?: 'foreground' | 'primary' | 'secondary'
}) {
  const toneClass: Record<string, string> = {
    foreground: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1.5 text-2xl font-bold tracking-tight', toneClass[tone])}>{value}</p>
    </div>
  )
}
