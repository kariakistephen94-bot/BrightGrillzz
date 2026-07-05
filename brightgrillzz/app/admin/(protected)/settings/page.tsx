'use client'

import * as React from 'react'
import { Bell, CreditCard, Palette, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/admin/ui'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CONTACT } from '@/lib/contact'
import { PAYMENT_DETAILS } from '@/lib/payment'

const TABS = [
  { key: 'business', label: 'Business', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function SettingsPage() {
  const [tab, setTab] = React.useState<TabKey>('business')

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your store profile, payments and alerts." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab nav */}
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
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
          {tab === 'business' && <BusinessSection />}
          {tab === 'payments' && <PaymentsSection />}
          {tab === 'notifications' && <NotificationsSection />}
          {tab === 'appearance' && <AppearanceSection />}
        </div>
      </div>
    </div>
  )
}

/* ---------- reusable bits ---------- */

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <button className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          Save changes
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  defaultValue,
  placeholder,
  type = 'text',
  hint,
}: {
  label: string
  defaultValue?: string
  placeholder?: string
  type?: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function Toggle({
  label,
  description,
  defaultOn = false,
}: {
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
      <button
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

/* ---------- sections ---------- */

function BusinessSection() {
  return (
    <Section title="Business profile" description="Shown across your storefront and receipts.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Restaurant name" defaultValue={CONTACT.name} />
        <Field label="Tagline" defaultValue={CONTACT.tagline} />
        <Field label="Phone" defaultValue={CONTACT.phoneShort} type="tel" />
        <Field label="Email" defaultValue={CONTACT.email} type="email" />
      </div>
      <Field label="Address" defaultValue={CONTACT.address} />
      <Field label="Opening hours" defaultValue={CONTACT.hours} />
    </Section>
  )
}

function PaymentsSection() {
  return (
    <Section title="Payments" description="Bank transfer details and online payments.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Bank name" defaultValue={PAYMENT_DETAILS.bank} />
        <Field label="Account number" defaultValue={PAYMENT_DETAILS.accountNumber} />
      </div>
      <Field label="Account name" defaultValue={PAYMENT_DETAILS.accountName} />
      <div className="border-t border-border pt-5">
        <Toggle
          label="Accept online payments (Paystack)"
          description="Let guests pay by card, transfer or USSD at checkout."
          defaultOn
        />
      </div>
      <Field
        label="Paystack public key"
        placeholder="pk_live_…"
        hint="Set your secret key in the server environment, never here."
      />
    </Section>
  )
}

function NotificationsSection() {
  return (
    <Section title="Notifications" description="Choose which emails your team receives.">
      <Field
        label="Notification email"
        defaultValue={CONTACT.email}
        type="email"
        hint="Where new-order and reservation alerts are sent."
      />
      <div className="space-y-5 border-t border-border pt-5">
        <Toggle label="New order alerts" description="Email the team whenever an order comes in." defaultOn />
        <Toggle label="Reservation requests" description="Email when the contact form is submitted." defaultOn />
        <Toggle label="Daily summary" description="A 9am digest of yesterday's sales." />
        <Toggle label="Low-rating alerts" description="Get notified about 1–2 star reviews." defaultOn />
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
