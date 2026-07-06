'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from '@/lib/settings'

// Live business settings provided from the (server) site layout so client
// components — navbar, checkout, contact page, etc. — always render what the
// admin saved under /admin/settings, not hardcoded constants.
const SettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS)

export function SettingsProvider({
  value,
  children,
}: {
  value: SiteSettings
  children: React.ReactNode
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/** Read the live business settings inside a Client Component. */
export function useSiteSettings(): SiteSettings {
  return useContext(SettingsContext)
}
