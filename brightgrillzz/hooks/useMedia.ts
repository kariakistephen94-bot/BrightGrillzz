'use client'

import { useEffect, useState } from 'react'
import type { PublicMediaItem } from '@/lib/media-types'

export type { PublicMediaItem }

interface MediaFeed {
  images: PublicMediaItem[]
  videos: PublicMediaItem[]
  featuredImages: PublicMediaItem[]
  all: PublicMediaItem[]
  loading: boolean
}

const EMPTY: Omit<MediaFeed, 'loading'> = {
  images: [],
  videos: [],
  featuredImages: [],
  all: [],
}

// Single fetch of the public media feed, shared by the gallery, home slideshow
// and video showcase. Fails soft: on any error the storefront falls back to its
// static content.
export function useMedia(): MediaFeed {
  const [feed, setFeed] = useState<Omit<MediaFeed, 'loading'>>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/media')
        const json = await res.json()
        if (active) setFeed({
          images: json.images ?? [],
          videos: json.videos ?? [],
          featuredImages: json.featuredImages ?? [],
          all: json.all ?? [],
        })
      } catch {
        /* keep EMPTY; callers fall back to static content */
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return { ...feed, loading }
}
