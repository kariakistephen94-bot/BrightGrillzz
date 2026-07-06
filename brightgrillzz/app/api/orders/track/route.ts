import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Public, read-only live status for a single order. Backed by the
// `get_order_by_tracking` RPC (SECURITY DEFINER, granted to anon) so it exposes
// only the one order — never the whole table. This is what keeps the customer
// tracking page in sync with the admin dashboard.
export async function GET(request: Request) {
  const id = (new URL(request.url).searchParams.get('id') || '').trim()
  if (!id) {
    return NextResponse.json({ ok: false, order: null }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_order_by_tracking', { p_tracking_id: id } as never)
  if (error) {
    return NextResponse.json({ ok: false, order: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { ok: true, order: data ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
