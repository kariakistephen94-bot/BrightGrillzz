import {
  LayoutDashboard,
  ShoppingBag,
  CalendarClock,
  UtensilsCrossed,
  Users,
  BarChart3,
  Star,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Reservations', href: '/admin/reservations', icon: CalendarClock },
      { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }],
  },
]
