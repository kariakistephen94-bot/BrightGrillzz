import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'

const BUCKET = 'menu-images'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

// Admin-only image upload for menu photos. Files go through this route (not a
// Server Action) to avoid the 1MB Server Action body limit. Uploaded with the
// service role into the public bucket; returns the public URL.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = (profile as { role?: string } | null)?.role
  if (role !== 'admin' && role !== 'staff') {
    return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 403 })
  }
  if (!isServiceRoleConfigured) {
    return NextResponse.json({ ok: false, error: 'Storage not configured' }, { status: 500 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'Please upload an image' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image must be under 8MB' }, { status: 413 })
  }

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${crypto.randomUUID()}.${ext || 'jpg'}`
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (error) {
    console.error('[menu-image] upload failed:', error.message)
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 })
  }

  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return NextResponse.json({ ok: true, url })
}
