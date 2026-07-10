// Shared shape for the public media feed, consumed by both the API route
// (server) and the storefront hook/components (client). Kept in its own
// directive-free module so neither side pulls in the other's imports.
export interface PublicMediaItem {
  id: string
  kind: 'image' | 'video'
  url: string
  posterUrl: string | null
  title: string | null
  caption: string | null
  width: number | null
  height: number | null
  duration: number | null
  featured: boolean
  /** When false the item is display-only (not shoppable / not addable to a request). */
  availableForRequest: boolean
}

/**
 * A human-readable title, or null when the stored title is really a camera /
 * download filename id (e.g. "5 6093891868070780821"). We never surface those.
 */
export function displayMediaTitle(title: string | null): string | null {
  const t = title?.trim()
  if (!t) return null
  const letters = (t.match(/[a-zA-Z]/g) ?? []).length
  const digits = (t.match(/\d/g) ?? []).length
  // Needs a couple of real letters, and mustn't be overwhelmingly numeric.
  if (letters < 2 || digits > letters * 2) return null
  return t
}

/** Cart line id for a media item — namespaced so it never clashes with menu ids. */
export function mediaCartId(id: string): string {
  return `media-${id}`
}

/** Name to show in the cart/request for a media item, with a sensible fallback. */
export function mediaCartName(item: PublicMediaItem): string {
  return displayMediaTitle(item.title) ?? (item.kind === 'video' ? 'Grill video' : 'Grill photo')
}
