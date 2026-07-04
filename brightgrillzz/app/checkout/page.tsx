'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { CopyButton } from '@/components/ui/CopyButton'
import { toast } from '@/hooks/use-toast'
import { useCart } from '@/context/cart-context'
import { formatNaira } from '@/lib/format'
import {
  generateTrackingId,
  saveOrder,
  type FulfillmentType,
  type PaymentMethod,
} from '@/lib/orders'
import { PAYMENT_DETAILS } from '@/lib/payment'
import { payWithPaystack, verifyPaystackPayment } from '@/lib/paystack'

const paymentRows = [
  { label: 'Account number', value: PAYMENT_DETAILS.accountNumber },
  { label: 'Bank', value: PAYMENT_DETAILS.bank },
  { label: 'Account name', value: PAYMENT_DETAILS.accountName },
]

// 'paying' = Paystack popup open, 'saving' = persisting the order + redirecting.
type CheckoutPhase = 'idle' | 'paying' | 'saving'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [phase, setPhase] = useState<CheckoutPhase>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const total = subtotal

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
    if (paymentMethod === 'bank_transfer' && !paymentConfirmed) {
      next.payment = 'Please confirm you have made the payment'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const finalizeOrder = (payment: { paymentMethod: PaymentMethod; paymentReference?: string }) => {
    const trackingId = generateTrackingId()
    saveOrder({
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
      subtotal,
      total,
      paymentConfirmed: true,
      ...payment,
    })

    clearCart()
    router.push(`/order/confirmation?tracking=${encodeURIComponent(trackingId)}`)
  }

  const failPayment = (message: string) => {
    setPhase('idle')
    setErrors((prev) => ({ ...prev, payment: message }))
    toast({ title: 'Payment not completed', description: message, variant: 'destructive' })
  }

  const handlePlaceOrder = async () => {
    if (!validate() || items.length === 0) return

    if (paymentMethod === 'bank_transfer') {
      setPhase('saving')
      finalizeOrder({ paymentMethod: 'bank_transfer' })
      return
    }

    setPhase('paying')
    try {
      const result = await payWithPaystack({
        email: email.trim(),
        amountNaira: total,
        metadata: {
          custom_fields: [
            { display_name: 'Customer', variable_name: 'customer', value: fullName.trim() },
            { display_name: 'Phone', variable_name: 'phone', value: phone.trim() },
            { display_name: 'Fulfillment', variable_name: 'fulfillment', value: fulfillmentType },
          ],
        },
      })

      if (result.status === 'cancelled') {
        setPhase('idle')
        return
      }

      setPhase('saving')
      const confirmed = await verifyPaystackPayment(result.reference, total)
      if (!confirmed) {
        failPayment(
          `We couldn't confirm this payment with Paystack. If you were debited, message us on WhatsApp with reference ${result.reference}.`,
        )
        return
      }

      finalizeOrder({ paymentMethod: 'paystack', paymentReference: result.reference })
    } catch (err) {
      failPayment(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    }
  }

  // Shown the instant the order is placed — keeps clearCart() from briefly
  // flashing the empty-cart state before the confirmation page loads. While the
  // Paystack popup is open it also sits behind the popup's overlay.
  if (phase !== 'idle') {
    return (
      <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-base sm:text-lg animate-pulse">
          {phase === 'paying' ? 'Waiting for your Paystack payment...' : 'Confirming your order...'}
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pt-28 md:pt-36 pb-24 px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-base sm:text-lg mb-6">Your cart is empty.</p>
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
          Back to cart
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-bold mb-6 sm:mb-8 md:mb-10 px-1">
          Checkout
        </h1>

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
                  { value: 'delivery', title: 'Delivery', sub: '35–45 mins, Abuja-wide' },
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
                <Label htmlFor="notes">Order notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra pepper, call on arrival, etc." className="min-h-[80px]" />
              </div>
            </section>

            {/* Payment */}
            <section className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Payment</h2>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {([
                  { value: 'bank_transfer', title: 'Bank transfer', sub: 'Transfer to our account, then confirm' },
                  { value: 'paystack', title: 'Pay online', sub: 'Card, transfer or USSD via Paystack' },
                ] as const).map((opt) => {
                  const active = paymentMethod === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
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

              {paymentMethod === 'bank_transfer' ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    Transfer the exact order total to the account below, then confirm payment.
                  </p>
                  <div className="space-y-3">
                    {paymentRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 rounded-2xl bg-muted border border-border px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{row.label}</p>
                          <p className="font-bold truncate">{row.value}</p>
                        </div>
                        <CopyButton value={row.value} label={row.label} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted p-3 sm:p-4">
                    <Checkbox checked={paymentConfirmed} onCheckedChange={setPaymentConfirmed} className="mt-0.5" />
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => setPaymentConfirmed(!paymentConfirmed)}
                      className="text-xs sm:text-sm leading-relaxed cursor-pointer select-none"
                    >
                      Yes, I&apos;ve made the payment to the account above for{' '}
                      <span className="font-bold text-primary">{formatNaira(total)}</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border bg-muted p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm leading-relaxed">
                        You&apos;ll pay <span className="font-bold text-primary">{formatNaira(total)}</span> in a
                        secure Paystack window when you place the order — with card, bank transfer or USSD.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Your payment is confirmed instantly, no screenshots needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {errors.payment && <p className="text-xs text-destructive mt-2">{errors.payment}</p>}
            </section>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6 lg:p-8 sticky top-28 lg:top-32">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Order summary</h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-56 md:max-h-64 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-2 sm:gap-3 items-center">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate">{item.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {item.qty} × {formatNaira(item.price)}
                      </p>
                    </div>
                    <p className="font-bold text-xs sm:text-sm shrink-0">{formatNaira(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 sm:space-y-3 border-t border-border pt-3 sm:pt-4 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold pt-1 sm:pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatNaira(total)}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 md:h-14 rounded-full text-sm sm:text-base md:text-lg mt-6 md:mt-8 active:scale-95 transition-transform"
                onClick={handlePlaceOrder}
                disabled={phase !== 'idle'}
              >
                {paymentMethod === 'paystack' ? `Pay ${formatNaira(total)} securely` : 'Place order'}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
              {paymentMethod === 'paystack' && (
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-3">
                  Secured by Paystack
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
