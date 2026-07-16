import type { Metadata } from 'next'
import { ReservationForm } from '@/components/site/ReservationForm'

export const metadata: Metadata = {
  title: 'Reserve the Grill | Bright Grillzz',
  description: 'Share a few details about your occasion and our concierge will confirm your grill experience personally.',
}

/**
 * Standalone reservation page. Uses the same ReservationForm as the home page
 * "reserve" section so admins can share a direct link with customers.
 */
export default function ReservationPage() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">Book the Grill</p>
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Begin your <span className="text-gradient">reservation</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Share a few details about the occasion. We confirm every booking personally, whether it happens here in
            Abuja or somewhere across the world.
          </p>
        </div>

        <ReservationForm />
      </div>
    </section>
  )
}
