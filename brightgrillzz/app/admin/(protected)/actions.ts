'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/supabase/queries'

// All mutations run under the signed-in admin's session — RLS (is_staff)
// enforces that only staff/admins can write.

export async function updateOrderStatus(dbId: string, status: OrderStatus) {
  const supabase = await createClient()
  await supabase
    .from('orders')
    .update({ status } as never)
    .eq('id', dbId)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function deleteOrder(dbId: string) {
  const supabase = await createClient()
  await supabase.from('orders').delete().eq('id', dbId)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function setReviewPublished(id: string, published: boolean) {
  const supabase = await createClient()
  await supabase
    .from('reviews')
    .update({ is_published: published } as never)
    .eq('id', id)
  revalidatePath('/admin/reviews')
}

export async function deleteReview(id: string) {
  const supabase = await createClient()
  await supabase.from('reviews').delete().eq('id', id)
  revalidatePath('/admin/reviews')
}
