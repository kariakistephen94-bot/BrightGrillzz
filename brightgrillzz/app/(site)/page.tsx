'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Flame, Truck, ShieldCheck, Star, ChevronDown, Clock, MapPin } from 'lucide-react'
import { MenuExplorer } from '@/components/menu/MenuExplorer'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { Aurora } from '@/components/ui/Aurora'
import { CONTACT, STATS, REVIEWS, HERO_IMAGE, ABOUT_IMAGE } from '@/lib/contact'

const WHY = [
  { icon: ShieldCheck, title: 'Premium Quality Cuts', desc: 'We source only the finest proteins, hand-picked daily for maximum flavour and tenderness.' },
  { icon: Flame, title: 'The Signature Flame', desc: 'House spice blends and a live charcoal grill you can taste in every single bite.' },
  { icon: Truck, title: 'Abuja-Wide Delivery', desc: 'From our grill in Wuse 2 to your door — fast, hot and no-contact, around the clock.' },
]

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const heroItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

function StorefrontReviews() {
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

  return (
    <section className="overflow-hidden px-4 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 text-center md:mb-16">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">Customer Reviews</p>
          <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">What Guests Are Saying</h2>
        </Reveal>

        <div className="columns-1 gap-6 md:columns-2 lg:columns-3 min-h-[300px] transition-opacity duration-300" style={{ opacity: loading ? 0.5 : 1 }}>
          {currentReviews.map((review) => (
            <div
              key={review.id}
              className="glass-card relative mb-6 break-inside-avoid overflow-hidden rounded-[2rem] p-8 transition-all hover:-translate-y-1 hover:shadow-premium-sm"
            >
              {/* Decorative Quote Mark */}
              <span className="absolute -left-2 -top-4 text-9xl font-serif text-primary/10 select-none">
                &ldquo;
              </span>

              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-5 flex gap-1 text-amber-500">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                
                <p className="mb-8 flex-1 text-base leading-relaxed text-foreground/90">
                  &ldquo;{review.comment}&rdquo;
                </p>
                
                <div className="flex items-center gap-4 border-t border-border/50 pt-5 mt-auto">
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
                  page === i + 1 ? 'bg-primary w-8' : 'bg-primary/20 w-2.5 hover:bg-primary/40'
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
  return (
    <div className="overflow-hidden">
      {/* ===================== HERO ===================== */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Flame-grilled BBQ over open charcoal at BrightGrillzz"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/85 via-navy-dark/55 to-navy-dark/92" />
          <div className="absolute inset-0 [background:radial-gradient(120%_80%_at_50%_20%,transparent_30%,rgba(0,13,43,0.6)_100%)]" />
        </div>
        <Aurora
          className="mix-blend-screen opacity-70"
          blobs={[
            { color: 'var(--color-primary)', size: '38rem', top: '-10rem', left: '-6rem', opacity: 0.5 },
            { color: 'var(--color-secondary)', size: '30rem', bottom: '-8rem', right: '-6rem', opacity: 0.45, delay: '-7s' },
            { color: '#d9a441', size: '24rem', top: '20%', right: '10%', opacity: 0.3, delay: '-13s' },
          ]}
        />
        <div className="grain absolute inset-0" />

        {/* Content */}
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-4xl px-5 pt-24 text-center md:pt-28"
        >
          <motion.p
            variants={heroItem}
            className="glass-noir mx-auto mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white sm:text-sm"
          >
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
            {CONTACT.rating}★ · Premium BBQ · Wuse 2, Abuja
          </motion.p>

          <motion.h1
            variants={heroItem}
            className="font-headline text-[2.7rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          >
            Flame-Grilled
            <br className="hidden sm:block" />{' '}
            <span className="text-gradient-animate">Excellence</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:text-lg md:text-xl"
          >
            Abuja&apos;s home of luxury barbecue open 24/7 and trusted by celebrities,
            tastemakers and food connoisseurs across the city.
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              href="/menu"
              className="sheen press inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-br from-secondary to-[#9e1730] px-10 text-lg font-semibold text-white shadow-xl shadow-secondary/30 sm:w-auto"
            >
              Order Now
            </Link>
            <Link
              href="/#menu"
              className="press glass-noir inline-flex h-14 w-full items-center justify-center rounded-full px-10 text-lg font-semibold text-white sm:w-auto"
            >
              Explore Menu
            </Link>
          </motion.div>

          {/* Floating info chips (extra pop on mobile) */}
          <motion.div variants={heroItem} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: Clock, label: 'Open 24/7' },
              { icon: Truck, label: 'Abuja-wide delivery' },
              { icon: MapPin, label: 'Wuse 2' },
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

        {/* Scroll cue */}
        <Link
          href="/#menu"
          aria-label="Scroll to menu"
          className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/70 md:flex"
        >
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-5 w-5 animate-bob" />
        </Link>
      </section>

      {/* ===================== MENU ===================== */}
      <section id="menu" className="relative scroll-mt-24 overflow-hidden px-4 py-20 md:py-28">
        <Aurora
          blobs={[
            { color: 'var(--color-primary)', size: '30rem', top: '-6rem', right: '-10rem', opacity: 0.14 },
            { color: 'var(--color-secondary)', size: '26rem', bottom: '0', left: '-12rem', opacity: 0.12, delay: '-8s' },
          ]}
        />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mb-10 text-center md:mb-14">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary md:text-sm">Our Specialties</p>
            <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              The <span className="text-gradient">Grill List</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              Explore our premium selection of flame-grilled delicacies, prepared fresh in Wuse 2, Abuja.
            </p>
          </Reveal>
          <MenuExplorer />
        </div>
      </section>

      {/* ===================== WHY ===================== */}
      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal direction="right">
            <div className="lift group relative aspect-square overflow-hidden rounded-[2.5rem] shadow-premium">
              <Image
                src={ABOUT_IMAGE}
                alt="The BrightGrillzz dining experience"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-transparent to-transparent" />
              {/* Floating glass stat */}
              <div className="glass-strong absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-3xl p-4 animate-float-slow">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[#00296b] text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-headline text-3xl font-bold leading-none text-foreground">24/7</div>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">Always open. Always grilling.</p>
                </div>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-secondary">Why BrightGrillzz</p>
              <h2 className="mb-8 font-headline text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                A cut above <br />
                <span className="text-gradient">the rest</span>
              </h2>
            </Reveal>

            <RevealGroup className="space-y-4">
              {WHY.map((item) => (
                <RevealItem key={item.title}>
                  <div className="glass-card lift flex gap-5 rounded-3xl p-5">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold">{item.title}</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="px-4 py-16">
        <RevealGroup className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {STATS.map((stat) => (
            <RevealItem key={stat.label}>
              <div className="glass-card lift rounded-3xl p-6 text-center">
                <div className="font-headline text-3xl font-bold text-gradient md:text-4xl">{stat.value}</div>
                <div className="mt-2 text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                  {stat.label}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <StorefrontReviews />

      {/* ===================== CTA ===================== */}
      <section className="px-4 pb-24 pt-8 md:pb-28">
        <Reveal className="mx-auto max-w-5xl">
          <div className="glass-strong grain relative overflow-hidden rounded-[2.5rem] p-8 text-center md:rounded-[3rem] md:p-16">
            <Aurora
              blobs={[
                { color: 'var(--color-primary)', size: '26rem', top: '-8rem', left: '-6rem', opacity: 0.2 },
                { color: 'var(--color-secondary)', size: '24rem', bottom: '-8rem', right: '-6rem', opacity: 0.2, delay: '-7s' },
              ]}
            />
            <div className="relative z-10 space-y-6">
              <h2 className="font-headline text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                Hungry? <span className="text-gradient">Order Now</span>
              </h2>
              <p className="mx-auto max-w-md text-base text-muted-foreground md:text-lg">
                Premium grill delivered across Abuja, any time of day.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/menu"
                  className="sheen press inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#00296b] px-9 text-base font-semibold text-white shadow-xl shadow-primary/25"
                >
                  Place an Order
                </Link>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="press inline-flex h-14 items-center justify-center rounded-full border border-border bg-card px-9 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Call {CONTACT.phoneShort}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
