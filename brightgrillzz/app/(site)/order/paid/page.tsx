'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle, AlertTriangle, Download, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { WHATSAPP_NUMBER } from '@/lib/payment'
import { formatNaira } from '@/lib/format'
import { getLastOrder, getOrderByTrackingId, orderFromApiReceipt, type Order } from '@/lib/orders'
import { downloadOrderReceipt } from '@/lib/receipt-pdf'

// 'verifying' → 'success' (paid) | 'declined' (gateway said no) | 'error' (couldn't check)
type Phase = 'verifying' | 'success' | 'declined' | 'error'

interface ConfirmResponse {
  ok?: boolean
  status?: 'success' | 'declined' | 'error'
  confirmed?: boolean
  reason?: string
  error?: string
  order?: unknown
}

function ReceiptButton({ order }: { order: Order }) {
  const [downloading, setDownloading] = useState(false)
  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadOrderReceipt(order)
    } finally {
      setDownloading(false)
    }
  }
  return (
    <Button
      variant="outline"
      className="h-12 rounded-full font-bold"
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      {downloading ? 'Generating...' : 'Download receipt'}
    </Button>
  )
}

function PaidContent() {
  const params = useSearchParams()
  const tracking = (params.get('tracking') || '').trim()
  const reference = (params.get('reference') || params.get('trxref') || '').trim()
  const missingParams = !tracking || !reference
  // Seed the error state during render so we never setState synchronously in the effect.
  const [phase, setPhase] = useState<Phase>(missingParams ? 'error' : 'verifying')
  const [order, setOrder] = useState<Order | null>(null)
  const [reason, setReason] = useState<string>(
    missingParams ? 'This payment link is missing its tracking or reference' : '',
  )
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || missingParams) return
    ran.current = true

    // A local order (same device that placed the request) fills in any receipt
    // detail the API leaves blank.
    const local = getLastOrder() ?? getOrderByTrackingId(tracking)

    fetch('/api/orders/paystack-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking, reference }),
    })
      .then((r) => r.json() as Promise<ConfirmResponse>)
      .then((json) => {
        setOrder(orderFromApiReceipt(json.order, local))
        if (json.status === 'success') setPhase('success')
        else if (json.status === 'declined') {
          setPhase('declined')
          setReason(json.reason || '')
        } else {
          setPhase('error')
          setReason(json.error || '')
        }
      })
      .catch(() => setPhase('error'))
  }, [tracking, reference, missingParams])

  const trackHref = tracking ? `/track?id=${encodeURIComponent(tracking)}` : '/track'
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi BrightGrillzz, I need help with my payment for order ${tracking || ''}.`,
  )}`

  if (phase === 'verifying') {
    return (
      <Centered>
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-5" />
        <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">Confirming your payment...</h1>
        <p className="text-muted-foreground">One moment while we verify it with Paystack.</p>
      </Centered>
    )
  }

  if (phase === 'success') {
    return (
      <Centered>
        <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center mb-5 border border-primary/30">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">Payment confirmed!</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Thank you{order?.customer.fullName ? `, ${order.customer.fullName}` : ''}. We&apos;ve received your
          payment and we&apos;re firing up the grill.
        </p>

        {order && <ReceiptSummary order={order} />}

        <div className="grid sm:grid-cols-2 gap-3 w-full max-w-md mt-2">
          {order && <ReceiptButton order={order} />}
          <Button asChild className="h-12 rounded-full font-bold">
            <Link href={trackHref}>
              Track my order
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <ContinueShopping />
      </Centered>
    )
  }

  if (phase === 'declined') {
    return (
      <Centered>
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-5 border border-destructive/30">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">Payment declined</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your payment didn&apos;t go through{reason ? ` (${reason})` : ''}, so you have not been charged. You can
          try again from your order page, or reach us on WhatsApp.
        </p>

        {order && <ReceiptSummary order={order} />}

        <div className="grid sm:grid-cols-2 gap-3 w-full max-w-md mt-2">
          {order && <ReceiptButton order={order} />}
          <Button asChild className="h-12 rounded-full font-bold">
            <Link href={trackHref}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try payment again
            </Link>
          </Button>
        </div>
        <WhatsAppHelp href={whatsappHref} />
        <ContinueShopping />
      </Centered>
    )
  }

  // error
  return (
    <Centered>
      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-5 border border-amber-500/30">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-2xl md:text-3xl font-headline font-bold mb-2">We couldn&apos;t confirm this payment</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {(reason ? `${reason}. ` : 'Something went wrong while checking your payment. ') +
          `If you were charged, message us on WhatsApp with your tracking ID${
            tracking ? ` (${tracking})` : ''
          } and we'll sort it out right away.`}
      </p>

      <div className={`grid ${order ? 'sm:grid-cols-2' : ''} gap-3 w-full max-w-md`}>
        {order && <ReceiptButton order={order} />}
        <Button asChild variant="outline" className="h-12 rounded-full font-bold">
          <Link href={trackHref}>Go to tracking</Link>
        </Button>
      </div>
      <WhatsAppHelp href={whatsappHref} />
      <ContinueShopping />
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen flex flex-col items-center justify-center text-center">
      {children}
    </div>
  )
}

function ReceiptSummary({ order }: { order: Order }) {
  return (
    <div className="glass-card rounded-[2rem] p-5 md:p-6 w-full max-w-md mb-6 text-left space-y-2 text-sm">
      <div className="flex justify-between items-center gap-3">
        <span className="text-muted-foreground">Tracking ID</span>
        <span className="inline-flex items-center gap-1 font-mono font-bold">
          {order.trackingId}
          <CopyButton value={order.trackingId} label="Tracking ID" className="h-6 w-6" />
        </span>
      </div>
      {order.total ? (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-bold text-primary">{formatNaira(order.total)}</span>
        </div>
      ) : null}
      {order.paymentReference ? (
        <div className="flex justify-between items-center gap-3">
          <span className="text-muted-foreground shrink-0">Payment ref</span>
          <span className="inline-flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs truncate">{order.paymentReference}</span>
            <CopyButton value={order.paymentReference} label="Payment reference" className="h-6 w-6" />
          </span>
        </div>
      ) : null}
    </div>
  )
}

function WhatsAppHelp({ href }: { href: string }) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-11 rounded-full font-bold mt-4 border-[#25D366] text-[#128C4B] hover:bg-[#25D366]/10"
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="w-4 h-4 mr-2" />
        Get help on WhatsApp
      </a>
    </Button>
  )
}

function ContinueShopping() {
  return (
    <Button asChild variant="link" className="text-muted-foreground mt-6">
      <Link href="/menu">Continue shopping</Link>
    </Button>
  )
}

export default function OrderPaidPage() {
  return (
    <Suspense fallback={<div className="pt-36 text-center text-muted-foreground">Loading...</div>}>
      <PaidContent />
    </Suspense>
  )
}
