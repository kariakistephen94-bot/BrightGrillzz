import { OrdersView } from '@/components/admin/OrdersView'
import { getOrders } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const orders = await getOrders()
  return <OrdersView orders={orders} />
}
