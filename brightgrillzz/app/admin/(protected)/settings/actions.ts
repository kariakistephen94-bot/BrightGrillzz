'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Settings } from '@/lib/supabase/types'

export type SettingsPayload = Omit<Settings, 'id' | 'updated_at'>

export async function saveSettings(payload: SettingsPayload) {
  const supabase = await createClient()

  // upsert so the row is created if the migration seed was skipped.
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() } as never, {
      onConflict: 'id',
    })

  if (error) {
    console.error('[saveSettings]', error)
    return { ok: false as const, error: error.message }
  }

  revalidatePath('/admin/settings')
  return { ok: true as const }
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
  return data as Settings | null
}
