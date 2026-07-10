'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ArrowLeft, X, Play, ChevronLeft, ChevronRight, Loader2, LayoutGrid, ImageIcon, Film } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CONTACT } from '@/lib/contact'
import type { PublicMediaItem } from '@/lib/media-types'
import { displayMediaTitle } from '@/lib/media-types'
import { MediaShopButton } from '@/components/site/MediaShopButton'
import { SkeletonImage, SkeletonImg } from '@/components/ui/SkeletonImage'

// Puzzle-mosaic tile sizes. With `grid-auto-flow: dense` the pieces interlock
// like a jigsaw. Spans stay <= 2 so the pattern works on 2-col mobile and 4-col
// desktop alike.
const TILE_SPANS = [
  'col-span-2 row-span-2', // large feature
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2', // tall
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1', // wide
  'col-span-1 row-span-2', // tall
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
]

type MediaFilter = 'all' | 'image' | 'video'

const FILTERS: { key: MediaFilter; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'image', label: 'Photos', icon: ImageIcon },
  { key: 'video', label: 'Videos', icon: Film },
]

export default function GalleryPage() {
  // Gallery shows ONLY backend media (uploaded via the admin), server-paginated
  // and filterable by kind so we never load the whole library at once.
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [media, setMedia] = useState<PublicMediaItem[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const selected: PublicMediaItem | null = selectedIndex === null ? null : media[selectedIndex] ?? null

  // Fetch the current page. Closes any open lightbox and scrolls up on change.
  useEffect(() => {
    let active = true
    setLoading(true)
    setSelectedIndex(null)
    fetch(`/api/media/gallery?page=${page}&kind=${filter}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return
        setMedia(j.items ?? [])
        setPageCount(j.pageCount ?? 0)
        setTotal(j.total ?? 0)
      })
      .catch(() => {
        if (active) setMedia([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, filter])

  // Switch the kind filter and jump back to the first page of the new subset.
  const changeFilter = useCallback((next: MediaFilter) => {
    setFilter((prev) => {
      if (prev !== next) setPage(1)
      return next
    })
  }, [])

  const close = useCallback(() => setSelectedIndex(null), [])
  const goPrev = useCallback(
    () => setSelectedIndex((i) => (i === null ? i : (i - 1 + media.length) % media.length)),
    [media.length],
  )
  const goNext = useCallback(
    () => setSelectedIndex((i) => (i === null ? i : (i + 1) % media.length)),
    [media.length],
  )

  // Keyboard controls while the lightbox is open: arrows navigate, Esc closes.
  useEffect(() => {
    if (selectedIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIndex, goPrev, goNext, close])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 px-4 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="inline-flex items-center gap-2 text-secondary font-bold text-xs md:text-sm tracking-widest uppercase mb-2">
              <Flame className="w-3.5 h-3.5" /> Photos &amp; Films
            </p>
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-3">The Gallery</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              A taste of the flame our signature grills and short films, fresh off the charcoal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            {/* Kind toggle: All / Photos / Videos (server-side filtered + paginated). */}
            <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
              {FILTERS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => changeFilter(key)}
                  aria-pressed={filter === key}
                  className={`press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    filter === key
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {total > 0 && (
              <p className="text-sm font-medium text-muted-foreground">
                <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{' '}
                {filter === 'image'
                  ? total === 1
                    ? 'photo'
                    : 'photos'
                  : filter === 'video'
                    ? total === 1
                      ? 'film'
                      : 'films'
                    : total === 1
                      ? 'photo & film'
                      : 'photos & films'}
              </p>
            )}
          </div>

          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 [grid-auto-flow:dense] auto-rows-[120px] sm:auto-rows-[150px] md:auto-rows-[180px] lg:auto-rows-[200px] transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}
          >
          {media.map((item, i) => {
            const title = displayMediaTitle(item.title)
            return (
              <motion.div
                key={item.id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.04 }}
                onClick={() => setSelectedIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedIndex(i)
                  }
                }}
                aria-label={item.kind === 'video' ? 'Play video' : 'View photo'}
                className={`${TILE_SPANS[i % TILE_SPANS.length]} group relative overflow-hidden ring-1 ring-black/5 shadow-sm hover:shadow-premium hover:z-10 transition-all bg-navy-dark/5 cursor-pointer`}
              >
                {item.kind === 'video' ? (
                  <>
                    <SkeletonImg
                      src={item.posterUrl ?? item.url}
                      alt={title ?? ''}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <span className="absolute inset-0 z-[2] grid place-items-center bg-navy-dark/25 transition-colors group-hover:bg-navy-dark/35">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-white/25 backdrop-blur-md">
                        <Play className="h-6 w-6 fill-white text-white translate-x-0.5" />
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <SkeletonImage
                      src={item.url}
                      alt={title ?? ''}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 z-[2] bg-navy-dark/0 group-hover:bg-navy-dark/10 transition-colors" />
                  </>
                )}

                {(title || item.availableForRequest) && (
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-2.5 pt-8">
                    {title ? (
                      <span className="pointer-events-none min-w-0 truncate text-[11px] font-semibold text-white">
                        {title}
                      </span>
                    ) : (
                      <span />
                    )}
                    {/* Shown only when the admin marked this item available for request. */}
                    <MediaShopButton item={item} className="shrink-0 px-2.5 py-1.5 text-[11px]" />
                  </div>
                )}
              </motion.div>
            )
          })}
          </div>

          {loading && media.length === 0 && (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          )}

          {!loading && media.length === 0 && (
            <p className="mt-8 text-center text-muted-foreground">
              {filter === 'image'
                ? 'No photos yet. Check back soon.'
                : filter === 'video'
                  ? 'No videos yet. Check back soon.'
                  : 'No media yet. Check back soon.'}
            </p>
          )}

          {/* Prev / next pager */}
          {pageCount > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
                className="press inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-5 text-sm font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={loading || page >= pageCount}
                className="press inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-5 text-sm font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {media.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goPrev()
                  }}
                  className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-14 md:h-14 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goNext()
                  }}
                  className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-14 md:h-14 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {(selectedIndex ?? 0) + 1} / {media.length}
                </span>
              </>
            )}

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full h-full max-w-6xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selected.kind === 'video' ? (
                <video
                  src={selected.url}
                  poster={selected.posterUrl ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full rounded-2xl bg-black"
                />
              ) : (
                <Image
                  src={selected.url}
                  alt={displayMediaTitle(selected.title) ?? 'Gallery full view'}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              )}
            </motion.div>

            {/* Add to request from the full view — only when available. */}
            {selected.availableForRequest && (
              <div
                className={`absolute left-1/2 z-20 -translate-x-1/2 ${media.length > 1 ? 'bottom-16' : 'bottom-6'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MediaShopButton item={selected} className="px-6 py-3 text-sm" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Hungry yet?</h2>
          <p className="text-muted-foreground">Browse the full menu and check out in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/menu">Browse the Menu</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
