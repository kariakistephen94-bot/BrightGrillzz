'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/cart-context'
import { NAV_LINKS } from '@/lib/contact'

/** Desktop floating glass-pill navigation (GrillsJunction template, BrightGrillzz brand). */
export default function Navbar() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="glass h-16 lg:h-20 rounded-full flex items-center justify-between px-6 lg:px-8 shadow-premium-sm">
          {/* Brand */}
          <Link href="/" className="flex items-center shrink-0 group">
            <Image
              src="/logo.png"
              alt="BrightGrillzz"
              width={500}
              height={500}
              priority
              className="h-12 lg:h-14 w-auto object-contain"
            />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/track"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === '/track' ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              Track Order
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingCart className="w-5 h-5" />
              </Button>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-secondary text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            <Button asChild className="rounded-full px-6">
              <Link href="/menu">Order Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
