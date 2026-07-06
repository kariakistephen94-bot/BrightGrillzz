// Server-only Paystack helper. Creates a hosted payment link for an exact
// amount so the admin can send it with a quote. Never import into client code.

export interface PaystackLinkInput {
  email: string
  amountNaira: number
  /** Our order tracking id, echoed back so we can reconcile the payment. */
  reference?: string
  /** Where Paystack sends the customer after paying (to auto-confirm). */
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

export interface PaystackLink {
  authorizationUrl: string
  reference: string
}

/**
 * Returns a Paystack payment link (+ its reference) the customer can pay at, or
 * null when Paystack isn't configured or the call fails (caller falls back to
 * bank transfer only).
 */
export async function createPaystackLink(input: PaystackLinkInput): Promise<PaystackLink | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !secret.startsWith('sk_')) return null
  if (!input.email || !(input.amountNaira > 0)) return null

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amountNaira * 100), // kobo
        currency: 'NGN',
        ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
        metadata: { ...(input.metadata ?? {}), tracking_id: input.reference },
      }),
    })
    if (!res.ok) {
      console.error('[paystack] initialize failed:', res.status)
      return null
    }
    const payload = (await res.json()) as {
      status?: boolean
      data?: { authorization_url?: string; reference?: string }
    }
    const data = payload.data
    return payload.status && data?.authorization_url && data.reference
      ? { authorizationUrl: data.authorization_url, reference: data.reference }
      : null
  } catch (err) {
    console.error('[paystack] initialize threw:', err)
    return null
  }
}

/** Confirms a reference is a successful payment. Returns the paid amount (kobo). */
export async function verifyPaystackReference(reference: string): Promise<{ success: boolean; amountKobo: number } | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !secret.startsWith('sk_') || !reference) return null
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const payload = (await res.json()) as { status?: boolean; data?: { status?: string; amount?: number } }
    if (!payload.status || !payload.data) return null
    return { success: payload.data.status === 'success', amountKobo: payload.data.amount ?? 0 }
  } catch (err) {
    console.error('[paystack] verify threw:', err)
    return null
  }
}
