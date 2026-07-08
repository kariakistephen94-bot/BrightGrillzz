import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

/**
 * Guards an admin-only page. Staff (and anyone below) are bounced to Orders.
 * The (protected) layout already ensures the visitor is at least staff, so this
 * only needs to enforce the admin tier. No-ops in preview mode (no Supabase).
 */
export async function requireAdmin(): Promise<void> {
  if (!isSupabaseConfigured) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (data as { role?: 'admin' | 'staff' | 'customer' } | null)?.role ?? 'customer'
  if (role !== 'admin') redirect('/admin/orders')
}
