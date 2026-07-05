'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, MapPin, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCart } from '@/context/cart-context'

const tabs = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { name: 'Track', href: '/track', icon: MapPin },
]

/** Mobile bottom dock — floating frosted glass with a lifting active pill. */
export default function MobileNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-4 mb-4 flex items-end justify-between">
        {/* Nav dock */}
        <div className="glass flex h-[4.25rem] flex-1 items-center justify-around rounded-[1.75rem] px-2 shadow-premium">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="press relative flex h-full w-16 flex-col items-center justify-center gap-0.5"
              >
                {active && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute top-1.5 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[#00296b] shadow-lg shadow-primary/40"
                    transition={{ type: 'spring', stiffness: 480, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 grid h-11 w-11 place-items-center transition-colors duration-300',
                    active ? 'text-white' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-[1.35rem] w-[1.35rem]" />
                </span>
                <span
                  className={cn(
                    'relative z-10 text-[0.6rem] font-bold transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground/70',
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Raised cart FAB */}
        <Link
          href="/cart"
          aria-label="Cart"
          className="press relative -mt-3 ml-3 grid h-[4.25rem] w-[4.25rem] shrink-0 place-items-center rounded-[1.75rem] bg-gradient-to-br from-secondary to-[#9e1730] text-white shadow-premium glow-burgundy"
        >
          <ShoppingBag className="h-6 w-6" />
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 16 }}
              className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[11px] font-bold text-white"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.span>
          )}
        </Link>
      </div>
    </div>
  )
}
