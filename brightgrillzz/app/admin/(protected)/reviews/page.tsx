import { ReviewsView } from '@/components/admin/ReviewsView'
import { getReviews } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const reviews = await getReviews()
  return <ReviewsView reviews={reviews} />
}
