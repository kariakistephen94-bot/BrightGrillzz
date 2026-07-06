import * as React from 'react'
import { Bell, CreditCard, Palette, Store } from 'lucide-react'
import { PageHeader } from '@/components/admin/ui'
import { getSettings } from './actions'
import { SettingsTabs } from './SettingsTabs'
import type { Settings } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const TABS = [
  { key: 'business', label: 'Business', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
] as const

export type TabKey = (typeof TABS)[number]['key']
export { TABS }

// Fallback defaults so the form is never empty if the DB row is missing.
const DEFAULTS: Omit<Settings, 'id' | 'updated_at'> = {
  name: 'BrightGrillzz',
  tagline: 'Premium BBQ',
  phone: '0818 107 0919',
  email: 'info@brightgrillzz.com',
  address: '5 Madiana Close, Wuse 2, Abuja, Nigeria',
  hours: 'Open 24/7',
  bank: 'UBA',
  account_number: '1028930153',
  account_name: 'Brightgrillzz Global Ltd',
  accept_online_payments: true,
  notify_new_order: true,
  notify_reservation: true,
  notify_daily_summary: false,
  notify_low_rating: true,
  notification_email: 'info@brightgrillzz.com',
}

export default async function SettingsPage() {
  const row = await getSettings()
  const settings = { ...DEFAULTS, ...(row ?? {}) }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your store profile, payments and alerts." />
      <SettingsTabs settings={settings} />
    </div>
  )
}
