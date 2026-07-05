'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GALLERY_ITEMS, CONTACT, orderLink } from '@/lib/contact'

type GalleryItem = (typeof GALLERY_ITEMS)[number]

export default function GalleryPage() {
  const [selected, setSelected] = useState<GalleryItem | null>(null)

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
              <Flame className="w-3.5 h-3.5" /> Photo Gallery
            </p>
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-3">The Gallery</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              A taste of the flame — our signature grills, fresh off the charcoal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {GALLERY_ITEMS.map((item, i) => (
            <motion.button
              type="button"
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              onClick={() => setSelected(item)}
              className="group relative aspect-[4/5] sm:aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden shadow-md hover:shadow-premium transition-all"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <span className="inline-block bg-secondary text-white text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full mb-1.5">
                  {item.category}
                </span>
                <h3 className="text-white font-bold text-sm md:text-lg leading-tight">{item.title}</h3>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-dark/85 z-[80] flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-card rounded-[2rem] overflow-hidden max-w-lg w-full shadow-premium"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-square">
                <Image src={selected.image} alt={selected.title} fill sizes="512px" className="object-cover" />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-navy" />
                </button>
              </div>
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">{selected.category}</span>
                  <h2 className="text-2xl font-headline font-bold">{selected.title}</h2>
                </div>
                <Button asChild className="rounded-full shrink-0">
                  <a href={orderLink(selected.title)} target="_blank" rel="noopener noreferrer">
                    Order This
                  </a>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Hungry yet?</h2>
          <p className="text-muted-foreground">Add your favourites to the cart and check out in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/menu">Browse the Menu</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
