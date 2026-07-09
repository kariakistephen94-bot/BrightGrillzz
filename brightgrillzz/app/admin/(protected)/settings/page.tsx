import * as React from 'react'
import { PageHeader } from '@/components/admin/ui'
import { getSettings } from './actions'
import { SettingsTabs } from './SettingsTabs'
import type { Settings } from '@/lib/supabase/types'
import { requireAdmin } from '@/lib/admin/require-admin'

export const dynamic = 'force-dynamic'

// Fallback defaults so the form is never empty if the DB row is missing.
const DEFAULTS: Omit<Settings, 'id' | 'updated_at'> = {
  name: 'BrightGrillzz',
  tagline: 'Premium BBQ',
  phone: '0818 107 0919',
  email: 'Brightgrillzzglobal@gmail.com',
  address: '5 Madiana Close, Wuse 2, Abuja, Nigeria',
  hours: 'Open 24/7',
  bank: 'OPay',
  account_number: '8181070919',
  account_name: 'Adewale Bright',
  accept_online_payments: true,
  notify_new_order: true,
  notify_reservation: true,
  notify_daily_summary: false,
  notify_low_rating: true,
  notification_email: 'Brightgrillzzglobal@gmail.com',
}

export default async function SettingsPage() {
  await requireAdmin()
  const row = await getSettings()
  const settings = { ...DEFAULTS, ...(row ?? {}) }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your store profile, payments and alerts." />
      <SettingsTabs settings={settings} />
    </div>
  )
}
