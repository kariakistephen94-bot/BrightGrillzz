import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { GALLERY_ITEMS } from '@/lib/contact'
import type { MediaAsset } from '@/lib/supabase/types'
import type { PublicMediaItem } from '@/lib/media-types'

export const dynamic = 'force-dynamic'

// Public, read-only feed for the storefront gallery, home slideshow and video
// showcase. Returns only PUBLISHED assets. Existing local/Supabase gallery
// photos are merged in as a fallback so the gallery is never empty before the
// admin has uploaded anything to Cloudinary.

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

// Local gallery photography (kept as seed/fallback, never deleted).
const STATIC_IMAGES: PublicMediaItem[] = GALLERY_ITEMS.map((g) => ({
  id: `static-${g.id}`,
  kind: 'image',
  url: g.image,
  posterUrl: null,
  title: null,
  caption: null,
  width: null,
  height: null,
  duration: null,
  featured: false,
  availableForRequest: true,
}))

export async function GET() {
  let assets: PublicMediaItem[] = []

  if (isServiceRoleConfigured) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('media_assets')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (data) assets = (data as MediaAsset[]).map(toItem)
  }

  const videos = assets.filter((a) => a.kind === 'video')
  const uploadedImages = assets.filter((a) => a.kind === 'image')

  // Uploaded images first, then the static seed photography behind them.
  const images = [...uploadedImages, ...STATIC_IMAGES]
  const featuredImages = uploadedImages.filter((a) => a.featured)

  return NextResponse.json({
    images,
    videos,
    featuredImages,
    // Gallery shows videos first, then every image.
    all: [...videos, ...images],
  })
}
