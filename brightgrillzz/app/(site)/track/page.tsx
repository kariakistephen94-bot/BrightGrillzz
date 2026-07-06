'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Flame, Package, Truck, Search, Download, Loader2, XCircle, Tag } from 'lucide-react'
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
import { useSiteSettings } from '@/context/settings-context'

// Live status pulled from the database (kept in sync with the admin dashboard).
interface LiveItem {
  name: string
  qty: number
  unitPrice: number
}
interface LiveOrder {
  trackingId: string
  status: OrderStatus
  fulfillmentType: 'delivery' | 'pickup'
  total: number
  paymentMethod: 'bank_transfer' | 'paystack'
  paymentConfirmed: boolean
  cancellationNote: string | null
  riderNumber: string | null
  items: LiveItem[]
  payUrl: string | null
  customerPaidNotice: boolean
}

function parseLive(raw: unknown): LiveOrder | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!o.tracking_id) return null
  const items: LiveItem[] = Array.isArray(o.items)
    ? (o.items as Record<string, unknown>[]).map((it) => ({
        name: String(it.name ?? ''),
        qty: Number(it.qty) || 0,
        unitPrice: Number(it.unit_price) || 0,
      }))
    : []
  return {
    trackingId: String(o.tracking_id),
    status: (o.status as OrderStatus) ?? 'pending',
    fulfillmentType: o.fulfillment_type === 'pickup' ? 'pickup' : 'delivery',
    total: Number(o.total) || 0,
    paymentMethod: o.payment_method === 'paystack' ? 'paystack' : 'bank_transfer',
    paymentConfirmed: Boolean(o.payment_confirmed),
    cancellationNote: o.cancellation_note ? String(o.cancellation_note) : null,
    riderNumber: o.rider_number ? String(o.rider_number) : null,
    items,
    payUrl: o.pay_url ? String(o.pay_url) : null,
    customerPaidNotice: Boolean(o.customer_paid_notice),
  }
}

// Where each status sits on the 4-step timeline, and the progress bar %.
const STATUS_STEP: Record<OrderStatus, { step: number; progress: number }> = {
  awaiting_quote: { step: 1, progress: 12 },
  quoted: { step: 1, progress: 22 },
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
  const [reporting, setReporting] = useState(false)
  const [payingOnline, setPayingOnline] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const activeId = useRef<string>('')
  const settings = useSiteSettings()

  const handleDownload = async () => {
    if (!localOrder) return
    setDownloading(true)
    try {
      await downloadOrderReceipt(localOrder)
    } finally {
      setDownloading(false)
    }
  }

  // Fetch the live DB status. No setState here, callers own the loading UI.
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

  // Customer chooses to pay the quote online → fetch a Paystack link and go.
  const payOnline = async (id: string) => {
    setPayingOnline(true)
    setPayError(null)
    try {
      const res = await fetch('/api/orders/pay-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string }
      if (json.ok && json.url) {
        window.location.href = json.url
        return
      }
      setPayError(json.error || 'Online payment is unavailable right now. Please use bank transfer.')
    } catch {
      setPayError('Could not start online payment. Please use bank transfer.')
    } finally {
      setPayingOnline(false)
    }
  }

  // Customer reports a bank transfer for a quoted order → flags it for admin.
  const reportBankPayment = async (id: string) => {
    setReporting(true)
    try {
      const res = await fetch('/api/orders/paid-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        const updated = await fetchLive(id)
        if (updated && activeId.current === id) setLive(updated)
      }
    } finally {
      setReporting(false)
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
                <span>{fulfillment === 'delivery' ? 'Delivery' : 'Pickup'} · {total > 0 ? formatNaira(total) : 'Quote pending'}</span>
                {paymentMethod === 'bank_transfer' && status !== 'awaiting_quote' && status !== 'quoted' && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      paymentConfirmed ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {paymentConfirmed ? 'Payment confirmed' : 'Awaiting payment confirmation'}
                  </span>
                )}
              </div>

              {status === 'awaiting_quote' && (
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm">
                  <p className="mb-1 font-bold text-foreground">Preparing your quote</p>
                  <p className="text-muted-foreground">
                    We have your request and will send your price shortly, by WhatsApp and email. Check back here soon.
                  </p>
                </div>
              )}

              {status === 'quoted' && !paymentConfirmed && (
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Your quote is ready</h3>
                  </div>

                  {live?.items && live.items.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {live.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{it.name} × {it.qty}</span>
                          <span className="font-medium">{formatNaira(it.unitPrice * it.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="font-bold">Total</span>
                    <span className="font-headline text-xl font-bold text-primary">{formatNaira(total)}</span>
                  </div>

                  {live?.customerPaidNotice ? (
                    <div className="rounded-xl bg-amber-500/10 p-3 text-center text-sm font-medium text-amber-700">
                      Payment reported. We&apos;ll confirm it shortly and start grilling.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={() => payOnline(trackingId)}
                        disabled={payingOnline}
                        className="h-12 w-full rounded-full font-bold"
                      >
                        {payingOnline ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Pay {formatNaira(total)} online
                      </Button>
                      {payError && <p className="text-center text-xs text-destructive">{payError}</p>}
                      <div className="text-center text-xs text-muted-foreground">or</div>
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Or pay by bank transfer
                        </p>
                        <div className="space-y-2 text-sm">
                          {[
                            { label: 'Account number', value: settings.accountNumber },
                            { label: 'Bank', value: settings.bank },
                            { label: 'Account name', value: settings.accountName },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">{row.label}</span>
                              <span className="inline-flex items-center gap-1 font-semibold">
                                {row.value}
                                <CopyButton value={row.value} label={row.label} className="h-6 w-6" />
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => reportBankPayment(trackingId)}
                          disabled={reporting}
                          variant="outline"
                          className="mt-3 h-11 w-full rounded-full font-bold"
                        >
                          {reporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          I&apos;ve made the payment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
