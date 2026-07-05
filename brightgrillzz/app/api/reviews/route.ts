import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'

// Anonymous customers submit a review after ordering (no login). Inserted
// unpublished — an admin approves it on /admin/reviews before it shows on site.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const author = String(b.author ?? '').trim()
  const comment = String(b.comment ?? '').trim()
  const rating = Math.min(5, Math.max(1, Math.round(Number(b.rating) || 0)))

  if (!author || !comment || !rating) {
    return NextResponse.json({ ok: false, error: 'Name, rating and comment are required' }, { status: 400 })
  }

  if (!isServiceRoleConfigured) {
    return NextResponse.json({ ok: true, saved: false })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('reviews').insert({
    author,
    comment,
    rating,
    role: 'Verified Guest',
    source: 'Website',
    is_published: false,
  } as never)

  if (error) {
    console.error('[reviews] insert failed:', error.message)
    return NextResponse.json({ ok: false, error: 'Could not save review' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, saved: true })
}
