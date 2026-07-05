'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Flame, User, Truck, Search, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { CopyButton } from '@/components/ui/CopyButton'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { getOrderByTrackingId, type Order } from '@/lib/orders'
import { formatNaira } from '@/lib/format'
import { getWhatsAppOrderUrl } from '@/lib/whatsapp'
import { downloadOrderReceipt } from '@/lib/receipt-pdf'

const steps = [
  { id: 1, label: 'Order Confirmed', icon: CheckCircle2 },
  { id: 2, label: 'On the Grill', icon: Flame },
  { id: 3, label: 'Ready', icon: User },
  { id: 4, label: 'Out for Delivery', icon: Truck },
]

// Frontend-only: a placed order is treated as confirmed & preparing.
const CURRENT_STEP = 1
const PROGRESS = 30

function TrackContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('id') || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [searched, setSearched] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!order) return
    setDownloading(true)
    try {
      await downloadOrderReceipt(order)
    } finally {
      setDownloading(false)
    }
  }

  const lookup = useCallback((rawId: string) => {
    const id = rawId.trim().toUpperCase()
    if (!id) return
    setSearched(true)
    setOrder(getOrderByTrackingId(id))
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setQuery(id)
      lookup(id)
    }
  }, [searchParams, lookup])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    lookup(query)
  }

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
          <Button type="submit" className="rounded-full px-6 shrink-0">
            <Search className="w-5 h-5" />
          </Button>
        </form>

        {searched && !order && (
          <div className="text-center glass-card rounded-3xl p-10">
            <p className="text-muted-foreground mb-4">
              No order found for <span className="font-mono font-bold text-foreground">{query}</span>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Orders are saved on the device they were placed on. Try the same phone or browser you ordered with.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/menu">Place a new order</Link>
            </Button>
          </div>
        )}

        {order && (
          <>
            <div className="glass-card rounded-[3rem] p-8 md:p-12 shadow-premium-sm mb-8">
              <div className="flex items-center justify-between gap-3 mb-6 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Tracking ID</p>
                  <p className="text-xl font-bold font-mono">{order.trackingId}</p>
                </div>
                <CopyButton value={order.trackingId} label="Tracking ID" />
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {order.fulfillment.type === 'delivery' ? 'Delivery' : 'Pickup'} · {formatNaira(order.total)}
              </p>

              <div className="mb-10 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Order progress
                  </span>
                  <span className="text-sm font-bold text-primary">{PROGRESS}%</span>
                </div>
                <Progress value={PROGRESS} className="h-3" />
              </div>

              <div className="space-y-8 relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
                {steps.map((step) => {
                  const Icon = step.icon
                  const isActive = step.id <= CURRENT_STEP
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
                          <p className="text-sm text-muted-foreground">{isActive ? 'In progress / completed' : 'Upcoming'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

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

            <div className="glass-card rounded-[2rem] p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">Notify us on WhatsApp about your order</p>
              <Button asChild className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold">
                <a href={getWhatsAppOrderUrl(order)} target="_blank" rel="noopener noreferrer">
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
