import { MenuManager } from '@/components/admin/MenuManager'
import { getAdminMenu } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function AdminMenuPage() {
  const items = await getAdminMenu()
  return <MenuManager items={items} />
}
