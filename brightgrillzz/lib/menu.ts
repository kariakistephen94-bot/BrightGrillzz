import { createClient } from '@/lib/supabase/client'

/** Storefront-facing menu item (DB-backed). */
export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  priceLabel: string
  rating: number
  category: string
  image: string | null
  badge: string | null
}

type Row = {
  id: string
  name: string
  description: string | null
  price: number
  price_label: string | null
  rating: number | null
  category: string | null
  image: string | null
  badge: string | null
}

/** Fetches the available menu for the public storefront (anon read via RLS). */
export async function fetchPublicMenu(): Promise<MenuItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, price_label, rating, category, image, badge')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: r.price,
    priceLabel: r.price_label ?? '',
    rating: r.rating ?? 0,
    category: r.category ?? 'Grills',
    image: r.image,
    badge: r.badge,
  }))
}
