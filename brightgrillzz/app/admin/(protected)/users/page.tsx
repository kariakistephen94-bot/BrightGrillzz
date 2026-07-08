import { UsersView } from '@/components/admin/UsersView'
import { getUsersPage, getUserStats, type UserRole } from '@/lib/supabase/queries'
import { requireAdmin } from '@/lib/admin/require-admin'

export const dynamic = 'force-dynamic'

const ROLES: UserRole[] = ['customer', 'staff', 'admin']

function parseRole(v: string | undefined): UserRole | 'all' {
  return v && (ROLES as string[]).includes(v) ? (v as UserRole) : 'all'
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdmin()
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const q = typeof sp.q === 'string' ? sp.q : ''
  const role = parseRole(typeof sp.role === 'string' ? sp.role : undefined)

  const [data, stats] = await Promise.all([
    getUsersPage({ page, q, role }),
    getUserStats(),
  ])

  return <UsersView data={data} stats={stats} q={q} role={role} />
}
