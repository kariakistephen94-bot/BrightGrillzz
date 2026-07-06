'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export interface CartItem {
  /** The underlying menu item id (Supabase uuid). */
  id: string
  /** Unique per cart line (same as id, BrightGrillzz dishes have no extras). */
  cartId: string
  name: string
  qty: number
  image: string
  /**
   * Optional. The request-a-quote flow never sets a price (the customer never
   * sees one); it only exists so legacy/quoted-order code keeps compiling.
   */
  price?: number
}

type AddItemInput = {
  id: string
  name: string
  image: string
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  addItem: (item: AddItemInput, qty?: number) => void
  removeItem: (cartId: string) => void
  updateQty: (cartId: string, qty: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'brightgrillzz-cart'

function normalizeItem(raw: Partial<CartItem> & { id: string | number }): CartItem {
  const id = String(raw.id)
  return {
    id,
    cartId: raw.cartId ?? id,
    name: raw.name ?? '',
    qty: Number(raw.qty) || 1,
    image: raw.image ?? '',
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as (Partial<CartItem> & { id: string | number })[]
        setItems(parsed.map(normalizeItem))
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((item: AddItemInput, qty = 1) => {
    const cartId = String(item.id)
    setItems((prev) => {
      const existing = prev.find((i) => i.cartId === cartId)
      if (existing) {
        return prev.map((i) =>
          i.cartId === cartId ? { ...i, qty: i.qty + qty } : i,
        )
      }
      return [...prev, { ...item, cartId, qty }]
    })
  }, [])

  const removeItem = useCallback((cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId))
  }, [])

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.cartId !== cartId))
      return
    }
    setItems((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, qty } : i)))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }),
    [items, itemCount, addItem, removeItem, updateQty, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
