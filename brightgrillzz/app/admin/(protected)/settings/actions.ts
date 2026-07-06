'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Settings } from '@/lib/supabase/types'

export type SettingsPayload = Omit<Settings, 'id' | 'updated_at'>

export async function saveSettings(payload: SettingsPayload) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq('id', 1)

  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/settings')
  return { ok: true as const }
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
  return data as Settings | null
}
