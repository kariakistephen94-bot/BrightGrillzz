'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { submitReservation, type ReservationInput } from '@/app/(site)/reservation-actions'

const EVENT_TYPES = [
  'Private grill reservation',
  'Group or event grilling',
  'Wedding',
  'Corporate event',
  'Celebrity or VIP',
  'International catering',
]
const LOCATIONS = ['Abuja, Nigeria', 'Elsewhere in Nigeria', 'International']
const PACKAGES = [
  'Private Grill Reservations',
  'Group & Event Grilling',
  'Celebrity & VIP Catering',
  'International Travel Grill',
  'Premium Meat & Fish Packages',
  'Bespoke, designed with you',
]

const selectClass =
  'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

const empty: ReservationInput = {
  name: '',
  phone: '',
  email: '',
  eventType: '',
  location: '',
  datetime: '',
  guests: '',
  package: '',
  notes: '',
}

export function ReservationForm() {
  const [form, setForm] = useState<ReservationInput>(empty)
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof ReservationInput) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Please add your name and phone number.')
      return
    }
    setPhase('sending')
    const res = await submitReservation(form)
    if (res.ok) {
      setPhase('done')
    } else {
      setPhase('idle')
      setError(res.error)
    }
  }

  if (phase === 'done') {
    return (
      <div className="glass-card flex flex-col items-center justify-center rounded-[2rem] p-8 text-center sm:p-12">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-6 font-headline text-2xl font-bold">Request received</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Thank you, {form.name.split(/\s+/)[0]}. Our concierge will confirm your grill experience personally,
          usually within a day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-[2rem] p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="res-name">Full name</Label>
          <Input id="res-name" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Amaka Bello" className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="res-phone">Phone / WhatsApp</Label>
          <Input id="res-phone" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="08012345678" className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="res-email">Email</Label>
          <Input id="res-email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="you@email.com" className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="res-event">Event type</Label>
          <select id="res-event" value={form.eventType} onChange={(e) => set('eventType')(e.target.value)} className={selectClass}>
            <option value="" disabled>
              Select an occasion
            </option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="res-location">Location</Label>
          <select id="res-location" value={form.location} onChange={(e) => set('location')(e.target.value)} className={selectClass}>
            <option value="" disabled>
              Where is the event?
            </option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="res-date">Date &amp; time</Label>
          <Input id="res-date" type="datetime-local" value={form.datetime} onChange={(e) => set('datetime')(e.target.value)} className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="res-guests">Number of guests</Label>
          <Input id="res-guests" type="number" min={1} value={form.guests} onChange={(e) => set('guests')(e.target.value)} placeholder="e.g. 40" className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="res-package">Preferred grill package</Label>
          <select id="res-package" value={form.package} onChange={(e) => set('package')(e.target.value)} className={selectClass}>
            <option value="" disabled>
              Choose a package
            </option>
            {PACKAGES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="res-notes">Special requests</Label>
          <Textarea id="res-notes" value={form.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="Dietary needs, theme, dream menu, guest of honour" className="min-h-[90px] rounded-xl" />
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-muted/60 p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Secure your date with a deposit.</span> Advance payment
          can be arranged once your booking is confirmed.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={phase === 'sending'}
        className="sheen press mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-secondary to-[#9e1730] text-base font-semibold text-white shadow-xl shadow-secondary/25 disabled:opacity-70"
      >
        {phase === 'sending' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Confirm My Reservation
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Every enquiry is reviewed and confirmed personally by our team.
      </p>
    </form>
  )
}
