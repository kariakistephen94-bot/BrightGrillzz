'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendCustomMessage } from '@/lib/email/send'
import type { ReservationStatus } from '@/lib/supabase/queries'

// All mutations run under the signed-in admin's session, RLS (is_staff)
// enforces that only staff/admins can write.

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('reservations')
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/admin/reservations')
  return { ok: true as const }
}

export async function deleteReservation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/admin/reservations')
  return { ok: true as const }
}

/**
 * Emails a reservation customer a custom, admin-written message. WhatsApp is
 * handled client-side via a wa.me deep link (no WhatsApp API needed).
 */
export async function emailReservationCustomer(id: string, subject: string, message: string) {
  if (!subject.trim() || !message.trim()) {
    return { ok: false as const, error: 'Subject and message are required' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('name, email')
    .eq('id', id)
    .single()
  if (error || !data) return { ok: false as const, error: 'Reservation not found' }

  const r = data as { name: string; email: string | null }
  if (!r.email) return { ok: false as const, error: 'This reservation has no email on file' }

  const res = await sendCustomMessage(r.email, subject.trim(), message.trim(), r.name)
  if (!res.sent) {
    return { ok: false as const, error: res.error ?? 'Email is not configured' }
  }
  return { ok: true as const }
}
