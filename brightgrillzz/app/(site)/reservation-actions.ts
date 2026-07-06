'use server'

import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { sendReservationEmail } from '@/lib/email/send'

export interface ReservationInput {
  name: string
  phone: string
  email?: string
  eventType?: string
  location?: string
  /** datetime-local string, e.g. "2026-07-10T18:30" */
  datetime?: string
  guests?: string
  package?: string
  notes?: string
}

export type ReservationResult = { ok: true } | { ok: false; error: string }

/**
 * Public storefront action: saves a reservation enquiry and alerts the kitchen.
 * Uses the service-role client so the insert never depends on anon RLS quirks.
 */
export async function submitReservation(input: ReservationInput): Promise<ReservationResult> {
  const name = (input.name ?? '').trim()
  const phone = (input.phone ?? '').trim()
  if (!name || !phone) {
    return { ok: false, error: 'Name and phone are required' }
  }

  const guests = Number(input.guests)
  const eventAt = (input.datetime ?? '').trim()

  // Persistence is best-effort: a DB hiccup must never lose the lead, the alert
  // email below still notifies the kitchen. (Mirrors the orders flow.)
  if (isServiceRoleConfigured) {
    try {
      const admin = createAdminClient()
      const { error } = await admin.from('reservations').insert({
        name,
        phone,
        email: (input.email ?? '').trim() || null,
        event_type: (input.eventType ?? '').trim() || null,
        location: (input.location ?? '').trim() || null,
        event_at: eventAt ? new Date(eventAt).toISOString() : null,
        guests: Number.isFinite(guests) && guests > 0 ? Math.floor(guests) : null,
        package: (input.package ?? '').trim() || null,
        notes: (input.notes ?? '').trim() || null,
      } as never)
      if (error) console.error('[reservation] insert failed:', error.message)
    } catch (err) {
      console.error('[reservation] insert threw:', err)
    }
  } else {
    console.warn('[reservation] SUPABASE_SERVICE_ROLE_KEY not set, reservation not persisted')
  }

  // Best-effort alert email, never blocks the confirmation.
  const when = eventAt ? new Date(eventAt) : null
  await sendReservationEmail({
    name,
    email: (input.email ?? '').trim(),
    phone,
    date: when ? when.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : input.eventType,
    time: when ? when.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }) : input.location,
    guests: input.guests,
    message: [input.package, input.notes].filter(Boolean).join(' / ') || undefined,
  }).catch(() => {})

  return { ok: true }
}
