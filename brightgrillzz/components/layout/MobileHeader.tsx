'use client'

import Link from 'next/link'
import Image from 'next/image'

/** Mobile top header pill (GrillsJunction template, BrightGrillzz brand). */
export default function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 md:hidden pt-4 px-4">
      <div className="glass glass-dark h-[4.25rem] rounded-2xl flex items-center justify-center gap-3 shadow-premium-sm">
        <Link href="/" className="flex items-center py-1">
          <Image
            src="/logo.png"
            alt="BrightGrillzz"
            width={500}
            height={500}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>
    </header>
  )
}
