import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Signs a direct-to-Cloudinary upload. The API secret lives ONLY here on the
// server — the browser receives a short-lived signature, never the secret. This
// route decides the exact params that get signed (timestamp + folder) and hands
// them back so the client uploads with precisely what was signed.
//
// Guarded to admin/staff: a signature is an upload credential, so only signed-in
// staff may mint one. The role check mirrors the admin layout.

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
const API_KEY = process.env.CLOUDINARY_API_KEY ?? ''
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''

/** Cloudinary folder all storefront media is uploaded into. */
const UPLOAD_FOLDER = 'brightgrillzz/media'

/**
 * Cloudinary signature: sort the signed params alphabetically, join as
 * `k=v&k=v`, append the API secret, then SHA-1 hex. `file`, `api_key`,
 * `resource_type` and `cloud_name` are NOT signed.
 */
function sign(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(toSign + secret).digest('hex')
}

export async function POST() {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured on the server.' },
      { status: 500 },
    )
  }

  // Only signed-in admin/staff may obtain an upload signature.
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (data as { role?: string } | null)?.role ?? 'customer'
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const timestamp = Math.round(Date.now() / 1000)
  const signedParams = { folder: UPLOAD_FOLDER, timestamp }
  const signature = sign(signedParams, API_SECRET)

  return NextResponse.json({
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: UPLOAD_FOLDER,
    signature,
  })
}
