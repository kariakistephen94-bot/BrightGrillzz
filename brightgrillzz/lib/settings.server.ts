// Server-only reader for the live business settings. Must never be imported from
// a Client Component — it reaches the RLS-locked `settings` row via the
// service-role admin client. The dynamic import keeps that client out of any
// bundle that doesn't actually call this.
import type { Settings } from '@/lib/supabase/types'
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from './settings'

/** Trimmed value, or the fallback when null/blank. */
function pick(value: string | null | undefined, fallback: string): string {
  const trimmed = (value ?? '').trim()
  return trimmed.length ? trimmed : fallback
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { createAdminClient, isServiceRoleConfigured } = await import('@/lib/supabase/admin')
    if (!isServiceRoleConfigured) return DEFAULT_SITE_SETTINGS

    const admin = createAdminClient()
    const { data } = await admin.from('settings').select('*').eq('id', 1).single()
    if (!data) return DEFAULT_SITE_SETTINGS

    const s = data as Partial<Settings>
    return {
      name: pick(s.name, DEFAULT_SITE_SETTINGS.name),
      tagline: pick(s.tagline, DEFAULT_SITE_SETTINGS.tagline),
      phone: pick(s.phone, DEFAULT_SITE_SETTINGS.phone),
      email: pick(s.email, DEFAULT_SITE_SETTINGS.email),
      address: pick(s.address, DEFAULT_SITE_SETTINGS.address),
      hours: pick(s.hours, DEFAULT_SITE_SETTINGS.hours),
      bank: pick(s.bank, DEFAULT_SITE_SETTINGS.bank),
      accountNumber: pick(s.account_number, DEFAULT_SITE_SETTINGS.accountNumber),
      accountName: pick(s.account_name, DEFAULT_SITE_SETTINGS.accountName),
      acceptOnlinePayments: s.accept_online_payments ?? DEFAULT_SITE_SETTINGS.acceptOnlinePayments,
    }
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}
