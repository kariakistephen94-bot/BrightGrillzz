'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Star, Utensils, X } from 'lucide-react'
import { useCart } from '@/context/cart-context'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import type { MenuItem } from '@/lib/menu'

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { items, addItem, updateQty } = useCart()
  const qty = items.find((i) => i.cartId === item.id)?.qty ?? 0

  // Expandable description: only surface the toggle when the text is actually
  // clamped. Measured via a callback ref (no effect → no cascading render).
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const measureRef = useCallback((node: HTMLParagraphElement | null) => {
    if (node) setIsClamped(node.scrollHeight - node.clientHeight > 1)
  }, [])

  const add = () =>
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image ?? '' })

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-black/[0.06] bg-card shadow-[0_10px_34px_-16px_rgba(0,26,77,0.28)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_54px_-22px_rgba(0,26,77,0.4)]">
      {/* Image */}
      <div 
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={() => { if (item.image) setIsLightboxOpen(true) }}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/10">
            <Utensils className="h-10 w-10 text-primary/25" />
          </div>
        )}

        {/* Depth scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark/45 via-transparent to-transparent opacity-80" />

        {/* Badge */}
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-br from-secondary to-[#9e1730] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
            {item.badge}
          </span>
        )}

        {/* Rating chip */}
        {item.rating > 0 && (
          <span className="glass absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {item.rating}
          </span>
        )}

        {/* In-cart ribbon */}
        <AnimatePresence>
          {qty > 0 && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-3 left-3 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur"
            >
              {qty} in cart
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5 md:p-4">
        <h3 className="line-clamp-1 text-[0.95rem] font-bold leading-tight md:text-lg">{item.name}</h3>
        {item.category && (
          <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-secondary/80">
            {item.category}
          </p>
        )}
        {item.description && (
          <div className="mt-1 md:mt-1.5">
            <p
              ref={measureRef}
              className={cn(
                'text-xs leading-relaxed text-muted-foreground md:text-sm',
                !expanded && 'line-clamp-1',
              )}
            >
              {item.description}
            </p>
            {(isClamped || expanded) && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-0.5 text-xs font-semibold text-primary hover:underline md:text-sm"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Price (own line — always visible) */}
        <span className="mt-2 block text-base font-bold text-primary md:mt-2.5 md:text-xl">
          {formatNaira(item.price)}
        </span>

        {/* Full-width Add / stepper */}
        <div className="relative mt-2 h-10 md:h-11">
          <AnimatePresence mode="popLayout" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                type="button"
                onClick={add}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                whileTap={{ scale: 0.96 }}
                aria-label={`Add ${item.name} to cart`}
                className="absolute inset-0 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-primary to-[#00296b] text-sm font-semibold text-white shadow-lg shadow-primary/25"
              >
                <Plus className="h-4 w-4" strokeWidth={2.75} />
                Add to cart
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="absolute inset-0 flex w-full items-center justify-between rounded-full bg-gradient-to-br from-primary to-[#00296b] px-1 text-white shadow-lg shadow-primary/25"
              >
                <button
                  type="button"
                  onClick={() => updateQty(item.id, qty - 1)}
                  aria-label="Decrease quantity"
                  className="grid h-9 w-11 place-items-center rounded-full transition-colors hover:bg-white/15 active:scale-90"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.75} />
                </button>
                <span className="grid flex-1 place-items-center overflow-hidden text-base font-bold tabular-nums">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={qty}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {qty}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(item.id, qty + 1)}
                  aria-label="Increase quantity"
                  className="grid h-9 w-11 place-items-center rounded-full transition-colors hover:bg-white/15 active:scale-90"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.75} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && item.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={(e) => {
              e.preventDefault()
              setIsLightboxOpen(false)
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                setIsLightboxOpen(false)
              }}
              className="absolute top-6 right-6 z-[110] w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
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
                src={item.image} 
                alt={item.name} 
                fill 
                sizes="100vw" 
                className="object-contain" 
                unoptimized
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
