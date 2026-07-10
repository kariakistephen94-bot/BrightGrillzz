import {
  LayoutDashboard,
  ShoppingBag,
  CalendarClock,
  UtensilsCrossed,
  Users,
  UserCog,
  BarChart3,
  Star,
  Settings,
  Film,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  /** Only visible to admins (hidden from staff). */
  adminOnly?: boolean
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: true },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Reservations', href: '/admin/reservations', icon: CalendarClock },
      { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
      { label: 'Media', href: '/admin/media', icon: Film },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, adminOnly: true },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: UserCog, adminOnly: true },
      { label: 'Settings', href: '/admin/settings', icon: Settings, adminOnly: true },
    ],
  },
]
