'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Flame, Package, Truck, Search, Download, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { CopyButton } from '@/components/ui/CopyButton'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { ReviewPrompt } from '@/components/ReviewPrompt'
import { getOrderByTrackingId, type Order } from '@/lib/orders'
import type { OrderStatus } from '@/lib/supabase/queries'
import { formatNaira } from '@/lib/format'
import { getWhatsAppOrderUrl } from '@/lib/whatsapp'
import { WHATSAPP_NUMBER } from '@/lib/payment'
import { downloadOrderReceipt } from '@/lib/receipt-pdf'

// Live status pulled from the database (kept in sync with the admin dashboard).
interface LiveOrder {
  trackingId: string
  status: OrderStatus
  fulfillmentType: 'delivery' | 'pickup'
  total: number
  paymentMethod: 'bank_transfer' | 'paystack'
  paymentConfirmed: boolean
  cancellationNote: string | null
  riderNumber: string | null
}

function parseLive(raw: unknown): LiveOrder | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!o.tracking_id) return null
  return {
    trackingId: String(o.tracking_id),
    status: (o.status as OrderStatus) ?? 'pending',
    fulfillmentType: o.fulfillment_type === 'pickup' ? 'pickup' : 'delivery',
    total: Number(o.total) || 0,
    paymentMethod: o.payment_method === 'paystack' ? 'paystack' : 'bank_transfer',
    paymentConfirmed: Boolean(o.payment_confirmed),
    cancellationNote: o.cancellation_note ? String(o.cancellation_note) : null,
    riderNumber: o.rider_number ? String(o.rider_number) : null,
  }
}

// Where each status sits on the 4-step timeline, and the progress bar %.
const STATUS_STEP: Record<OrderStatus, { step: number; progress: number }> = {
  pending: { step: 1, progress: 20 },
  preparing: { step: 2, progress: 45 },
  ready: { step: 3, progress: 70 },
  out_for_delivery: { step: 4, progress: 90 },
  completed: { step: 4, progress: 100 },
  cancelled: { step: 0, progress: 0 },
}

function stepsFor(fulfillment: 'delivery' | 'pickup') {
  return [
    { id: 1, label: 'Order Confirmed', icon: CheckCircle2, done: 'Confirmed', upcoming: 'Waiting for confirmation' },
    { id: 2, label: 'On the Grill', icon: Flame, done: 'Being prepared', upcoming: 'Upcoming' },
    { id: 3, label: 'Ready', icon: Package, done: 'Packed and ready', upcoming: 'Upcoming' },
    fulfillment === 'pickup'
      ? { id: 4, label: 'Ready for Pickup', icon: Package, done: 'Picked up', upcoming: 'Upcoming' }
      : { id: 4, label: 'Out for Delivery', icon: Truck, done: 'Delivered', upcoming: 'Upcoming' },
  ]
}

