'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCart } from '@/context/cart-context'
import { NAV_LINKS } from '@/lib/contact'

const LINKS = [...NAV_LINKS, { href: '/track', label: 'Track Order' }]

/** Desktop floating glass-pill navigation, scroll-aware, brand-forward. */
export default function Navbar() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="fixed inset-x-0 top-0 z-50 hidden md:block">
      <div
        className={cn(
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-500',
          scrolled ? 'mt-3' : 'mt-6',
        )}
      >
        <div
          className={cn(
            'glass flex items-center justify-between rounded-full pl-6 pr-3 transition-all duration-500',
            scrolled ? 'h-16 shadow-premium-sm' : 'h-20 shadow-premium',
          )}
        >
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="BrightGrillzz"
              width={500}
              height={500}
              priority
              className={cn('w-auto object-contain transition-all duration-500', scrolled ? 'h-11' : 'h-14')}
            />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary/10 ring-1 ring-primary/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative grid h-11 w-11 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white shadow"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              )}
            </Link>
            <Link
              href="/menu"
              className="sheen press inline-flex h-11 items-center rounded-full bg-gradient-to-br from-primary to-[#00296b] px-6 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-shadow hover:shadow-primary/40"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
