import { NextResponse } from 'next/server'

// Confirms a Paystack transaction server-side using the secret key.
//
// Response shape: { ok: boolean, verified: boolean, reason?: string }
//  - ok=false        → Paystack explicitly says the payment is not successful
//                      (or the paid amount doesn't match) — the client blocks the order.
//  - verified=false  → we could not check (no valid sk_* key, network error);
//                      the client still records the order plus reference, matching
//                      this app's trust-based bank-transfer flow.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = url.searchParams.get('reference')
  const expectedAmount = Number(url.searchParams.get('amount')) // kobo

  if (!reference) {
    return NextResponse.json({ ok: false, verified: false, reason: 'Missing reference' }, { status: 400 })
  }

  const secretKey = process.env.TEST_SECRET_KEY
  // Paystack secret keys start with sk_test_/sk_live_. Anything else (e.g. a
  // public key pasted by mistake) cannot authenticate against the API.
  if (!secretKey || !secretKey.startsWith('sk_')) {
    return NextResponse.json({ ok: true, verified: false, reason: 'Secret key not configured' })
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: 'no-store',
    })

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ ok: true, verified: false, reason: 'Secret key rejected by Paystack' })
    }
    if (!res.ok) {
      return NextResponse.json({ ok: false, verified: false, reason: `Transaction not found (${res.status})` })
    }

    const payload = (await res.json()) as {
      status: boolean
      data?: { status?: string; amount?: number; currency?: string }
    }

    const tx = payload.data
    if (!payload.status || tx?.status !== 'success') {
      return NextResponse.json({ ok: false, verified: false, reason: 'Payment not successful' })
    }
    if (Number.isFinite(expectedAmount) && expectedAmount > 0 && tx.amount !== expectedAmount) {
      return NextResponse.json({ ok: false, verified: false, reason: 'Paid amount does not match order total' })
    }

    return NextResponse.json({ ok: true, verified: true })
  } catch {
    // Network failure reaching Paystack — don't strand the customer.
    return NextResponse.json({ ok: true, verified: false, reason: 'Could not reach Paystack' })
  }
}
