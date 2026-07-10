'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { destroyCloudinaryAsset } from '@/lib/cloudinary-server'
import type { MediaAsset } from '@/lib/supabase/types'

// Media writes use the service-role client (bypasses RLS); the admin layout has
// already confirmed the caller is an admin/staff before these are reachable.
// The file itself is uploaded to Cloudinary from the browser — only the
// resulting URL + metadata arrive here.

export interface NewMediaInput {
  kind: 'image' | 'video'
  url: string
  public_id?: string | null
  poster_url?: string | null
  title?: string | null
  caption?: string | null
  duration?: number | null
  width?: number | null
  height?: number | null
  format?: string | null
  bytes?: number | null
  featured?: boolean
  available_for_request?: boolean
}

/** Insert one uploaded asset. Called once per file after the admin adds details. */
export async function createMediaAsset(input: NewMediaInput) {
  if (!input.url || (input.kind !== 'image' && input.kind !== 'video')) {
    return { ok: false, error: 'Invalid media' }
  }
  const title = input.title?.trim()
  if (!title) return { ok: false, error: 'A name is required' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('media_assets')
    .insert({
      kind: input.kind,
      url: input.url,
      public_id: input.public_id ?? null,
      poster_url: input.poster_url ?? null,
      title,
      caption: input.caption?.trim() || null,
      featured: input.featured ?? false,
      available_for_request: input.available_for_request ?? true,
      duration: input.duration ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      format: input.format ?? null,
      bytes: input.bytes ?? null,
    } as never)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/media')
  revalidatePath('/gallery')
  revalidatePath('/')
  return { ok: true, asset: data as MediaAsset }
}

export async function updateMediaAsset(
  id: string,
  patch: { title?: string | null; caption?: string | null; available_for_request?: boolean },
) {
  const title = patch.title?.trim()
  if (patch.title !== undefined && !title) {
    return { ok: false, error: 'A name is required' }
  }

  const admin = createAdminClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.title !== undefined) update.title = title
  if (patch.caption !== undefined) update.caption = patch.caption?.trim() || null
  if (patch.available_for_request !== undefined) {
    update.available_for_request = patch.available_for_request
  }

  const { error } = await admin
    .from('media_assets')
    .update(update as never)
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/media')
  revalidatePath('/gallery')
  revalidatePath('/')
  return { ok: true }
}

export async function toggleMediaAvailableForRequest(id: string, available: boolean) {
  const admin = createAdminClient()
  await admin
    .from('media_assets')
    .update({ available_for_request: available, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
  revalidatePath('/admin/media')
  revalidatePath('/')
  revalidatePath('/gallery')
}

export async function toggleMediaFeatured(id: string, featured: boolean) {
  const admin = createAdminClient()
  await admin
    .from('media_assets')
    .update({ featured, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
  revalidatePath('/admin/media')
  revalidatePath('/')
  revalidatePath('/gallery')
}

export async function toggleMediaPublished(id: string, isPublished: boolean) {
  const admin = createAdminClient()
  await admin
    .from('media_assets')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
  revalidatePath('/admin/media')
  revalidatePath('/')
  revalidatePath('/gallery')
}

export async function deleteMediaAsset(id: string) {
  const admin = createAdminClient()

  // Look up the Cloudinary reference first, then remove the actual file so we
  // don't leave orphaned assets behind. A failed remote delete is reported but
  // does not block removing the database row.
  const { data } = await admin
    .from('media_assets')
    .select('public_id, kind')
    .eq('id', id)
    .single()
  const asset = data as { public_id: string | null; kind: 'image' | 'video' } | null

  let cloudinaryError: string | undefined
  if (asset?.public_id) {
    const result = await destroyCloudinaryAsset(asset.public_id, asset.kind === 'video' ? 'video' : 'image')
    if (!result.ok) cloudinaryError = result.error
  }

  const { error } = await admin.from('media_assets').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/media')
  revalidatePath('/')
  revalidatePath('/gallery')
  return { ok: true, cloudinaryError }
}
