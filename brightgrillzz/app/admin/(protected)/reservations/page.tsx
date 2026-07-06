import { ReservationsView } from '@/components/admin/ReservationsView'
import { getReservationsPage, getReservationStats, type ReservationStatus } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

const TABS = ['all', 'new', 'confirmed', 'closed', 'cancelled'] as const
type Tab = (typeof TABS)[number]

function parseTab(v: string | undefined): Tab {
  return v && (TABS as readonly string[]).includes(v) ? (v as Tab) : 'all'
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const tab = parseTab(typeof sp.tab === 'string' ? sp.tab : undefined)
  const q = typeof sp.q === 'string' ? sp.q : ''

  const [data, stats] = await Promise.all([
    getReservationsPage({ page, q, status: tab === 'all' ? 'all' : (tab as ReservationStatus) }),
    getReservationStats(),
  ])

  return <ReservationsView data={data} stats={stats} tab={tab} query={q} />
}
