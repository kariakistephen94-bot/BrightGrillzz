// Resend / email configuration. Everything stays disabled (no-op) until
// RESEND_API_KEY is set, so the ordering flow keeps working without email.
import { CONTACT } from '@/lib/contact'

export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''

// Verified sender. Until you verify a domain in Resend, the shared
// `onboarding@resend.dev` sender works for testing.
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'BrightGrillzz <onboarding@resend.dev>'

// Where the restaurant receives new-order / reservation alerts.
export const NOTIFICATION_EMAIL =
  process.env.ORDER_NOTIFICATION_EMAIL ?? CONTACT.email

export const isEmailConfigured = Boolean(RESEND_API_KEY)
