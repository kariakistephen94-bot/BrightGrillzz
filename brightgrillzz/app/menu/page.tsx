'use client'

import { motion } from 'framer-motion'
import { MenuExplorer } from '@/components/menu/MenuExplorer'
import { FULL_MENU } from '@/lib/contact'

export default function MenuPage() {
  return (
    <div id="menu" className="pt-28 md:pt-36 pb-16 md:pb-24 px-4 min-h-screen scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <p className="text-secondary font-bold text-xs md:text-sm tracking-widest uppercase mb-2">The Full Menu</p>
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-3">Our Grill List</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Browse every flame-grilled specialty, add your favourites to the cart and check out in minutes.
          </p>
        </motion.div>

        <MenuExplorer items={FULL_MENU} />
      </div>
    </div>
  )
}
