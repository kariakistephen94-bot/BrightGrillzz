'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Settings } from '@/lib/supabase/types'

export type SettingsPayload = Omit<Settings, 'id' | 'updated_at'>

export async function saveSettings(payload: SettingsPayload) {
  const supabase = await createClient()
  const now = new Date().toISOString()

// Plain UPDATE – only the UPDATE RLS policy is evaluated (no INSERT policy clash).
  const { error: updError, count } = await supabase
    .from('settings')
    .update({ ...payload, updated_at: now } as never)
    .eq('id', 1)
// @ts-ignore
    .select('id', { count: 'exact', head: true })

  const rowCount = Number(count ?? 0)

  // If the UPDATE succeeded and a row was affected, we're done.
  if (!updError && rowCount > 0) {
    revalidatePath('/admin/settings')
    return { ok: true as const }
  }

  // rowCount === 0 can mean either (a) no row exists yet, or (b) the row exists
  // but wasn't returned by the SELECT-count under RLS. A plain INSERT breaks case
  // (b) with a settings_pkey duplicate-key error, so upsert on `id` instead: it
  // updates the existing row or inserts a new one. Service-role client bypasses RLS.
  if (rowCount === 0) {
    const { createAdminClient, isServiceRoleConfigured } = await import('@/lib/supabase/admin')
    if (!isServiceRoleConfigured) {
      console.error('[saveSettings] Service‑role key not configured – cannot upsert seed row')
      return { ok: false as const, error: 'Admin service not configured' }
    }
    const admin = createAdminClient()
    const { error: upsertError } = await admin
      .from('settings')
      .upsert({ id: 1, ...payload, updated_at: now } as never, { onConflict: 'id' })
    if (upsertError) {
      console.error('[saveSettings] upsert error', upsertError)
      return { ok: false as const, error: upsertError.message }
    }
    revalidatePath('/admin/settings')
    return { ok: true as const }
  }

  // Any other unexpected update error.
  console.error('[saveSettings] update error', updError)
  return { ok: false as const, error: updError?.message ?? 'Unknown error' }
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
  return data as Settings | null
}
