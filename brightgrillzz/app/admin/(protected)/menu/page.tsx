import { MenuManager } from '@/components/admin/MenuManager'
import { getMenuPage, getMenuFacets } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const q = typeof sp.q === 'string' ? sp.q : ''
  const category = typeof sp.category === 'string' ? sp.category : 'All'

  const [data, facets] = await Promise.all([
    getMenuPage({ page, q, category: category === 'All' ? undefined : category }),
    getMenuFacets(),
  ])

  return <MenuManager data={data} facets={facets} q={q} category={category} />
}
