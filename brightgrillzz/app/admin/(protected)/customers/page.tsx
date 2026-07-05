import { CustomersView } from '@/components/admin/CustomersView'
import { getCustomers } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const customers = await getCustomers()
  return <CustomersView customers={customers} />
}
