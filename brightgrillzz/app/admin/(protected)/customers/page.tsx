import { CustomersView } from '@/components/admin/CustomersView'
import { getCustomersPage, getCustomerStats } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

const SEGMENTS = ['vip', 'returning', 'new'] as const
type Segment = (typeof SEGMENTS)[number]

function parseSegment(v: string | undefined): Segment | 'all' {
  return v && (SEGMENTS as readonly string[]).includes(v) ? (v as Segment) : 'all'
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const q = typeof sp.q === 'string' ? sp.q : ''
  const segment = parseSegment(typeof sp.segment === 'string' ? sp.segment : undefined)

  const [data, stats] = await Promise.all([
    getCustomersPage({ page, q, segment }),
    getCustomerStats(),
  ])

  return <CustomersView data={data} stats={stats} q={q} segment={segment} />
}
