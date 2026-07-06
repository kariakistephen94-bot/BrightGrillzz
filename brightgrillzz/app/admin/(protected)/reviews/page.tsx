import { ReviewsView } from '@/components/admin/ReviewsView'
import { getReviewsPage, getReviewStats } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

const TABS = ['all', 'published', 'hidden'] as const
type Tab = (typeof TABS)[number]

function parseTab(v: string | undefined): Tab {
  return v && (TABS as readonly string[]).includes(v) ? (v as Tab) : 'all'
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const tab = parseTab(typeof sp.tab === 'string' ? sp.tab : undefined)

  const [data, stats] = await Promise.all([
    getReviewsPage({ page, tab }),
    getReviewStats(),
  ])

  return <ReviewsView data={data} stats={stats} tab={tab} />
}
