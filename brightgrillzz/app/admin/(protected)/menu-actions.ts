'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'menu-images'

// Menu writes use the service-role client (bypasses RLS) — the admin layout has
// already confirmed the caller is an admin before these are reachable.

async function uploadImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null
  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (error) {
    console.error('[menu] image upload failed:', error.message)
    return null
  }
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

function parse(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    price: Math.max(0, Math.round(Number(formData.get('price')) || 0)),
    category: String(formData.get('category') ?? '').trim() || null,
    badge: String(formData.get('badge') ?? '').trim() || null,
    rating: Math.min(5, Math.max(0, Number(formData.get('rating')) || 0)),
    sort_order: Math.round(Number(formData.get('sort_order')) || 0),
    is_available: formData.get('is_available') === 'on' || formData.get('is_available') === 'true',
    priceLabel: String(formData.get('price_label') ?? '').trim() || null,
  }
}

export async function createMenuItem(formData: FormData) {
  const f = parse(formData)
  if (!f.name) return { ok: false, error: 'Name is required' }

  const image = await uploadImage(formData.get('image') as File | null)
  const admin = createAdminClient()
  const { error } = await admin.from('menu_items').insert({
    name: f.name,
    description: f.description,
    price: f.price,
    price_label: f.priceLabel ?? `₦${f.price.toLocaleString()}`,
    category: f.category,
    badge: f.badge,
    rating: f.rating,
    sort_order: f.sort_order,
    is_available: f.is_available,
    image,
  } as never)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/menu')
  return { ok: true }
}

export async function updateMenuItem(id: string, formData: FormData) {
  const f = parse(formData)
  if (!f.name) return { ok: false, error: 'Name is required' }

  const uploaded = await uploadImage(formData.get('image') as File | null)
  const keepImage = String(formData.get('current_image') ?? '') || null
  const image = uploaded ?? keepImage

  const admin = createAdminClient()
  const { error } = await admin
    .from('menu_items')
    .update({
      name: f.name,
      description: f.description,
      price: f.price,
      price_label: f.priceLabel ?? `₦${f.price.toLocaleString()}`,
      category: f.category,
      badge: f.badge,
      rating: f.rating,
      sort_order: f.sort_order,
      is_available: f.is_available,
      image,
    } as never)
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/menu')
  return { ok: true }
}

export async function toggleMenuItem(id: string, isAvailable: boolean) {
  const admin = createAdminClient()
  await admin
    .from('menu_items')
    .update({ is_available: isAvailable } as never)
    .eq('id', id)
  revalidatePath('/admin/menu')
}

export async function deleteMenuItem(id: string) {
  const admin = createAdminClient()
  await admin.from('menu_items').delete().eq('id', id)
  revalidatePath('/admin/menu')
}
