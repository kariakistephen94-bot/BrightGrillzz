import { createClient } from '@/lib/supabase/client'

/**
 * Storefront-facing menu item (DB-backed). The customer sees an indicative
 * price (`price` / `priceLabel`), but the site still runs on a request-a-quote
 * model: no money changes hands until admin confirms a quote. Treat the price
 * as a guide, not a locked amount.
 */
export interface MenuItem {
  id: string
  name: string
  description: string
  rating: number
  category: string
  image: string | null
  badge: string | null
  /** Indicative price in naira (no kobo). 0 when unset. */
  price: number
  /** Pre-formatted price for display (e.g. "₦12,000"), null when unset. */
  priceLabel: string | null
}

type Row = {
  id: string
  name: string
  description: string | null
  rating: number | null
  category: string | null
  image: string | null
  badge: string | null
  price: number | null
  price_label: string | null
}

/** Fetches the available menu for the public storefront (anon read via RLS). */
export async function fetchPublicMenu(): Promise<MenuItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, rating, category, image, badge, price, price_label')
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
    price: r.price ?? 0,
    priceLabel: r.price_label,
  }))
}
