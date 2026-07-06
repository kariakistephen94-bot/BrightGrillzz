import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Customer-facing: confirm an out-for-delivery order has arrived. Backed by the
// `confirm_delivery` RPC (SECURITY DEFINER, granted to anon) which only flips an
// order that is currently out_for_delivery to completed — nothing else.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const id = String((body as { id?: unknown })?.id ?? '').trim()
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing tracking id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('confirm_delivery', { p_tracking_id: id } as never)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  // `data` is null when the order wasn't out_for_delivery (nothing to confirm).
  return NextResponse.json(
    { ok: true, confirmed: data != null, order: data ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
