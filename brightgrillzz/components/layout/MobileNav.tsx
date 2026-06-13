'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, MapPin, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/context/cart-context'

const mobileTabs = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { name: 'Track', href: '/track', icon: MapPin },
]

/** Mobile bottom tab bar (GrillsJunction template, BrightGrillzz brand). */
export default function MobileNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="mx-4 mb-4 glass rounded-3xl h-16 flex items-center justify-around px-2 shadow-premium">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-12 h-12"
            >
              <div
                className={cn(
                  'p-2 rounded-xl transition-all duration-300',
                  isActive
                    ? 'bg-primary text-white scale-110 shadow-lg'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              {isActive && <span className="absolute -top-1 w-1 h-1 bg-secondary rounded-full" />}
            </Link>
          )
        })}

        <Link href="/cart" className="relative">
          <div className="p-3 bg-muted rounded-2xl text-primary border border-border">
            <ShoppingBag className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-background">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}
