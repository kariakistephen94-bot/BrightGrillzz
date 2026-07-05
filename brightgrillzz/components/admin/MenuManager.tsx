'use client'

import * as React from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Pencil, Plus, Search, Star, Trash2, Utensils, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import { PageHeader } from '@/components/admin/ui'
import type { AdminMenuItem } from '@/lib/supabase/queries'
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItem,
} from '@/app/admin/(protected)/menu-actions'

export function MenuManager({ items }: { items: AdminMenuItem[] }) {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AdminMenuItem | null>(null)
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('All')
  const [pending, startTransition] = React.useTransition()

  const categories = React.useMemo(
    () => ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))],
    [items],
  )
  const availableCount = items.filter((i) => i.isAvailable).length

  const filtered = items.filter((m) => {
    if (category !== 'All' && m.category !== category) return false
    const q = query.trim().toLowerCase()
    if (q && !m.name.toLowerCase().includes(q)) return false
    return true
  })

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (item: AdminMenuItem) => {
    setEditing(item)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu"
        description={items.length ? `${items.length} dishes · ${availableCount} available` : 'Add your dishes to start selling.'}
      >
        <button
          onClick={openAdd}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </PageHeader>

      {items.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  category === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Utensils className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-foreground">No dishes yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first menu item — it&rsquo;ll show up on the storefront right away.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill unoptimized sizes="(max-width: 640px) 100vw, 33vw" className={cn('object-cover', !item.isAvailable && 'grayscale')} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <Utensils className="h-8 w-8 text-primary/30" />
                  </div>
                )}
                {item.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-secondary-foreground shadow">{item.badge}</span>
                )}
                {item.rating > 0 && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow backdrop-blur">
                    <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
                    {item.rating}
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.category || 'Uncategorised'}</p>
                  </div>
                  <p className="shrink-0 font-bold text-foreground">{formatNaira(item.price)}</p>
                </div>
                {item.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <button
                    onClick={() => startTransition(() => toggleMenuItem(item.id, !item.isAvailable))}
                    className="inline-flex items-center gap-2"
                    role="switch"
                    aria-checked={item.isAvailable}
                    disabled={pending}
                  >
                    <span className={cn('relative h-5 w-9 rounded-full transition-colors', item.isAvailable ? 'bg-success' : 'bg-muted-foreground/30')}>
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', item.isAvailable ? 'translate-x-[1.15rem]' : 'translate-x-0.5')} />
                    </span>
                    <span className={cn('text-xs font-medium', item.isAvailable ? 'text-success' : 'text-muted-foreground')}>
                      {item.isAvailable ? 'Available' : 'Hidden'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${item.name}"?`)) startTransition(() => deleteMenuItem(item.id)) }}
                      className="rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10"
                      aria-label="Delete"
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <MenuItemModal
          key={editing?.id ?? 'new'}
          editing={editing}
          categories={categories.filter((c) => c !== 'All')}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

function MenuItemModal({
  editing,
  categories,
  onClose,
}: {
  editing: AdminMenuItem | null
  categories: string[]
  onClose: () => void
}) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<string | null>(editing?.image ?? null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const file = fd.get('image') as File | null
    fd.delete('image') // uploaded separately, not through the Server Action

    startTransition(async () => {
      try {
        if (file && file.size > 0) {
          const up = new FormData()
          up.append('file', file)
          const r = await fetch('/api/admin/menu-image', { method: 'POST', body: up })
          const j = await r.json()
          if (!r.ok || !j.url) throw new Error(j.error || 'Image upload failed')
          fd.set('image_url', j.url)
        }
        const res = editing ? await updateMenuItem(editing.id, fd) : await createMenuItem(fd)
        if (res?.ok) onClose()
        else setError(res?.error ?? 'Something went wrong')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit item' : 'Add item'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {/* Image */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">Photo</span>
            <label className="relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background hover:bg-muted">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  Upload a photo
                </span>
              )}
              <input type="file" name="image" accept="image/*" onChange={onFile} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
            <input type="hidden" name="current_image" value={editing?.image ?? ''} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <input name="name" defaultValue={editing?.name} required className={inputCls} placeholder="Royal Platter" />
            </Field>
            <Field label="Price (₦)" required>
              <input name="price" type="number" min={0} defaultValue={editing?.price} required className={inputCls} placeholder="18000" />
            </Field>
            <Field label="Category">
              <input name="category" list="cat-list" defaultValue={editing?.category} className={inputCls} placeholder="Signature" />
              <datalist id="cat-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Badge (optional)">
              <input name="badge" defaultValue={editing?.badge ?? ''} className={inputCls} placeholder="BESTSELLER" />
            </Field>
            <Field label="Rating (0–5)">
              <input name="rating" type="number" min={0} max={5} step={0.1} defaultValue={editing?.rating || ''} className={inputCls} placeholder="4.8" />
            </Field>
            <Field label="Display order">
              <input name="sort_order" type="number" defaultValue={editing?.sortOrder ?? 0} className={inputCls} placeholder="0" />
            </Field>
          </div>

          <Field label="Description">
            <textarea name="description" defaultValue={editing?.description} rows={3} className={cn(inputCls, 'h-auto py-2')} placeholder="Flame-grilled proteins, sides and dips — built to share." />
          </Field>

          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="is_available" defaultChecked={editing ? editing.isAvailable : true} className="h-4 w-4 accent-[var(--color-primary)]" />
            <span className="text-sm text-foreground">Available on the storefront</span>
          </label>

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted">Cancel</button>
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  )
}
