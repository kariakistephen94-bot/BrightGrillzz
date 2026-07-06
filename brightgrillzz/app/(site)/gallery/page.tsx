'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GALLERY_ITEMS, CONTACT } from '@/lib/contact'

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
              A taste of the flame our signature grills, fresh off the charcoal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid, view only */}
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
              aria-label="View photo"
              className="group relative aspect-[4/5] sm:aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden shadow-md hover:shadow-premium transition-all"
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-navy-dark/0 group-hover:bg-navy-dark/10 transition-colors" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* Lightbox, view only */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full h-full max-w-7xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image 
                src={selected.image} 
                alt="Gallery full view" 
                fill 
                sizes="100vw" 
                className="object-contain" 
                priority
              />
            </motion.div>
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
