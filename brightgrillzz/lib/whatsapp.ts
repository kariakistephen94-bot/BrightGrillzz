import { PAYMENT_DETAILS, WHATSAPP_NUMBER } from '@/lib/payment'
import { formatNaira } from '@/lib/format'
import { getPaymentMethod, type Order } from '@/lib/orders'

export interface BankDetails {
  bank: string
  accountNumber: string
  accountName: string
}

export function buildOrderWhatsAppMessage(
  order: Order,
  bank: BankDetails = PAYMENT_DETAILS,
): string {
  const isRequest = order.awaitingQuote === true

  const lines = [
    isRequest
      ? 'Hello BrightGrillzz! I would like a quote for this request.'
      : 'Hello BrightGrillzz! I have placed an order.',
    '',
    `Tracking ID: ${order.trackingId}`,
    `Name: ${order.customer.fullName}`,
    `Phone: ${order.customer.phone}`,
    `Email: ${order.customer.email}`,
    `Order type: ${order.fulfillment.type === 'delivery' ? 'Delivery' : 'Pickup'}`,
  ]

  if (order.fulfillment.type === 'delivery') {
    lines.push(`Address: ${order.fulfillment.address}`)
    lines.push(`Area: ${order.fulfillment.area}`)
  }

  if (order.fulfillment.notes) {
    lines.push(`Notes: ${order.fulfillment.notes}`)
  }

  lines.push('', 'Items:')
  order.items.forEach((item) => {
    lines.push(`• ${item.name} × ${item.qty}`)
  })

  if (isRequest) {
    lines.push('', 'Please send me a quote for today. Thank you!')
    return lines.join('\n')
  }

  const paymentLine =
    getPaymentMethod(order) === 'paystack'
      ? `I have paid online via Paystack.${order.paymentReference ? ` Payment reference: ${order.paymentReference}.` : ''}`
      : `I have made payment via ${bank.bank} to ${bank.accountNumber} (${bank.accountName}).`

  lines.push(
    '',
    `Total: ${formatNaira(order.total ?? 0)}`,
    '',
    paymentLine,
    '',
    'Please confirm my order. Thank you!',
  )

  return lines.join('\n')
}

export function getWhatsAppOrderUrl(
  order: Order,
  bank: BankDetails = PAYMENT_DETAILS,
): string {
  const text = encodeURIComponent(buildOrderWhatsAppMessage(order, bank))
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}

/** Normalises a Nigerian phone number to wa.me international format (no +). */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return '234' + digits.slice(1)
  return digits
}

/**
 * Deep link that opens WhatsApp to a specific customer with a prefilled custom
 * message. Used by the admin to message a customer about an order or reservation.
 */
export function waLink(phone: string, message: string): string {
  const number = normalizeWhatsAppNumber(phone)
  const text = encodeURIComponent(message)
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`
}
