'use client'

import { ThemeProvider } from 'next-themes'
import { CartProvider } from '@/context/cart-context'
import { Toaster } from '@/components/ui/Toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <CartProvider>
        {children}
        <Toaster />
      </CartProvider>
    </ThemeProvider>
  )
}
