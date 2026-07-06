'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Flame,
  Star,
  ChevronDown,
  MapPin,
  Globe,
  MessageCircle,
  ArrowRight,
  Calendar,
  Users,
  Send,
  Fish,
} from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { Aurora } from '@/components/ui/Aurora'
import { ReservationForm } from '@/components/site/ReservationForm'
import { CONTACT, HERO_IMAGE } from '@/lib/contact'
import { useSiteSettings } from '@/context/settings-context'

// ---------------------------------------------------------------------------
// Landing content for Bright Grillzz. Original copy for a by-reservation,
// live-fire catering brand serving Abuja and the wider world. Styling reuses
// the site's existing design system (glass, aurora, gradient utilities).
// ---------------------------------------------------------------------------

const MARQUEE = ['Open flame, private tables', 'Grilled to order, never in advance', 'An occasion on every plate']

const MASTER_STATS = [
  { value: '10+', label: 'Years Over the Coals' },
  { value: '500+', label: 'Events Catered' },
  { value: '4', label: 'Continents Reached' },
]

const EXPERIENCES = [
  {
    icon: Flame,
    title: 'Private Grill Reservations',
    desc: 'An intimate flame for one to ten guests. Your own grill master, a menu built around the evening, and a table that stays completely yours.',
  },
  {
    icon: Users,
    title: 'Group & Event Grilling',
    desc: 'Weddings, milestones and company gatherings, served at volume with none of the craft left behind.',
  },
  {
    icon: Star,
    title: 'Celebrity & VIP Catering',
    desc: 'Quiet, camera ready service for public figures and private hosts who prize discretion as highly as flavour.',
  },
  {
    icon: Send,
    title: 'International Travel Grill',
    desc: 'Wherever the celebration lands, the fire follows, with a full travelling grill setup built for destination events abroad.',
  },
  {
    icon: Fish,
    title: 'Premium Meat & Fish Packages',
    desc: 'Towering seafood spreads, whole grilled fish and prime cuts, each one sourced, seasoned and finished to order.',
  },
]

// Signature plates use real event photography from /public/gallery.
const SIGNATURES = [
  { title: 'Seafood Towers', image: '/gallery/image2.jpeg' },
  { title: 'Prime Cuts', image: '/gallery/image3.jpg' },
  { title: 'Whole Grilled Fish', image: '/gallery/image4.jpg' },
  { title: 'Sharing Platters', image: '/gallery/image5.jpeg' },
]

// Five curated shots for the guest-list showcase (from /public/gallery).
const SHOWCASE_IMAGES = [
  '/gallery/image6.jpg',
  '/gallery/image7.jpg',
  '/gallery/image8.jpg',
  '/gallery/image9.jpg',
  '/gallery/image10.jpg',
]

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const heroItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

