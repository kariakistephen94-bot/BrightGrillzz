import { NextResponse } from 'next/server'
import { sendReservationEmail } from '@/lib/email/send'
import type { ReservationEmailPayload } from '@/lib/email/templates'

// Emails the restaurant when someone submits the reservation / contact form.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (v == null ? '' : String(v).trim())

  const reservation: ReservationEmailPayload = {
    name: str(b.name),
    email: str(b.email),
    phone: str(b.phone),
    date: str(b.date) || undefined,
    time: str(b.time) || undefined,
    guests: str(b.guests) || undefined,
    message: str(b.message) || undefined,
  }

  if (!reservation.name || (!reservation.phone && !reservation.email)) {
    return NextResponse.json({ ok: false, error: 'Missing contact details' }, { status: 400 })
  }

  const result = await sendReservationEmail(reservation)
  return NextResponse.json({ ok: true, ...result })
}
