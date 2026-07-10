'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { displayMediaTitle, type PublicMediaItem } from '@/lib/media-types'
import { MediaShopButton } from '@/components/site/MediaShopButton'

// Home-page short-form video showcase: a single vertical "reel" stage that
// slideshows through the admin's uploaded shorts, with a thumbnail strip to
// jump between them. Autoplays muted + looped (browser-friendly); the viewer
// can unmute. Renders nothing when there are no videos, so the section simply
// disappears until the client uploads something.
export function VideoShowcase({ videos }: { videos: PublicMediaItem[] }) {
  const [active, setActive] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const count = videos.length
  // Clamp during render so a shrinking list never points past the end.
  const safeActive = active < count ? active : 0
  const current = videos[safeActive]

  if (count === 0) return null

  const go = (dir: number) => setActive((i) => (i + dir + count) % count)

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  return (
    <section id="reel" className="relative scroll-mt-24 overflow-hidden px-4 py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-100 to-slate-200" />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl" />
      <div className="grain absolute inset-0 opacity-20" />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-10 text-center md:mb-14">
          <p className="mb-2 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">
            <Flame className="h-3.5 w-3.5" /> Straight from the Coals
          </p>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-navy-dark md:text-5xl">
            The grill, <span className="text-gradient-animate">in motion</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-navy-dark/60 md:text-base">
            Short cuts of live-fire service, plating and the moments that make each event.
          </p>
        </Reveal>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          {/* Stage */}
          <div className="flex justify-center lg:order-2">
            <div className="relative w-full max-w-[300px] sm:max-w-[340px]">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-black shadow-2xl shadow-navy-dark/30 ring-1 ring-black/5">
                <AnimatePresence mode="wait">
                  <motion.video
                    key={current.id}
                    ref={videoRef}
                    src={current.url}
                    poster={current.posterUrl ?? undefined}
                    autoPlay
                    muted={muted}
                    loop
                    playsInline
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                {/* Play / pause toggle */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? 'Pause video' : 'Play video'}
                  className="press absolute left-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                >
                  {playing ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-current" />}
                </button>

                {/* Mute toggle */}
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute video' : 'Mute video'}
                  className="press absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                >
                  {muted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
                </button>

                {/* Big center play button while paused */}
                {!playing && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label="Play video"
                    className="press absolute inset-0 z-10 grid place-items-center bg-black/25"
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-navy-dark shadow-lg">
                      <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                    </span>
                  </button>
                )}

                {/* Title + shop-from-video (same request cart as the menu) */}
                <div className="absolute inset-x-4 bottom-4 z-20 flex items-end justify-between gap-3">
                  {displayMediaTitle(current.title) ? (
                    <p className="min-w-0 flex-1 truncate font-headline text-lg font-bold text-white drop-shadow">
                      {displayMediaTitle(current.title)}
                    </p>
                  ) : (
                    <span className="flex-1" />
                  )}
                  <MediaShopButton item={current} className="shrink-0" />
                </div>

                {/* Arrows */}
                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Previous video"
                      className="press absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Next video"
                      className="press absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Dots */}
              {count > 1 && (
                <div className="mt-5 flex justify-center gap-2">
                  {videos.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => setActive(i)}
                      aria-label={`Go to video ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === safeActive ? 'w-7 bg-secondary' : 'w-2 bg-navy-dark/20 hover:bg-navy-dark/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail rail */}
          {count > 1 && (
            <div className="lg:order-1">
              <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-3 lg:overflow-visible">
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setActive(i)}
                    className={`group relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-navy-dark/15 ring-2 transition-all hover:shadow-xl lg:aspect-auto lg:h-20 lg:w-full lg:flex-row ${
                      i === safeActive ? 'ring-secondary' : 'ring-navy-dark/10 hover:ring-navy-dark/30'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.posterUrl ?? v.url}
                      alt={v.title ?? 'Video thumbnail'}
                      className="h-full w-full object-cover lg:absolute lg:inset-0"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <Play className="h-5 w-5 fill-white text-white opacity-80" />
                    </span>
                    {displayMediaTitle(v.title) && (
                      <span className="absolute inset-x-0 bottom-0 hidden truncate bg-gradient-to-t from-black/80 to-transparent px-3 pb-1.5 pt-6 text-left text-xs font-semibold text-white lg:block">
                        {displayMediaTitle(v.title)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
