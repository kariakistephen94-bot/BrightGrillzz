import { Resend } from 'resend'
import {
  EMAIL_FROM,
  NOTIFICATION_EMAIL,
  RESEND_API_KEY,
  isEmailConfigured,
} from './config'
import {
  customMessageEmail,
  newOrderAlertEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  quoteEmail,
  reservationAlertEmail,
  type BuiltEmail,
  type OrderEmailPayload,
  type OrderStatusEmailPayload,
  type OrderStatusEventKind,
  type QuoteEmailPayload,
  type ReservationEmailPayload,
} from './templates'

let client: Resend | null = null
function resend(): Resend {
  if (!client) client = new Resend(RESEND_API_KEY)
  return client
}

type SendResult = { sent: boolean; skipped?: boolean; error?: string }

async function deliver(
  to: string,
  email: BuiltEmail,
  replyTo?: string,
): Promise<SendResult> {
  try {
    const { error } = await resend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) return { sent: false, error: error.message }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'send failed' }
  }
}

/** Customer confirmation + restaurant alert for a new order. */
export async function sendOrderEmails(order: OrderEmailPayload): Promise<SendResult> {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not set, skipping order emails')
    return { sent: false, skipped: true }
  }

  const tasks: Promise<SendResult>[] = [
    deliver(NOTIFICATION_EMAIL, newOrderAlertEmail(order), order.customer.email || undefined),
  ]
  if (order.customer.email) {
    tasks.push(
      deliver(order.customer.email, orderConfirmationEmail(order), NOTIFICATION_EMAIL),
    )
  }

  const results = await Promise.all(tasks)
  const failed = results.filter((r) => !r.sent)
  if (failed.length) {
    console.error('[email] order email failures:', failed.map((f) => f.error).join('; '))
  }
  return { sent: results.some((r) => r.sent) }
}

/** Customer-facing order status update (preparing, ready, delivered, cancelled, payment confirmed). */
export async function sendOrderStatusEmail(
  kind: OrderStatusEventKind,
  to: string,
  payload: OrderStatusEmailPayload,
): Promise<SendResult> {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not set, skipping status email')
    return { sent: false, skipped: true }
  }
  if (!to) return { sent: false, skipped: true }
  const result = await deliver(to, orderStatusEmail(kind, payload), NOTIFICATION_EMAIL)
  if (!result.sent && result.error) {
    console.error(`[email] status email (${kind}) failed:`, result.error)
  }
  return result
}

/** Sends a priced quote to a customer. */
export async function sendQuoteEmail(to: string, payload: QuoteEmailPayload): Promise<SendResult> {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not set, skipping quote email')
    return { sent: false, skipped: true }
  }
  if (!to) return { sent: false, skipped: true }
  const result = await deliver(to, quoteEmail(payload), NOTIFICATION_EMAIL)
  if (!result.sent && result.error) console.error('[email] quote email failed:', result.error)
  return result
}

/** A custom, admin-written message to a customer (order or reservation). */
export async function sendCustomMessage(
  to: string,
  subject: string,
  message: string,
  toName = '',
): Promise<SendResult> {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not set, skipping custom message')
    return { sent: false, skipped: true }
  }
  if (!to) return { sent: false, skipped: true }
  const result = await deliver(to, customMessageEmail({ toName, subject, message }), NOTIFICATION_EMAIL)
  if (!result.sent && result.error) {
    console.error('[email] custom message failed:', result.error)
  }
  return result
}

/** Restaurant alert for a reservation / contact request. */
export async function sendReservationEmail(
  reservation: ReservationEmailPayload,
): Promise<SendResult> {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not set, skipping reservation email')
    return { sent: false, skipped: true }
  }
  return deliver(
    NOTIFICATION_EMAIL,
    reservationAlertEmail(reservation),
    reservation.email || undefined,
  )
}
