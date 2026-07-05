'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/cart-context'
import { formatNaira } from '@/lib/format'
import { fetchPublicMenu, type MenuItem } from '@/lib/menu'
import { MenuItemCard } from './MenuItemCard'

const PAGE_SIZE = 8

export function MenuExplorer({ scrollTargetId = 'menu' }: { scrollTargetId?: string }) {
  const { itemCount, subtotal } = useCart()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    fetchPublicMenu().then((data) => {
      if (active) {
        setItems(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const present: string[] = []
    items.forEach((i) => {
      if (i.category && !present.includes(i.category)) present.push(i.category)
    })
    return ['All', ...present]
  }, [items])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
        return matchesSearch && matchesCategory
      }),
    [items, searchQuery, selectedCategory],
  )

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const showPagination = filteredItems.length > PAGE_SIZE

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategory])

  const currentPage = Math.min(page, totalPages)
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages))
    document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading the grill list…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <Utensils className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
        <h3 className="text-2xl font-bold">Our menu is being prepared</h3>
        <p className="mt-1 text-muted-foreground">Fresh dishes are coming soon — check back shortly.</p>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="mb-6 md:mb-10">
        <div className="max-w-2xl mx-auto relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            placeholder="Search for ribs, fish, kebab..."
            className="h-12 md:h-14 w-full pl-12 pr-4 rounded-full glass text-base md:text-lg shadow-premium-sm outline-none focus:border-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-center text-xs md:text-sm text-muted-foreground mt-4">
          {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
          {searchQuery ? ` matching “${searchQuery}”` : ' on the grill'}
          {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
        </p>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="mb-8 md:mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:justify-center">
            {categories.map((category) => {
              const isActive = category === selectedCategory
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={isActive}
                  className={`shrink-0 rounded-full px-4 md:px-5 h-9 md:h-10 text-sm md:text-base font-bold border transition-all ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-lg'
                      : 'glass text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {pagedItems.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(idx, 8) * 0.05 }}
            >
              <MenuItemCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <Utensils className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-2xl font-bold">Nothing on the grill</h3>
          <p className="text-muted-foreground">Try a different search.</p>
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${
                p === currentPage
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Floating cart bar (mobile) */}
      {itemCount > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden w-[90%] pointer-events-none">
          <Link href="/cart" className="pointer-events-auto block">
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="h-16 rounded-3xl flex items-center justify-between px-6 shadow-premium bg-primary text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold opacity-80">
                    {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
                  </p>
                  <p className="font-bold">{formatNaira(subtotal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">View Cart</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        </div>
      )}
    </>
  )
}
