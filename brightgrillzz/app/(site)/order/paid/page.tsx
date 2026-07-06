'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function PaidContent() {
  const router = useRouter()
  const params = useSearchParams()
  const tracking = (params.get('tracking') || '').trim()
  const reference = (params.get('reference') || params.get('trxref') || '').trim()
  const [state, setState] = useState<'checking' | 'done' | 'error'>('checking')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!tracking || !reference) {
      setState('error')
      return
    }
    fetch('/api/orders/paystack-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking, reference }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.confirmed) {
          setState('done')
          // Send them to live tracking after a beat.
          setTimeout(() => router.replace(`/track?id=${encodeURIComponent(tracking)}`), 1600)
        } else {
          setState('error')
        }
      })
      .catch(() => setState('error'))
  }, [tracking, reference, router])

  return (
    <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen flex flex-col items-center justify-center text-center">
      {state === 'checking' && (
        <>
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-5" />
          <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">Confirming your payment...</h1>
          <p className="text-muted-foreground">One moment while we check with Paystack.</p>
        </>
      )}
      {state === 'done' && (
        <>
          <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center mb-5 border border-primary/30">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">Payment confirmed!</h1>
          <p className="text-muted-foreground mb-6">Thank you. We are firing up the grill, taking you to tracking...</p>
          <Button asChild className="rounded-full">
            <Link href={`/track?id=${encodeURIComponent(tracking)}`}>Track my order</Link>
          </Button>
        </>
      )}
      {state === 'error' && (
        <>
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-5 border border-destructive/30">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">We could not confirm this payment</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            If you were charged, message us on WhatsApp with your tracking ID
            {tracking ? ` (${tracking})` : ''} and we will sort it out right away.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={tracking ? `/track?id=${encodeURIComponent(tracking)}` : '/track'}>Go to tracking</Link>
          </Button>
        </>
      )}
    </div>
  )
}

export default function OrderPaidPage() {
  return (
    <Suspense fallback={<div className="pt-36 text-center text-muted-foreground">Loading...</div>}>
      <PaidContent />
    </Suspense>
  )
}
