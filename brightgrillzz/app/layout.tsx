import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'BrightGrillzz — Premium BBQ & Grilled Cuisine | Wuse 2, Abuja',
  description:
    'Experience premium flame-grilled cuisine at BrightGrillzz. Open 24/7 in Wuse 2, Abuja. Royal Platter, Grilled Fish, Carne Asada, King Crab and more — order online or on WhatsApp.',
  keywords: 'BBQ, Grills, Restaurant, Abuja, Premium, Casual Dining',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-body antialiased min-h-screen selection:bg-primary selection:text-primary-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
