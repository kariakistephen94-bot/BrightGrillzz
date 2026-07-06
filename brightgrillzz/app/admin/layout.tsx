import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin · BrightGrillzz',
  description: 'BrightGrillzz admin dashboard',
}

// The `admin-theme` wrapper scopes dark mode to the admin area, dark tokens
// in globals.css only apply inside it, so the toggle never affects the public
// storefront. The dashboard chrome + auth guard live in the (protected) route
// group so that /admin/login can render without them.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-theme">{children}</div>
}
