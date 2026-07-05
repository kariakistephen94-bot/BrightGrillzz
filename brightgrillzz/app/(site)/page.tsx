'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flame, Truck, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MenuExplorer } from '@/components/menu/MenuExplorer'
import {
  CONTACT,
  FULL_MENU,
  STATS,
  REVIEWS,
  HERO_IMAGE,
  ABOUT_IMAGE,
} from '@/lib/contact'

const WHY = [
  { icon: ShieldCheck, title: 'Premium Quality Cuts', desc: 'We source only the finest proteins, hand-picked daily for maximum flavour and tenderness.' },
  { icon: Flame, title: 'The Signature Flame', desc: 'House spice blends and a live charcoal grill you can taste in every single bite.' },
  { icon: Truck, title: 'Abuja-Wide Delivery', desc: 'From our grill in Wuse 2 to your door — fast, hot and no-contact, around the clock.' },
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ===== Hero ===== */}
      <section className="relative h-screen min-h-[560px] md:min-h-[720px] flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Flame-grilled BBQ over open charcoal at BrightGrillzz"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-[0.5]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/70 via-navy-dark/45 to-navy-dark/85" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4 pt-24 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm mb-6">
              <Star className="w-3.5 h-3.5 text-secondary fill-current" />
              {CONTACT.rating}★ · Premium BBQ · Wuse 2, Abuja
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold mb-6 tracking-tight text-white leading-tight">
              Flame-Grilled <span className="text-secondary">Excellence</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              Abuja&apos;s home of luxury barbecue — open 24/7 and trusted by celebrities,
              tastemakers and food connoisseurs across the city.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button asChild size="lg" className="rounded-full h-14 px-10 text-lg w-full sm:w-auto">
                <Link href="/menu">Order Now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 h-14 px-10 text-lg w-full sm:w-auto backdrop-blur-sm"
              >
                <Link href="/#menu">Explore Menu</Link>
              </Button>
            </div>

            <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.25em] sm:tracking-[0.3em] font-medium text-white/60 uppercase">
              Dine-in <span className="mx-1.5 sm:mx-3 text-secondary">•</span> Drive-through
              <span className="mx-1.5 sm:mx-3 text-secondary">•</span> Delivery
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== The Grill List (interactive menu) ===== */}
      <section id="menu" className="py-16 md:py-24 px-4 bg-background scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-secondary font-bold text-xs md:text-sm tracking-widest uppercase mb-2">Our Specialties</p>
            <h2 className="text-3xl md:text-5xl font-headline font-bold">The Grill List</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mt-3">
              Explore our premium selection of flame-grilled delicacies, prepared fresh in Wuse 2, Abuja.
            </p>
          </div>

          <MenuExplorer items={FULL_MENU} />
        </div>
      </section>

      {/* ===== Why BrightGrillzz ===== */}
      <section className="py-20 md:py-24 px-4 bg-muted/40">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-premium">
            <Image
              src={ABOUT_IMAGE}
              alt="The BrightGrillzz dining experience"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 border-[1.25rem] border-background/20 rounded-[3rem]" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="font-headline text-5xl font-bold">24/7</div>
              <p className="text-white/80 font-medium">Always open. Always grilling.</p>
            </div>
          </div>

          <div>
            <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-3">Why BrightGrillzz</p>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-8 leading-tight">
              A cut above <br />
              <span className="text-primary">the rest</span>
            </h2>

            <div className="space-y-8">
              {WHY.map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <div key={i}>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2 font-headline">{stat.value}</div>
              <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-20 md:py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-secondary font-bold text-xs md:text-sm tracking-widest uppercase mb-2">Customer Reviews</p>
            <h2 className="text-4xl md:text-5xl font-headline font-bold">What Guests Are Saying</h2>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0">
            <div className="flex flex-nowrap gap-6 snap-x snap-mandatory p-2">
              {REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="glass-card p-8 rounded-[2.5rem] min-w-[280px] md:min-w-[400px] flex-shrink-0 snap-start"
                >
                  <div className="flex text-secondary mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-base md:text-lg italic mb-6 leading-relaxed text-foreground/80">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{review.author}</p>
                      <p className="text-xs text-muted-foreground">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-6xl font-headline font-bold leading-tight">
                Hungry? <br />
                <span className="text-primary">Order Now</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
                Premium grill delivered across Abuja, any time of day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full h-12 md:h-14 px-8 md:px-10">
                  <Link href="/menu">Place an Order</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full h-12 md:h-14 px-8 md:px-10">
                  <a href={`tel:${CONTACT.phone}`}>Call {CONTACT.phoneShort}</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
