import { MediaManager } from '@/components/admin/MediaManager'
import { getMediaAssetsPage, getMediaCounts } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1

  const [data, counts] = await Promise.all([getMediaAssetsPage({ page }), getMediaCounts()])
  return <MediaManager key={data.page} data={data} counts={counts} />
}
