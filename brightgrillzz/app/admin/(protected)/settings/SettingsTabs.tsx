'use client'

import * as React from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { saveSettings } from './actions'
import { TABS, type TabKey } from './page'
import type { Settings } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PartialSettings = Omit<Settings, 'id' | 'updated_at'>

interface SettingsTabsProps {
  settings: PartialSettings
}

// ---------------------------------------------------------------------------
// Toast state
// ---------------------------------------------------------------------------

type ToastState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'ok' } | { kind: 'error'; message: string }

function useToast() {
  const [state, setState] = React.useState<ToastState>({ kind: 'idle' })

  const saving = () => setState({ kind: 'saving' })
  const ok = () => {
    setState({ kind: 'ok' })
    setTimeout(() => setState({ kind: 'idle' }), 3500)
  }
  const error = (message: string) => {
    setState({ kind: 'error', message })
    setTimeout(() => setState({ kind: 'idle' }), 5000)
  }

  return { state, saving, ok, error }
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function SettingsTabs({ settings }: SettingsTabsProps) {
  const [tab, setTab] = React.useState<TabKey>('business')
  const { state, saving, ok, error } = useToast()

  async function handleSave(patch: Partial<PartialSettings>) {
    saving()
    const merged: PartialSettings = { ...settings, ...patch }
    const result = await saveSettings(merged)
    if (result.ok) {
      ok()
    } else {
      error(result.error ?? 'An unknown error occurred.')
    }
  }

  return (
    <>
      {/* Toast */}
      {state.kind !== 'idle' && (
        <div
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-lg transition-all',
            state.kind === 'saving' && 'bg-card text-foreground border border-border',
            state.kind === 'ok' && 'bg-green-600 text-white',
            state.kind === 'error' && 'bg-destructive text-destructive-foreground',
          )}
        >
          {state.kind === 'saving' && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {state.kind === 'ok' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {state.kind === 'error' && <XCircle className="h-4 w-4 shrink-0" />}
          {state.kind === 'saving' && 'Saving…'}
          {state.kind === 'ok' && 'Settings saved!'}
          {state.kind === 'error' && state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab nav */}
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                id={`settings-tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div>
          {tab === 'business' && (
            <BusinessSection settings={settings} isSaving={state.kind === 'saving'} onSave={handleSave} />
          )}
          {tab === 'payments' && (
            <PaymentsSection settings={settings} isSaving={state.kind === 'saving'} onSave={handleSave} />
          )}
          {tab === 'notifications' && (
            <NotificationsSection settings={settings} isSaving={state.kind === 'saving'} onSave={handleSave} />
          )}
          {tab === 'appearance' && <AppearanceSection />}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
  onSubmit,
  isSaving,
}: {
  title: string
  description: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isSaving: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  hint,
  readOnly,
}: {
  id: string
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  type?: string
  hint?: string
  readOnly?: boolean
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25',
          readOnly && 'cursor-not-allowed opacity-60',
        )}
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function Toggle({
  id,
  name,
  label,
  description,
  defaultOn = false,
}: {
  id: string
  name: string
  label: string
  description: string
  defaultOn?: boolean
}) {
  const [on, setOn] = React.useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {/* Hidden input so FormData picks up false values too */}
      <input type="hidden" name={name} value={on ? 'true' : 'false'} />
      <button
        type="button"
        id={id}
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-[1.4rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function BusinessSection({
  settings,
  isSaving,
  onSave,
}: {
  settings: PartialSettings
  isSaving: boolean
  onSave: (patch: Partial<PartialSettings>) => void
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      name: fd.get('name') as string,
      tagline: fd.get('tagline') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      address: fd.get('address') as string,
      hours: fd.get('hours') as string,
    })
  }

  return (
    <Section
      title="Business profile"
      description="Shown across your storefront and receipts."
      onSubmit={handleSubmit}
      isSaving={isSaving}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="biz-name" label="Restaurant name" name="name" defaultValue={settings.name ?? ''} />
        <Field id="biz-tagline" label="Tagline" name="tagline" defaultValue={settings.tagline ?? ''} />
        <Field id="biz-phone" label="Phone" name="phone" defaultValue={settings.phone ?? ''} type="tel" />
        <Field id="biz-email" label="Email" name="email" defaultValue={settings.email ?? ''} type="email" />
      </div>
      <Field id="biz-address" label="Address" name="address" defaultValue={settings.address ?? ''} />
      <Field id="biz-hours" label="Opening hours" name="hours" defaultValue={settings.hours ?? ''} />
    </Section>
  )
}

function PaymentsSection({
  settings,
  isSaving,
  onSave,
}: {
  settings: PartialSettings
  isSaving: boolean
  onSave: (patch: Partial<PartialSettings>) => void
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      bank: fd.get('bank') as string,
      account_number: fd.get('account_number') as string,
      account_name: fd.get('account_name') as string,
      accept_online_payments: fd.get('accept_online_payments') === 'true',
    })
  }

  return (
    <Section
      title="Payments"
      description="Bank transfer details and online payments."
      onSubmit={handleSubmit}
      isSaving={isSaving}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="pay-bank" label="Bank name" name="bank" defaultValue={settings.bank ?? ''} />
        <Field
          id="pay-acct-number"
          label="Account number"
          name="account_number"
          defaultValue={settings.account_number ?? ''}
        />
      </div>
      <Field
        id="pay-acct-name"
        label="Account name"
        name="account_name"
        defaultValue={settings.account_name ?? ''}
      />
      <div className="border-t border-border pt-5">
        <Toggle
          id="pay-online-toggle"
          name="accept_online_payments"
          label="Accept online payments (Paystack)"
          description="Let guests pay by card, transfer or USSD at checkout."
          defaultOn={settings.accept_online_payments}
        />
      </div>
      <Field
        id="pay-paystack-key"
        label="Paystack public key"
        name="paystack_public_key"
        placeholder="pk_live_…"
        hint="Store your secret key in NEXT_PUBLIC_PAYSTACK_KEY (env var), never edit it here."
        readOnly
      />
    </Section>
  )
}

function NotificationsSection({
  settings,
  isSaving,
  onSave,
}: {
  settings: PartialSettings
  isSaving: boolean
  onSave: (patch: Partial<PartialSettings>) => void
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      notification_email: fd.get('notification_email') as string,
      notify_new_order: fd.get('notify_new_order') === 'true',
      notify_reservation: fd.get('notify_reservation') === 'true',
      notify_daily_summary: fd.get('notify_daily_summary') === 'true',
      notify_low_rating: fd.get('notify_low_rating') === 'true',
    })
  }

  return (
    <Section
      title="Notifications"
      description="Choose which emails your team receives."
      onSubmit={handleSubmit}
      isSaving={isSaving}
    >
      <Field
        id="notif-email"
        label="Notification email"
        name="notification_email"
        defaultValue={settings.notification_email ?? ''}
        type="email"
        hint="Where new-order and reservation alerts are sent."
      />
      <div className="space-y-5 border-t border-border pt-5">
        <Toggle
          id="notif-new-order"
          name="notify_new_order"
          label="New order alerts"
          description="Email the team whenever an order comes in."
          defaultOn={settings.notify_new_order}
        />
        <Toggle
          id="notif-reservation"
          name="notify_reservation"
          label="Reservation requests"
          description="Email when the contact form is submitted."
          defaultOn={settings.notify_reservation}
        />
        <Toggle
          id="notif-daily"
          name="notify_daily_summary"
          label="Daily summary"
          description="A 9am digest of yesterday's sales."
          defaultOn={settings.notify_daily_summary}
        />
        <Toggle
          id="notif-low-rating"
          name="notify_low_rating"
          label="Low-rating alerts"
          description="Get notified about 1–2 star reviews."
          defaultOn={settings.notify_low_rating}
        />
      </div>
    </Section>
  )
}

function AppearanceSection() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Appearance</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Theme and brand colours.</p>

      <div className="mt-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark.</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-sm font-medium text-foreground">Brand colours</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { name: 'Navy', value: '#001a4d', className: 'bg-primary' },
              { name: 'Burgundy', value: '#c41e3a', className: 'bg-secondary' },
              { name: 'Cream', value: '#f3efe7', className: 'bg-[#f3efe7]' },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2">
                <span className={cn('h-6 w-6 rounded-md border border-border', c.className)} />
                <div>
                  <p className="text-xs font-medium text-foreground">{c.name}</p>
                  <p className="text-[0.7rem] uppercase text-muted-foreground">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
