'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/queries'

const ROLES: readonly UserRole[] = ['customer', 'staff', 'admin']

/**
 * Sets a user's role. RLS (profiles_admin_all) only lets an admin write, so a
 * non-admin call fails at the database. We also stop an admin from demoting
 * themselves, which would lock them out of this very screen.
 */
export async function setUserRole(userId: string, role: string) {
  if (!userId || !(ROLES as readonly string[]).includes(role)) {
    return { ok: false as const, error: 'Invalid role' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id === userId && role !== 'admin') {
    return { ok: false as const, error: 'You cannot remove your own admin role.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() } as never)
    .eq('id', userId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/users')
  return { ok: true as const }
}
