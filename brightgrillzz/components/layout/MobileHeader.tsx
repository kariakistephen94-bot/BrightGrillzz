'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTACT } from '@/lib/contact'

/** Mobile top header, frosted pill that tucks away on scroll-down. */
export default function MobileHeader() {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      setHidden(y > lastY.current && y > 120)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 px-4 pt-4 transition-transform duration-500 md:hidden',
        hidden ? '-translate-y-[130%]' : 'translate-y-0',
      )}
    >
      <div
        className={cn(
          'glass relative flex h-16 items-center justify-between rounded-2xl px-4 transition-shadow duration-500',
          scrolled ? 'shadow-premium' : 'shadow-premium-sm',
        )}
      >
        <span className="flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-bold text-primary">
          <Star className="h-3 w-3 fill-secondary text-secondary" />
          {CONTACT.rating}
        </span>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/logo.png"
            alt="BrightGrillzz"
            width={500}
            height={500}
            priority
            className="h-11 w-auto object-contain"
          />
        </Link>

        <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">
          9am to 6pm
        </span>
      </div>
    </header>
  )
}
