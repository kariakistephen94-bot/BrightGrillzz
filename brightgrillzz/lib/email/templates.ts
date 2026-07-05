import { CONTACT } from '@/lib/contact'

export interface OrderEmailItem {
  name: string
  qty: number
  price: number
}

export interface OrderEmailPayload {
  trackingId: string
  createdAt?: string
  customer: { fullName: string; phone: string; email: string }
  fulfillment: {
    type: 'delivery' | 'pickup'
    address?: string
    area?: string
    notes?: string
  }
  items: OrderEmailItem[]
  subtotal: number
  total: number
  paymentMethod?: 'bank_transfer' | 'paystack'
  paymentReference?: string
}

export interface ReservationEmailPayload {
  name: string
  email: string
  phone: string
  date?: string
  time?: string
  guests?: string
  message?: string
}

export interface BuiltEmail {
  subject: string
  html: string
  text: string
}

const NAVY = '#001a4d'
const BURGUNDY = '#c41e3a'
const CREAM = '#f3efe7'

function naira(n: number): string {
  return '₦' + new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(n)
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paymentLabel(method?: string): string {
  return method === 'paystack' ? 'Paystack (paid online)' : 'Bank transfer'
}

/** Shared responsive shell around a block of body HTML. */
function shell(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:'Helvetica Neue',Arial,sans-serif;color:#15182b;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6e2da;">
        <tr>
          <td style="background:${NAVY};padding:26px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">Bright<span style="color:${BURGUNDY};">Grillzz</span></span>
            <div style="color:#9fb0d6;font-size:12px;margin-top:2px;">Premium BBQ &amp; Grilled Cuisine · Wuse 2, Abuja</div>
          </td>
        </tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:22px 32px;background:#faf8f5;border-top:1px solid #e6e2da;color:#6b6b76;font-size:12px;line-height:1.6;">
            ${esc(CONTACT.name)} · ${esc(CONTACT.address)}<br>
            <a href="tel:${esc(CONTACT.phone)}" style="color:${NAVY};text-decoration:none;">${esc(CONTACT.phoneShort)}</a>
            &nbsp;·&nbsp;
            <a href="${esc(CONTACT.whatsapp)}" style="color:${NAVY};text-decoration:none;">WhatsApp</a>
            &nbsp;·&nbsp; Open 24/7
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function itemsTable(items: OrderEmailItem[], subtotal: number, total: number): string {
  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">
          ${esc(it.name)} <span style="color:#6b6b76;">× ${it.qty}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;white-space:nowrap;">
          ${naira(it.price * it.qty)}
        </td>
      </tr>`,
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    ${rows}
    <tr>
      <td style="padding:12px 0 0;font-size:13px;color:#6b6b76;">Subtotal</td>
      <td style="padding:12px 0 0;font-size:13px;color:#6b6b76;text-align:right;">${naira(subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0 0;font-size:16px;font-weight:700;">Total</td>
      <td style="padding:6px 0 0;font-size:16px;font-weight:700;text-align:right;color:${NAVY};">${naira(total)}</td>
    </tr>
  </table>`
}

function fulfillmentBlock(o: OrderEmailPayload): string {
  const where =
    o.fulfillment.type === 'delivery'
      ? `Delivery${o.fulfillment.address ? ' to ' + esc(o.fulfillment.address) : ''}${
          o.fulfillment.area ? ', ' + esc(o.fulfillment.area) : ''
        }`
      : 'Pickup at our kitchen'
  const notes = o.fulfillment.notes
    ? `<div style="margin-top:6px;color:#6b6b76;font-size:13px;">Notes: ${esc(o.fulfillment.notes)}</div>`
    : ''
  return `<div style="font-size:14px;">${where}</div>${notes}`
}

/** Customer-facing order confirmation. */
export function orderConfirmationEmail(o: OrderEmailPayload): BuiltEmail {
  const firstName = o.customer.fullName.split(/\s+/)[0] || 'there'
  const body = `
    <h1 style="margin:0 0 6px;font-size:22px;">Thanks, ${esc(firstName)}! 🔥</h1>
    <p style="margin:0 0 20px;color:#6b6b76;font-size:14px;line-height:1.6;">
      We&rsquo;ve received your order and the grill is firing up. Here are the details.
    </p>

    <div style="background:#faf8f5;border:1px solid #e6e2da;border-radius:14px;padding:14px 16px;margin-bottom:20px;">
      <div style="font-size:12px;color:#6b6b76;text-transform:uppercase;letter-spacing:.5px;">Tracking ID</div>
      <div style="font-size:20px;font-weight:700;color:${NAVY};letter-spacing:.5px;">${esc(o.trackingId)}</div>
    </div>

    <h2 style="margin:0 0 4px;font-size:15px;">Order summary</h2>
    ${itemsTable(o.items, o.subtotal, o.total)}

    <h2 style="margin:24px 0 4px;font-size:15px;">Fulfillment</h2>
    ${fulfillmentBlock(o)}

    <h2 style="margin:24px 0 4px;font-size:15px;">Payment</h2>
    <div style="font-size:14px;">${esc(paymentLabel(o.paymentMethod))}${
      o.paymentReference ? ` · Ref ${esc(o.paymentReference)}` : ''
    }</div>

    <a href="${esc(CONTACT.whatsapp)}" style="display:inline-block;margin-top:26px;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">
      Message us on WhatsApp
    </a>
  `
  return {
    subject: `Your BrightGrillzz order ${o.trackingId} is confirmed`,
    html: shell(`Order ${o.trackingId} confirmed — ${naira(o.total)}`, body),
    text: [
      `Thanks, ${firstName}! Your BrightGrillzz order is confirmed.`,
      `Tracking ID: ${o.trackingId}`,
      '',
      ...o.items.map((it) => `- ${it.name} x${it.qty}  ${naira(it.price * it.qty)}`),
      `Subtotal: ${naira(o.subtotal)}`,
      `Total: ${naira(o.total)}`,
      '',
      o.fulfillment.type === 'delivery'
        ? `Delivery to ${o.fulfillment.address ?? ''} ${o.fulfillment.area ?? ''}`.trim()
        : 'Pickup at our kitchen',
      `Payment: ${paymentLabel(o.paymentMethod)}${o.paymentReference ? ' (Ref ' + o.paymentReference + ')' : ''}`,
    ].join('\n'),
  }
}

/** Internal alert to the restaurant that a new order landed. */
export function newOrderAlertEmail(o: OrderEmailPayload): BuiltEmail {
  const body = `
    <div style="display:inline-block;background:${BURGUNDY}1a;color:${BURGUNDY};font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px;">New order</div>
    <h1 style="margin:12px 0 6px;font-size:22px;">${esc(o.trackingId)} · ${naira(o.total)}</h1>
    <p style="margin:0 0 20px;color:#6b6b76;font-size:14px;">
      ${esc(o.fulfillment.type === 'delivery' ? 'Delivery' : 'Pickup')} · ${esc(paymentLabel(o.paymentMethod))}
    </p>

    <h2 style="margin:0 0 4px;font-size:15px;">Items</h2>
    ${itemsTable(o.items, o.subtotal, o.total)}

    <h2 style="margin:24px 0 4px;font-size:15px;">Customer</h2>
    <div style="font-size:14px;line-height:1.7;">
      ${esc(o.customer.fullName)}<br>
      <a href="tel:${esc(o.customer.phone)}" style="color:${NAVY};text-decoration:none;">${esc(o.customer.phone)}</a><br>
      <a href="mailto:${esc(o.customer.email)}" style="color:${NAVY};text-decoration:none;">${esc(o.customer.email)}</a>
    </div>

    <h2 style="margin:24px 0 4px;font-size:15px;">Fulfillment</h2>
    ${fulfillmentBlock(o)}
    ${o.paymentReference ? `<div style="margin-top:16px;font-size:13px;color:#6b6b76;">Paystack ref: ${esc(o.paymentReference)}</div>` : ''}
  `
  return {
    subject: `🔔 New order ${o.trackingId} — ${naira(o.total)}`,
    html: shell(`New order from ${o.customer.fullName} — ${naira(o.total)}`, body),
    text: [
      `NEW ORDER ${o.trackingId} — ${naira(o.total)}`,
      `${o.fulfillment.type} · ${paymentLabel(o.paymentMethod)}`,
      '',
      ...o.items.map((it) => `- ${it.name} x${it.qty}  ${naira(it.price * it.qty)}`),
      `Total: ${naira(o.total)}`,
      '',
      `Customer: ${o.customer.fullName} · ${o.customer.phone} · ${o.customer.email}`,
      o.fulfillment.type === 'delivery'
        ? `Deliver to: ${o.fulfillment.address ?? ''} ${o.fulfillment.area ?? ''}`.trim()
        : 'Pickup',
      o.fulfillment.notes ? `Notes: ${o.fulfillment.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

/** Internal alert for a reservation / contact request. */
export function reservationAlertEmail(r: ReservationEmailPayload): BuiltEmail {
  const line = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b6b76;width:120px;">${esc(label)}</td><td style="padding:6px 0;font-size:14px;">${esc(value)}</td></tr>`
      : ''
  const body = `
    <div style="display:inline-block;background:${NAVY}1a;color:${NAVY};font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px;">Reservation request</div>
    <h1 style="margin:12px 0 16px;font-size:22px;">${esc(r.name)}</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${line('Email', r.email)}
      ${line('Phone', r.phone)}
      ${line('Date', r.date)}
      ${line('Time', r.time)}
      ${line('Guests', r.guests)}
      ${line('Message', r.message)}
    </table>
    <a href="tel:${esc(r.phone)}" style="display:inline-block;margin-top:22px;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:999px;">Call ${esc(r.name.split(/\s+/)[0])}</a>
  `
  return {
    subject: `📅 Reservation request — ${r.name}${r.date ? ' · ' + r.date : ''}`,
    html: shell(`Reservation request from ${r.name}`, body),
    text: [
      `RESERVATION REQUEST`,
      `Name: ${r.name}`,
      `Email: ${r.email}`,
      `Phone: ${r.phone}`,
      r.date ? `Date: ${r.date}` : '',
      r.time ? `Time: ${r.time}` : '',
      r.guests ? `Guests: ${r.guests}` : '',
      r.message ? `Message: ${r.message}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}
