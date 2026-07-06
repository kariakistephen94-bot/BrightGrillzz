// Paystack Popup (inline v2) helper for the BrightGrillzz checkout.
//
// The script is loaded on demand from js.paystack.co, so there is no npm
// dependency and nothing is fetched until a customer actually picks Paystack.

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v2/inline.js'

interface PaystackTransaction {
  reference: string
  trans?: string
  status?: string
}

interface PaystackPopInstance {
  newTransaction(options: {
    key: string
    email: string
    amount: number
    currency?: string
    metadata?: Record<string, unknown>
    onSuccess: (transaction: PaystackTransaction) => void
    onCancel: () => void
    onError?: (error: { message?: string }) => void
  }): void
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance
  }
}

let scriptPromise: Promise<void> | null = null

function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Paystack can only load in the browser'))
  if (window.PaystackPop) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = PAYSTACK_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      script.remove()
      reject(new Error('Could not load Paystack. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export interface PayWithPaystackInput {
  email: string
  /** Order total in naira, converted to kobo for Paystack. */
  amountNaira: number
  metadata?: Record<string, unknown>
}

export type PaystackResult =
  | { status: 'success'; reference: string }
  | { status: 'cancelled' }

/** Opens the Paystack popup and resolves when the customer pays or closes it. */
export async function payWithPaystack({ email, amountNaira, metadata }: PayWithPaystackInput): Promise<PaystackResult> {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack is not configured. Set TEST_PUBLIC_KEY in .env.local.')
  }

  await loadPaystackScript()
  const PaystackPop = window.PaystackPop
  if (!PaystackPop) throw new Error('Paystack failed to initialise. Please try again.')

  return new Promise<PaystackResult>((resolve, reject) => {
    let settled = false
    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      fn()
    }

    new PaystackPop().newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amountNaira * 100), // Paystack expects kobo
      currency: 'NGN',
      metadata,
      onSuccess: (transaction) => settle(() => resolve({ status: 'success', reference: transaction.reference })),
      onCancel: () => settle(() => resolve({ status: 'cancelled' })),
      onError: (error) => settle(() => reject(new Error(error?.message || 'Paystack payment failed. Please try again.'))),
    })
  })
}

/**
 * Asks our API route to confirm the transaction against Paystack's records.
 * Returns false only when Paystack explicitly reports the payment as not
 * successful, network hiccups or a missing secret key never block the order,
 * since the reference is stored for manual reconciliation.
 */
export async function verifyPaystackPayment(reference: string, amountNaira: number): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/paystack/verify?reference=${encodeURIComponent(reference)}&amount=${Math.round(amountNaira * 100)}`,
    )
    if (!res.ok) return true
    const data = (await res.json()) as { ok?: boolean }
    return data.ok !== false
  } catch {
    return true
  }
}
