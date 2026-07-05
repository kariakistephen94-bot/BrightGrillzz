import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './config'
import type { Database } from './types'

// Server-only service-role client. Bypasses RLS — NEVER import this into a
// Client Component. Used for trusted server writes like inserting an order
// placed by an anonymous customer at checkout.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const isServiceRoleConfigured = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)

export function createAdminClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
