// Server-only Cloudinary admin helpers. The API secret lives ONLY on the server
// (never shipped to the browser), so destructive operations like deleting an
// asset are performed here. Uploads are signed elsewhere (/api/media/sign) and
// happen directly browser -> Cloudinary; deletes go server -> Cloudinary.

import { createHash } from 'crypto'
import 'server-only'

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
const API_KEY = process.env.CLOUDINARY_API_KEY ?? ''
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''

export const isCloudinaryServerConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET)

/**
 * Cloudinary signature: sort the signed params alphabetically, join as
 * `k=v&k=v`, append the API secret, then SHA-1 hex. `api_key`, `resource_type`
 * and `cloud_name` are NOT signed. (Mirrors /api/media/sign.)
 */
function sign(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(toSign + API_SECRET).digest('hex')
}

/**
 * Permanently delete an asset from Cloudinary by its public_id. `resourceType`
 * must match how it was uploaded ('image' or 'video'). Returns `{ ok }`; a
 * "not found" result is treated as success (the file is already gone).
 */
export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: 'image' | 'video',
): Promise<{ ok: boolean; error?: string }> {
  if (!publicId) return { ok: false, error: 'Missing public_id' }
  if (!isCloudinaryServerConfigured) {
    return { ok: false, error: 'Cloudinary is not configured on the server.' }
  }

  const timestamp = Math.round(Date.now() / 1000)
  const signature = sign({ public_id: publicId, timestamp })

  const form = new URLSearchParams()
  form.append('public_id', publicId)
  form.append('timestamp', String(timestamp))
  form.append('api_key', API_KEY)
  form.append('signature', signature)

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`,
      { method: 'POST', body: form },
    )
    const json = (await res.json().catch(() => ({}))) as {
      result?: string
      error?: { message?: string }
    }
    if (json.result === 'ok' || json.result === 'not found') return { ok: true }
    return { ok: false, error: json.error?.message || `Cloudinary delete failed (${res.status})` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Cloudinary delete failed' }
  }
}