// Live testimonials pulled from the reviews API, kept as genuine guest proof.
function GuestVoices() {
  const [page, setPage] = useState(1)
  const [currentReviews, setCurrentReviews] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPage() {
      setLoading(true)
      try {
        const res = await fetch(`/api/reviews/public?page=${page}&limit=3`)
        const json = await res.json()
        if (json.data) {
          setCurrentReviews(json.data)
          setTotalPages(json.meta.totalPages)
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [page])

  if (!loading && currentReviews.length === 0) return null

  return (
    <section className="overflow-hidden px-4 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 text-center md:mb-16">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">
            Word of Mouth
          </p>
          <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            In their own <span className="text-gradient">words</span>.
          </h2>
        </Reveal>

        <div
          className="columns-1 gap-6 md:columns-2 lg:columns-3 min-h-[280px] transition-opacity duration-300"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {currentReviews.map((review) => (
            <div
              key={review.id}
              className="glass-card relative mb-6 break-inside-avoid overflow-hidden rounded-[2rem] p-8 transition-all hover:-translate-y-1 hover:shadow-premium-sm"
            >
              <span className="absolute -left-2 -top-4 select-none font-serif text-9xl text-primary/10">&ldquo;</span>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-5 flex gap-1 text-amber-500">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mb-8 flex-1 text-base leading-relaxed text-foreground/90">&ldquo;{review.comment}&rdquo;</p>
                <div className="mt-auto flex items-center gap-4 border-t border-border/50 pt-5">
                  <div>
                    <p className="text-sm font-bold text-foreground">{review.author}</p>
                    <p className="text-xs font-medium text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-2.5 rounded-full transition-all ${
                  page === i + 1 ? 'w-8 bg-primary' : 'w-2.5 bg-primary/20 hover:bg-primary/40'
                }`}
                aria-label={`Go to review page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const settings = useSiteSettings()

  return (
    <div className="overflow-hidden">
      {/* ===================== HERO ===================== */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="The Bright Grillzz grill master tending an open flame at an event"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/85 via-navy-dark/60 to-navy-dark/95" />
          <div className="absolute inset-0 [background:radial-gradient(120%_80%_at_50%_20%,transparent_30%,rgba(0,13,43,0.65)_100%)]" />
        </div>
        <Aurora
          className="opacity-70 mix-blend-screen"
          blobs={[
            { color: 'var(--color-primary)', size: '38rem', top: '-10rem', left: '-6rem', opacity: 0.5 },
            { color: 'var(--color-secondary)', size: '30rem', bottom: '-8rem', right: '-6rem', opacity: 0.45, delay: '-7s' },
            { color: '#d9a441', size: '24rem', top: '20%', right: '10%', opacity: 0.32, delay: '-13s' },
          ]}
        />
        <div className="grain absolute inset-0" />

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-4xl px-5 pt-24 text-center md:pt-28"
        >
          <motion.p
            variants={heroItem}
            className="glass-noir mx-auto mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white sm:text-xs"
          >
            <Flame className="h-3.5 w-3.5 text-secondary" />
            Abuja to the World · Order or Reserve
          </motion.p>

          <motion.h1
            variants={heroItem}
            className="font-headline text-[2.55rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[4.75rem]"
          >
            A Private Grill,
            <br className="hidden sm:block" />{' '}
            Worthy of the{' '}
            <span className="text-gradient-animate">Moment</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:text-lg md:text-xl"
          >
            From quiet dinners to headline celebrations, Bright Grillzz brings the flame, the flavour and the
            theatre of open fire straight to your table, plated with the precision of a private kitchen.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              href="#reserve"
              className="sheen press inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-br from-secondary to-[#9e1730] px-9 text-base font-semibold text-white shadow-xl shadow-secondary/30 sm:w-auto md:text-lg"
            >
              Reserve an Experience
            </Link>
            <Link
              href="/menu"
              className="press glass-noir inline-flex h-14 w-full items-center justify-center rounded-full px-9 text-base font-semibold text-white sm:w-auto md:text-lg"
            >
              Place order
            </Link>
          </motion.div>

          <motion.div variants={heroItem} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: Flame, label: 'Cooked on open flame' },
              { icon: Star, label: 'Order or reserve' },
              { icon: Globe, label: 'Abuja and beyond' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="glass-noir inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-white/90"
              >
                <chip.icon className="h-3.5 w-3.5 text-secondary" />
                {chip.label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <Link
          href="#grill-master"
          aria-label="Scroll to the grill master story"
          className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/70 md:flex"
        >
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-5 w-5 animate-bob" />
        </Link>
      </section>

      {/* ===================== MARQUEE ===================== */}
      <div className="relative flex overflow-hidden border-y border-white/10 bg-navy-dark py-5 text-white">
        <div className="flex shrink-0 animate-marquee items-center whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {MARQUEE.map((phrase, i) => (
                <span key={`${copy}-${i}`} className="flex items-center">
                  <span
                    className={`px-8 font-headline text-lg font-semibold tracking-tight md:text-xl ${
                      i === 0 ? 'text-white' : 'text-secondary'
                    }`}
                  >
                    {phrase}
                  </span>
                  <Flame className="h-4 w-4 text-[#d9a441]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===================== THE GRILL MASTER ===================== */}
      <section id="grill-master" className="relative scroll-mt-24 overflow-hidden px-4 py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal direction="right">
            <div className="lift group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-premium">
              <Image
                src="/gallery/brightgrill.jpg"
                alt="Bright, founder and lead grill master of Bright Grillzz, at an event"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-transparent" />
              <div className="glass-strong absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-3xl p-4 animate-float-slow">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-[#9e1730] text-white">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-headline text-2xl font-bold leading-none text-foreground">The Grill Master</div>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">Every event, a private commission.</p>
                </div>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-secondary">Behind the Flame</p>
              <h2 className="mb-6 font-headline text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                A Cameroonian hand, an <span className="text-gradient">Abuja</span> reputation, a table the world asks for.
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                <p>
                  Bright Grillzz was built on one idea: that fire-cooked food deserves a place at the very best tables,
                  not only the roadside. Our founder and lead grill master, Bright, sharpened his craft in Cameroon and
                  earned his name in Abuja one flawless service at a time, plating seafood, meat and fish for hosts who
                  settle for nothing short of exceptional.
                </p>
                <p>
                  Every booking is handled like a private commission, and the standard never bends. Only the finest
                  ingredients, exacting technique, and a plate worthy of the moment it is made to celebrate.
                </p>
              </div>
            </Reveal>

            <RevealGroup className="mt-9 grid grid-cols-3 gap-3 md:gap-5">
              {MASTER_STATS.map((stat) => (
                <RevealItem key={stat.label}>
                  <div className="glass-card lift rounded-3xl p-5 text-center">
                    <div className="font-headline text-3xl font-bold text-gradient md:text-4xl">{stat.value}</div>
                    <div className="mt-2 text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground md:text-[0.7rem]">
                      {stat.label}
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ===================== EXPERIENCES ===================== */}
      <section id="experiences" className="relative scroll-mt-24 overflow-hidden px-4 py-20 md:py-28">
        <Aurora
          blobs={[
            { color: 'var(--color-primary)', size: '30rem', top: '-6rem', right: '-10rem', opacity: 0.12 },
            { color: 'var(--color-secondary)', size: '26rem', bottom: '0', left: '-12rem', opacity: 0.1, delay: '-8s' },
          ]}
        />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mb-10 text-center md:mb-14">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">The Services</p>
            <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              One standard, at <span className="text-gradient">any scale</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              Five ways to book the grill, each held to the same relentless standard. We arrive with the fire, the
              showmanship and the flavour.
            </p>
          </Reveal>

          {/* Hairline-divided grid (gap-px over the border colour draws the divider lines). */}
          <Reveal className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.5rem] bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCES.map((exp) => (
              <div
                key={exp.title}
                className="group relative flex flex-col bg-card p-8 transition-colors duration-300 hover:bg-muted/50 md:p-10"
              >
                <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <exp.icon className="h-8 w-8 text-secondary" strokeWidth={1.5} />
                <h3 className="mt-6 font-headline text-xl font-bold text-foreground md:text-2xl">{exp.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{exp.desc}</p>
                <Link
                  href="#reserve"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-secondary transition-all group-hover:gap-2.5"
                >
                  Book now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}

            {/* Bespoke cell, brand-highlighted */}
            <div className="grain relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-primary to-navy-dark p-8 text-white md:p-10">
              <Aurora
                blobs={[{ color: 'var(--color-secondary)', size: '20rem', bottom: '-6rem', right: '-6rem', opacity: 0.3 }]}
              />
              <div className="relative z-10">
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px w-8 bg-white/40" />
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">Still deciding?</p>
                </div>
                <h3 className="font-headline text-2xl font-bold leading-tight">Let us build something just for you.</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  The best events begin with a conversation. Tell us the occasion and we will shape the fire around it.
                </p>
                <Link
                  href="#reserve"
                  className="sheen press mt-6 inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-white px-5 text-sm font-bold text-primary"
                >
                  Start a conversation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== SIGNATURE SHOWCASE ===================== */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 text-center md:mb-12">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">From the Grill</p>
            <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Signature plates</h2>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {SIGNATURES.map((sig) => (
              <RevealItem key={sig.title}>
                <div className="lift group relative aspect-[3/4] overflow-hidden rounded-[1.75rem] shadow-premium">
                  <Image
                    src={sig.image}
                    alt={sig.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/85 via-navy-dark/10 to-transparent" />
                  <p className="absolute bottom-4 left-4 right-4 font-headline text-lg font-bold text-white">
                    {sig.title}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ===================== THE GUEST LIST (SHOWCASE) ===================== */}
      <section id="showcase" className="relative scroll-mt-24 overflow-hidden px-4 py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mb-10 text-center md:mb-14">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">In Good Company</p>
            <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
              The fire behind the rooms that <span className="text-gradient">matter</span>.
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {SHOWCASE_IMAGES.map((src, i) => (
              <Reveal key={src} delay={(i % 5) * 0.05}>
                <div className="lift group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-premium-sm">
                  <Image
                    src={src}
                    alt="Bright Grillzz showcase, a past event presentation"
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-navy-dark/0 transition-colors duration-500 group-hover:bg-navy-dark/20" />
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
            A look back at past events and guests. Photographs are shared with permission and reflect the Bright
            Grillzz experience. They are illustrative and do not imply any ongoing endorsement.
          </p>
        </div>
      </section>

      {/* ===================== GUEST VOICES ===================== */}
      <GuestVoices />

      {/* ===================== RESERVATIONS ===================== */}
      <section id="reserve" className="relative scroll-mt-24 overflow-hidden px-4 pb-24 pt-8 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-10 text-center md:mb-14">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">Book the Grill</p>
            <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Begin your <span className="text-gradient">reservation</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              Share a few details about the occasion. We confirm every booking personally, whether it happens here in
              Abuja or somewhere across the world.
            </p>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            {/* WhatsApp / concierge panel */}
            <Reveal className="lg:col-span-2">
              <div className="grain relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-navy-dark p-8 text-white">
                <Aurora
                  blobs={[{ color: 'var(--color-secondary)', size: '22rem', top: '-6rem', right: '-8rem', opacity: 0.28 }]}
                />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                    <MessageCircle className="h-7 w-7 text-[#25D366]" />
                  </div>
                  <h3 className="mt-6 font-headline text-2xl font-bold">Book faster on WhatsApp</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">
                    Would you rather talk it through? Send your details to our concierge and we will reply personally,
                    usually within a day.
                  </p>

                  <a
                    href={CONTACT.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sheen press mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#052e16]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat with our concierge
                  </a>

                  <ul className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm text-white/80">
                    {[
                      { icon: Calendar, text: 'A personal reply within a day' },
                      { icon: Globe, text: 'Catering at home or abroad' },
                      { icon: Flame, text: 'Menus shaped to any headcount' },
                    ].map((row) => (
                      <li key={row.text} className="flex items-center gap-3">
                        <row.icon className="h-4 w-4 shrink-0 text-[#d9a441]" />
                        {row.text}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-auto pt-8 text-xs text-white/50">
                    <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
                    {settings.address}
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Reservation form (submits to the reservations dashboard) */}
            <Reveal className="lg:col-span-3">
              <ReservationForm />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}