function TrackContent() {
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id') || ''
  const [query, setQuery] = useState(idParam)
  const [live, setLive] = useState<LiveOrder | null>(null)
  const [localOrder, setLocalOrder] = useState<Order | null>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const activeId = useRef<string>('')

  const handleDownload = async () => {
    if (!localOrder) return
    setDownloading(true)
    try {
      await downloadOrderReceipt(localOrder)
    } finally {
      setDownloading(false)
    }
  }

  // Fetch the live DB status. No setState here — callers own the loading UI.
  const fetchLive = useCallback(async (id: string): Promise<LiveOrder | null> => {
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = (await res.json()) as { order?: unknown }
      return parseLive(json.order)
    } catch {
      return null
    }
  }, [])

  // Customer confirms their delivery arrived → order becomes completed.
  const confirmDelivery = async (id: string) => {
    setConfirming(true)
    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        const updated = await fetchLive(id)
        if (updated && activeId.current === id) setLive(updated)
      }
    } finally {
      setConfirming(false)
    }
  }

  // Runs the lookup. All state writes happen AFTER the first await, so this is
  // safe to call from an effect without a cascading synchronous render.
  const runLookup = useCallback(
    async (rawId: string) => {
      const id = rawId.trim().toUpperCase()
      if (!id) return
      activeId.current = id
      const liveOrder = await fetchLive(id)
      if (activeId.current !== id) return
      setLocalOrder(getOrderByTrackingId(id))
      setLive(liveOrder)
      setSearched(true)
    },
    [fetchLive],
  )

  // Sync the input to a new ?id= param in render (not an effect) to avoid a
  // cascading setState, then let the effect below trigger the lookup fetch.
  const [seenParam, setSeenParam] = useState(idParam)
  if (idParam && idParam !== seenParam) {
    setSeenParam(idParam)
    setQuery(idParam)
  }

  useEffect(() => {
    if (idParam) void runLookup(idParam)
  }, [idParam, runLookup])

  // Poll every 15s so the page stays in sync with the dashboard, plus on focus.
  useEffect(() => {
    if (!live && !localOrder) return
    const id = activeId.current
    if (!id) return
    const refresh = async () => {
      const updated = await fetchLive(id)
      if (updated && activeId.current === id) setLive(updated)
    }
    const interval = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [live, localOrder, fetchLive])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await runLookup(query)
    setLoading(false)
  }

  const found = live || localOrder
  // Prefer live DB status; fall back to a placed-but-unsynced local order.
  const status: OrderStatus = live?.status ?? 'pending'
  const fulfillment = live?.fulfillmentType ?? localOrder?.fulfillment.type ?? 'delivery'
  const total = live?.total ?? localOrder?.total ?? 0
  const trackingId = live?.trackingId ?? localOrder?.trackingId ?? query.trim().toUpperCase()
  const paymentMethod = live?.paymentMethod ?? localOrder?.paymentMethod ?? 'bank_transfer'
  const paymentConfirmed = live?.paymentConfirmed ?? localOrder?.paymentConfirmed ?? false
  const { step: currentStep, progress } = STATUS_STEP[status]
  const isCancelled = status === 'cancelled'
  const steps = stepsFor(fulfillment)

  return (
    <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">Track Order</h1>
          <p className="text-muted-foreground">Enter the tracking ID from your order confirmation</p>
        </header>

        <form onSubmit={handleSearch} className="flex gap-2 mb-10 max-w-lg mx-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. BG-XXXXX"
            className="h-12 rounded-full bg-muted border-border font-mono uppercase px-5"
          />
          <Button type="submit" disabled={loading} className="rounded-full px-6 shrink-0">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {searched && !found && !loading && (
          <div className="text-center glass-card rounded-3xl p-10">
            <p className="text-muted-foreground mb-4">
              No order found for <span className="font-mono font-bold text-foreground">{query.trim().toUpperCase()}</span>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Double-check the tracking ID from your confirmation email or receipt.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/menu">Place a new order</Link>
            </Button>
          </div>
        )}

        {found && (
          <>
            <div className="glass-card rounded-[3rem] p-8 md:p-12 shadow-premium-sm mb-8">
              <div className="flex items-center justify-between gap-3 mb-6 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Tracking ID</p>
                  <p className="text-xl font-bold font-mono">{trackingId}</p>
                </div>
                <CopyButton value={trackingId} label="Tracking ID" />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-muted-foreground">
                <span>{fulfillment === 'delivery' ? 'Delivery' : 'Pickup'} · {formatNaira(total)}</span>
                {paymentMethod === 'bank_transfer' && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      paymentConfirmed ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {paymentConfirmed ? 'Payment confirmed' : 'Awaiting payment confirmation'}
                  </span>
                )}
              </div>

              {isCancelled ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                  <h3 className="text-xl font-bold mb-2">Order Cancelled</h3>
                  {live?.cancellationNote ? (
                    <p className="text-sm text-muted-foreground">{live.cancellationNote}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This order was cancelled. If you have questions, reach us on WhatsApp.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {status === 'out_for_delivery' && (
                    <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-5 h-5 text-secondary" />
                        <h3 className="font-bold">
                          {fulfillment === 'pickup' ? 'Ready for pickup' : 'Out for delivery'}
                        </h3>
                      </div>
                      {live?.riderNumber ? (
                        <p className="text-sm text-muted-foreground">
                          Your rider is on the way. Reach them on{' '}
                          <a href={`tel:${live.riderNumber}`} className="font-semibold text-secondary underline">
                            {live.riderNumber}
                          </a>
                          .
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Your order is on the way.</p>
                      )}
                      <Button
                        onClick={() => confirmDelivery(trackingId)}
                        disabled={confirming}
                        className="mt-4 w-full h-12 rounded-full font-bold"
                      >
                        {confirming ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                        {confirming ? 'Confirming…' : 'Confirm delivery'}
                      </Button>
                    </div>
                  )}

                  <div className="mb-10 mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Order progress
                      </span>
                      <span className="text-sm font-bold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="space-y-8 relative">
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
                    {steps.map((step) => {
                      const Icon = step.icon
                      const isActive = step.id <= currentStep
                      return (
                        <div key={step.id} className="flex gap-6 md:gap-8 relative z-10">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                              isActive
                                ? 'bg-primary border-primary text-white scale-110 shadow-lg'
                                : 'bg-background border-border text-muted-foreground'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 flex items-center">
                            <div>
                              <h4 className={`text-lg md:text-xl font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.label}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isActive
                                  ? step.id === 4 && status === 'out_for_delivery'
                                    ? 'On the way'
                                    : step.done
                                  : step.upcoming}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {status === 'completed' && (
              <ReviewPrompt defaultName={localOrder?.customer.fullName ?? ''} />
            )}

            {localOrder && (
              <div className="glass-card rounded-[2rem] p-6 mb-8">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  variant="outline"
                  className="w-full h-12 rounded-full font-bold"
                >
                  {downloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                  {downloading ? 'Preparing receipt...' : 'Download Receipt'}
                </Button>
              </div>
            )}

            <div className="glass-card rounded-[2rem] p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">Questions about your order? Message us on WhatsApp</p>
              <Button asChild className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold">
                <a
                  href={localOrder ? getWhatsAppOrderUrl(localOrder) : `https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="w-5 h-5 mr-2" />
                  Notify us on WhatsApp
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="pt-36 text-center text-muted-foreground">Loading...</div>}>
      <TrackContent />
    </Suspense>
  )
}
