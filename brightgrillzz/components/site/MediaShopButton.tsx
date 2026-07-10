'use client'

import { Plus, Minus } from 'lucide-react'
import { useCart } from '@/context/cart-context'
import { mediaCartId, mediaCartName, type PublicMediaItem } from '@/lib/media-types'
import { cn } from '@/lib/utils'

// "Add to request" control for a media item (image or video), using the exact
// same cart as the menu. Self-contained so it can be dropped onto a gallery
// tile, a lightbox or the home reel. Stops click propagation so tapping it
// never triggers a parent (e.g. opening a lightbox).
export function MediaShopButton({
  item,
  className,
}: {
  item: PublicMediaItem
  className?: string
}) {
  const { items, addItem, updateQty } = useCart()
  const cartId = mediaCartId(item.id)
  const qty = items.find((i) => i.cartId === cartId)?.qty ?? 0

  // Display-only media (moments) are not shoppable.
  if (!item.availableForRequest) return null

  const add = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({ id: cartId, name: mediaCartName(item), image: item.posterUrl ?? item.url })
  }
  const step = (e: React.MouseEvent, next: number) => {
    e.stopPropagation()
    updateQty(cartId, next)
  }

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={add}
        aria-label={`Add ${mediaCartName(item)} to request`}
        className={cn(
          'press inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-primary to-[#00296b] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/25',
          className,
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.75} /> Add to request
      </button>
    )
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-primary to-[#00296b] p-1 text-white shadow-lg shadow-primary/25',
        className,
      )}
    >
      <button
        type="button"
        onClick={(e) => step(e, qty - 1)}
        aria-label="Decrease quantity"
        className="grid h-7 w-8 place-items-center rounded-full transition-colors hover:bg-white/15 active:scale-90"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.75} />
      </button>
      <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={(e) => step(e, qty + 1)}
        aria-label="Increase quantity"
        className="grid h-7 w-8 place-items-center rounded-full transition-colors hover:bg-white/15 active:scale-90"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.75} />
      </button>
    </div>
  )
}
