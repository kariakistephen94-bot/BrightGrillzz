import Navbar from '@/components/layout/Navbar'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import { SettingsProvider } from '@/context/settings-context'
import { getSiteSettings } from '@/lib/settings.server'

// Read live business settings on every request so admin edits show immediately
// across the storefront (contact info, hours, checkout bank details, etc.).
export const dynamic = 'force-dynamic'

/** Layout for the public marketing/storefront pages, carries the site chrome. */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings()

  return (
    <SettingsProvider value={settings}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <MobileHeader />
        <main className="flex-grow">{children}</main>
        <Footer settings={settings} />
        <MobileNav />
      </div>
    </SettingsProvider>
  )
}
