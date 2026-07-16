import type { Metadata } from 'next'
import { ReviewForm } from '@/components/site/ReviewForm'

export const metadata: Metadata = {
  title: 'Leave a Review | Bright Grillzz',
  description: 'Enjoyed your Bright Grillzz experience? Share a quick review — it only takes a moment.',
}

/**
 * Standalone review page. Uses the same submission flow as the post-order
 * review prompt so admins can share a direct link with customers.
 */
export default function ReviewPage() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">Your Feedback</p>
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            Leave a <span className="text-gradient">review</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground md:text-base">
            Enjoyed your Bright Grillzz experience? Your feedback helps other food lovers, and it only takes a moment.
          </p>
        </div>

        <ReviewForm />
      </div>
    </section>
  )
}
