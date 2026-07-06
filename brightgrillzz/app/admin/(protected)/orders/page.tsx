import { OrdersView } from '@/components/admin/OrdersView'
import { getOrdersPage, getOrderStats, type OrderStatus } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

const STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']

function parseStatus(v: string | undefined): OrderStatus | 'all' {
  return v && (STATUSES as string[]).includes(v) ? (v as OrderStatus) : 'all'
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const q = typeof sp.q === 'string' ? sp.q : ''
  const status = parseStatus(typeof sp.status === 'string' ? sp.status : undefined)

  const [data, stats] = await Promise.all([
    getOrdersPage({ page, q, status }),
    getOrderStats(),
  ])

  return <OrdersView data={data} stats={stats} q={q} status={status} />
}
