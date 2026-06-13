'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Plus,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/cart-context'
import { toast } from '@/hooks/use-toast'
import { formatNaira } from '@/lib/format'
import type { MenuItem } from '@/lib/contact'

const PAGE_SIZE = 8

export function MenuExplorer({ items, scrollTargetId = 'menu' }: { items: MenuItem[]; scrollTargetId?: string }) {
  const { addItem, itemCount, subtotal } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [expandedDescId, setExpandedDescId] = useState<number | null>(null)

  const categories = useMemo(() => {
    const present: string[] = []
    items.forEach((i) => {
      if (!present.includes(i.category)) present.push(i.category)
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

  const handleAdd = (item: MenuItem) => {
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image })
    toast({ title: 'Added to cart', description: `${item.name} — ${formatNaira(item.price)}` })
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-8">
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
              <div className="glass-card rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col h-full shadow-md hover:shadow-premium border border-border hover:border-primary/30 transition-all duration-500 active:scale-[0.98] bg-card">
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                  {item.badge && (
                    <div className="absolute top-2.5 left-2.5 md:top-4 md:left-4">
                      <span className="bg-secondary text-white px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 md:top-4 md:right-4 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] md:text-xs font-bold text-slate-800">{item.rating}</span>
                  </div>
                </div>
                <div className="p-3.5 md:p-6 flex-1 flex flex-col">
                  <h3 className="text-base md:text-xl font-bold mb-1.5 leading-tight line-clamp-1">{item.name}</h3>
                  <p
                    className={`text-xs md:text-sm text-muted-foreground ${
                      expandedDescId === item.id ? '' : 'line-clamp-1'
                    }`}
                  >
                    {item.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setExpandedDescId(expandedDescId === item.id ? null : item.id)}
                    className="self-start mt-0.5 text-primary font-semibold text-[11px] md:text-xs hover:underline"
                  >
                    {expandedDescId === item.id ? 'Show less' : 'Show more'}
                  </button>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm md:text-lg font-bold text-primary">{formatNaira(item.price)}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleAdd(item)}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl p-0 shrink-0"
                      aria-label={`Add ${item.name} to cart`}
                    >
                      <Plus className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                  </div>
                </div>
              </div>
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
