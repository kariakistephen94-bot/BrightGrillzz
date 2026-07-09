import { Bell, CreditCard, Palette, Store } from 'lucide-react'

// Shared between the server page and the client SettingsTabs component. Kept in
// its own module (no server-only imports) so the client component can import it
// without dragging server.ts / next/headers into the client bundle.
export const TABS = [
  { key: 'business', label: 'Business', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
] as const

export type TabKey = (typeof TABS)[number]['key']
