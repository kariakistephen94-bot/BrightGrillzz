import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Customer-facing: reports that a bank transfer has been made for a quoted order.
// Backed by the `mark_bank_payment_notice` RPC (SECURITY DEFINER, granted to
// anon) which only flags a quoted/pending, unconfirmed order, nothing else.
// Admin still confirms the payment in the dashboard before the kitchen starts.
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
  const { data, error } = await supabase.rpc('mark_bank_payment_notice', { p_tracking_id: id } as never)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  // `data` is null when there was nothing to flag (not quoted, or already paid).
  return NextResponse.json(
    { ok: true, noted: data != null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
