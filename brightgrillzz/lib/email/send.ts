import { Resend } from 'resend'
import {
  EMAIL_FROM,
  NOTIFICATION_EMAIL,
  RESEND_API_KEY,
  isEmailConfigured,
} from './config'
import {
  newOrderAlertEmail,
  orderConfirmationEmail,
  reservationAlertEmail,
  type BuiltEmail,
  type OrderEmailPayload,
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
    console.warn('[email] RESEND_API_KEY not set — skipping order emails')
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

/** Restaurant alert for a reservation / contact request. */
export async function sendReservationEmail(
  reservation: ReservationEmailPayload,
): Promise<SendResult> {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not set — skipping reservation email')
    return { sent: false, skipped: true }
  }
  return deliver(
    NOTIFICATION_EMAIL,
    reservationAlertEmail(reservation),
    reservation.email || undefined,
  )
}
