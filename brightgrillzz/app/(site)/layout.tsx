import Navbar from '@/components/layout/Navbar'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'

/** Layout for the public marketing/storefront pages — carries the site chrome. */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <MobileHeader />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  )
}
