'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, MessageCircle, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { useCart } from '@/context/cart-context'
import { generateTrackingId, saveOrder, type FulfillmentType } from '@/lib/orders'

// 'saving' = persisting the request + redirecting to confirmation.
type RequestPhase = 'idle' | 'saving'

export default function CheckoutClient() {
  const router = useRouter()
  const { items, itemCount, clearCart } = useCart()

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState('')
  const [phase, setPhase] = useState<RequestPhase>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!phone.trim()) next.phone = 'Phone number is required'
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (fulfillmentType === 'delivery') {
      if (!address.trim()) next.address = 'Delivery address is required'
      if (!area.trim()) next.area = 'Area / landmark is required'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSendRequest = () => {
    if (!validate() || items.length === 0) return

    setPhase('saving')
    const trackingId = generateTrackingId()
    const order = {
      trackingId,
      createdAt: new Date().toISOString(),
      customer: { fullName: fullName.trim(), phone: phone.trim(), email: email.trim() },
      fulfillment: {
        type: fulfillmentType,
        address: address.trim(),
        area: area.trim(),
        notes: notes.trim(),
      },
      items: [...items],
      awaitingQuote: true as const,
    }
    saveOrder(order)

    // Persist the request to the database and alert the kitchen that a new
    // quote is needed. keepalive lets it finish after we navigate away; a
    // failure never blocks the customer (the request is mirrored to localStorage).
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        trackingId: order.trackingId,
        createdAt: order.createdAt,
        customer: order.customer,
        fulfillment: order.fulfillment,
        items: order.items.map((i) => ({ name: i.name, qty: i.qty, image: i.image })),
        awaitingQuote: true,
      }),
    }).catch(() => {})

    clearCart()
    router.push(`/order/confirmation?tracking=${encodeURIComponent(trackingId)}`)
  }

  if (phase !== 'idle') {
    return (
      <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-base sm:text-lg animate-pulse">Sending your request...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-base sm:text-lg mb-6">Your request is empty.</p>
        <Button asChild className="rounded-full">
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </div>
    )
  }

  const inputClass = 'h-10 sm:h-12 rounded-xl bg-background border-input text-sm sm:text-base'

  return (
    <div className="pt-28 md:pt-36 pb-16 md:pb-24 px-3 sm:px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 sm:mb-8 text-xs sm:text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to request
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-bold mb-2 px-1">
          Send your request
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 md:mb-10 px-1">
          Tell us where it is going and how to reach you. We will reply with a quote for today, then you can pay.
        </p>

        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 md:gap-10">
          <div className="lg:col-span-3 space-y-6 sm:space-y-8">
            {/* Your details */}
            <section className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Your details</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Amaka Bello" className={inputClass} />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className={inputClass} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputClass} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
            </section>

            {/* Pickup or delivery */}
            <section className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Pickup or delivery</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {([
                  { value: 'delivery', title: 'Delivery', sub: '35 to 45 mins, Abuja-wide' },
                  { value: 'pickup', title: 'Pickup', sub: 'Collect at our kitchen' },
                ] as const).map((opt) => {
                  const active = fulfillmentType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFulfillmentType(opt.value)}
                      className={`text-left flex items-start gap-3 rounded-2xl border p-3 sm:p-4 transition-colors ${
                        active ? 'border-primary bg-primary/10' : 'border-border bg-muted'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                          active ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}
                      />
                      <span>
                        <span className="block font-bold text-sm sm:text-base">{opt.title}</span>
                        <span className="block text-[10px] sm:text-xs text-muted-foreground">{opt.sub}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {fulfillmentType === 'delivery' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery address</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, house number, estate" className={inputClass} />
                    {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area / landmark</Label>
                    <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Wuse 2, Maitama" className={inputClass} />
                    {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-3 sm:mt-4">
                <Label htmlFor="notes">Request notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra pepper, event date, serving time, etc." className="min-h-[80px]" />
              </div>
            </section>

            {/* What happens next */}
            <section className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">What happens next</h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  'You send this request, no payment required yet.',
                  'We reply with a quote for today, by WhatsApp and email.',
                  'You confirm and pay by bank transfer or online, then we start grilling.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Request summary */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6 lg:p-8 sticky top-28 lg:top-32">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Your request</h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-56 md:max-h-64 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-2 sm:gap-3 items-center">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" sizes="56px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary/30">
                          <Utensils className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate">{item.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Qty {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 sm:space-y-3 border-t border-border pt-3 sm:pt-4 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items</span>
                  <span className="font-bold text-foreground">{itemCount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Price</span>
                  <span className="font-bold text-foreground">Quoted after you send</span>
                </div>
              </div>

              <Button
                className="w-full h-12 md:h-14 rounded-full text-sm sm:text-base md:text-lg mt-6 md:mt-8 active:scale-95 transition-transform"
                onClick={handleSendRequest}
                disabled={phase !== 'idle'}
              >
                Send request
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-secondary" />
                No payment now. We reply with a quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
