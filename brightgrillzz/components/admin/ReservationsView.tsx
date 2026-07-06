'use client'

import * as React from 'react'
import {
  CalendarClock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/admin/ui'
import type { AdminReservationRow, Paged, ReservationStats, ReservationStatus } from '@/lib/supabase/queries'
import {
  deleteReservation,
  emailReservationCustomer,
  updateReservationStatus,
} from '@/app/admin/(protected)/reservations-actions'
import { waLink } from '@/lib/whatsapp'
import { Pagination } from './Pagination'
import { SearchInput } from './SearchInput'
import { useListNav } from './useListNav'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const

type TabKey = (typeof TABS)[number]['key']

const STATUS_OPTIONS: ReservationStatus[] = ['new', 'confirmed', 'closed', 'cancelled']

const statusStyles: Record<ReservationStatus, string> = {
  new: 'bg-chart-3/15 text-chart-3',
  confirmed: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', tone ?? 'text-foreground')}>{value}</p>
    </div>
  )
}

export function ReservationsView({
  data,
  stats,
  tab,
  query,
}: {
  data: Paged<AdminReservationRow>
  stats: ReservationStats
  tab: TabKey
  query: string
}) {
  const { setParams } = useListNav()
  const rows = data.rows
  const tabCount = (key: TabKey) => (key === 'all' ? stats.total : stats[key])

  return (
    <div className="space-y-6">
      <PageHeader title="Reservations" description="Grill experience enquiries from the storefront." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="New" value={stats.new} tone="text-chart-3" />
        <StatCard label="Confirmed" value={stats.confirmed} tone="text-success" />
        <StatCard label="Closed" value={stats.closed} />
        <StatCard label="Cancelled" value={stats.cancelled} tone="text-destructive" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-fit flex-wrap gap-1.5 rounded-full border border-border bg-card p-1">
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
        <SearchInput initial={query} placeholder="Search name, phone, email…" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {stats.total === 0 ? 'No reservations yet.' : 'No reservations in this view.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((r) => (
            <ReservationCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <Pagination page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} />
    </div>
  )
}

function ReservationCard({ r }: { r: AdminReservationRow }) {
  const [pending, startTransition] = React.useTransition()
  const [messaging, setMessaging] = React.useState(false)

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.placed}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', statusStyles[r.status])}>
          {r.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          {r.phone}
        </a>
        {r.email && (
          <a href={`mailto:${r.email}`} className="flex items-center gap-2 truncate text-muted-foreground hover:text-primary">
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{r.email}</span>
          </a>
        )}
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
          {r.eventAtLabel}
        </span>
        {r.guests != null && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            {r.guests} guests
          </span>
        )}
        {r.location && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {r.location}
          </span>
        )}
      </div>

      {(r.eventType || r.package) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.eventType && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{r.eventType}</span>}
          {r.package && <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">{r.package}</span>}
        </div>
      )}

      {r.notes && <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">{r.notes}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <select
          value={r.status}
          disabled={pending}
          onChange={(e) => startTransition(() => updateReservationStatus(r.id, e.target.value as ReservationStatus).then(() => {}))}
          className="h-9 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground disabled:opacity-60"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => setMessaging(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Message
        </button>

        <button
          disabled={pending}
          onClick={() => {
            if (confirm('Delete this reservation? This cannot be undone.')) {
              startTransition(() => deleteReservation(r.id).then(() => {}))
            }
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </button>
      </div>

      {messaging && <MessageDialog r={r} onClose={() => setMessaging(false)} />}
    </div>
  )
}

function MessageDialog({ r, onClose }: { r: AdminReservationRow; onClose: () => void }) {
  const [subject, setSubject] = React.useState(`Your Bright Grillzz reservation`)
  const [message, setMessage] = React.useState(
    `Hi ${r.name.split(/\s+/)[0]},\n\nThank you for your reservation request. `,
  )
  const [sending, setSending] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ ok: boolean; text: string } | null>(null)

  const sendEmail = async () => {
    setFeedback(null)
    if (!r.email) {
      setFeedback({ ok: false, text: 'No email on file for this reservation.' })
      return
    }
    setSending(true)
    const res = await emailReservationCustomer(r.id, subject, message)
    setSending(false)
    setFeedback(res.ok ? { ok: true, text: 'Email sent.' } : { ok: false, text: res.error })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Message {r.name.split(/\s+/)[0]}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {feedback && (
          <p className={cn('mt-3 text-sm', feedback.ok ? 'text-success' : 'text-destructive')}>{feedback.text}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={sendEmail}
            disabled={sending || !r.email}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send email
          </button>
          <a
            href={waLink(r.phone, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-[#052e16]"
          >
            <MessageCircle className="h-4 w-4" />
            Open WhatsApp
          </a>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Email sends now. WhatsApp opens with your message prefilled for you to send.
        </p>
      </div>
    </div>
  )
}
