import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import type { MediaAsset } from '@/lib/supabase/types'
import type { PublicMediaItem } from '@/lib/media-types'

export const dynamic = 'force-dynamic'

// Server-side paginated feed for the public gallery. Returns ONLY published
// backend media (no local seed photos), a page at a time, so the gallery never
// has to load hundreds of images at once.

const PAGE_SIZE = 12

function toItem(a: MediaAsset): PublicMediaItem {
  return {
    id: a.id,
    kind: a.kind,
    url: a.url,
    posterUrl: a.poster_url,
    title: a.title,
    caption: a.caption,
    width: a.width,
    height: a.height,
    duration: a.duration,
    featured: a.featured,
    availableForRequest: a.available_for_request,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Math.floor(Number(searchParams.get('page')) || 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const empty = { items: [], page: 1, pageCount: 0, total: 0, pageSize: PAGE_SIZE }
  if (!isServiceRoleConfigured) return NextResponse.json(empty)

  const admin = createAdminClient()
  const { data, count, error } = await admin
    .from('media_assets')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json(empty)

  const total = count ?? 0
  return NextResponse.json({
    items: ((data as MediaAsset[] | null) ?? []).map(toItem),
    page,
    pageCount: total > 0 ? Math.ceil(total / PAGE_SIZE) : 0,
    total,
    pageSize: PAGE_SIZE,
  })
}
