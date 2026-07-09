'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, ArrowRight, MessageCircle, Truck, Clock, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/cart-context'

export default function CartPage() {
  const { items, itemCount, updateQty, removeItem } = useCart()

  return (
    <div className="pt-28 md:pt-36 pb-16 md:pb-24 px-3 sm:px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-bold mb-2 px-1">
          Your Request
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 md:mb-12 px-1">
          Pick everything you would like. Prices move with the market, so we will send you a quote before you pay.
        </p>

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {items.map((item) => (
              <motion.div
                key={item.cartId}
                layout
                className="glass-card rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 flex gap-3 sm:gap-4 md:gap-6 items-center shadow-md"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shrink-0 bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/30">
                      <Utensils className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold mb-0.5 sm:mb-1 line-clamp-2 break-words">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Price on request</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
                  <div className="flex items-center bg-muted rounded-lg sm:rounded-xl border border-border p-0.5 sm:p-1">
                    <button
                      type="button"
                      onClick={() => updateQty(item.cartId, item.qty - 1)}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-foreground/10 rounded-md sm:rounded-lg transition-colors active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                    </button>
                    <span className="w-5 sm:w-7 md:w-8 text-center font-bold text-xs sm:text-sm md:text-base">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.cartId, item.qty + 1)}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-foreground/10 rounded-md sm:rounded-lg transition-colors active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartId)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1.5 active:scale-95"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </motion.div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 sm:py-16 md:py-20 glass-card rounded-xl sm:rounded-2xl md:rounded-3xl">
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
                  Your request is empty!
                </p>
                <Button asChild className="rounded-full px-5 sm:px-8">
                  <Link href="/menu">Browse Menu</Link>
                </Button>
              </div>
            )}

            {items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12">
                <div className="glass p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-primary/15 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-primary shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Delivery Time
                    </p>
                    <p className="font-bold text-xs sm:text-sm md:text-base">35 to 45 Minutes</p>
                  </div>
                </div>

                <div className="glass p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-secondary/15 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-secondary shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Open Hours
                    </p>
                    <p className="font-bold text-xs sm:text-sm md:text-base">Open 24/7</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="lg:col-span-1">
              <div className="glass-card rounded-xl sm:rounded-2xl md:rounded-[2.5rem] p-4 sm:p-5 md:p-6 lg:p-8 sticky top-28 lg:top-32 shadow-premium-sm">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8">Request Summary</h2>

                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  <div className="flex justify-between text-muted-foreground text-xs sm:text-sm md:text-base">
                    <span>Items</span>
                    <span className="font-bold text-foreground">{itemCount}</span>
                  </div>
                  <div className="h-px bg-border my-2 sm:my-3 md:my-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    No payment now. Send your request and we will reply with a quote for today, then you can pay by
                    transfer or online.
                  </p>
                </div>

                <Button asChild className="w-full h-12 sm:h-14 md:h-16 rounded-full text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6 active:scale-95 transition-transform">
                  <Link href="/checkout">
                    CONTINUE <ArrowRight className="ml-1 sm:ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Link>
                </Button>

                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                  We reply with a quote, usually within a day
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
