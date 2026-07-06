import { createClient } from '@/lib/supabase/client'

/**
 * Storefront-facing menu item (DB-backed). Prices are intentionally NOT included
 * here: the site runs on a request-a-quote model, so the customer never sees a
 * price. The reference price stays in the DB for admin quoting only and is never
 * selected into the public payload.
 */
export interface MenuItem {
  id: string
  name: string
  description: string
  rating: number
  category: string
  image: string | null
  badge: string | null
}

type Row = {
  id: string
  name: string
  description: string | null
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
    .select('id, name, description, rating, category, image, badge')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    rating: r.rating ?? 0,
    category: r.category ?? 'Grills',
    image: r.image,
    badge: r.badge,
  }))
}
