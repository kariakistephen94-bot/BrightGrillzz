// Isomorphic (client + server safe) shape and defaults for the live business
// settings that the admin edits under /admin/settings and that the storefront
// reads. The actual DB read lives in `settings.server.ts` (server-only), this
// file holds just the type + fallbacks so client components can import it
// without pulling in the service-role client.
import { CONTACT } from './contact'
import { PAYMENT_DETAILS } from './payment'

export interface SiteSettings {
  name: string
  tagline: string
  /** Phone as entered in admin, used for both display and `tel:` links. */
  phone: string
  email: string
  address: string
  hours: string
  /** Bank transfer details shown at checkout. */
  bank: string
  accountNumber: string
  accountName: string
  /** When false, Paystack / online payments are hidden at checkout. */
  acceptOnlinePayments: boolean
}

// Used when the settings row can't be read (service role not configured, missing
// row, or a field left blank) so the storefront always shows sensible values.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: CONTACT.name,
  tagline: CONTACT.tagline,
  phone: CONTACT.phoneShort,
  email: CONTACT.email,
  address: CONTACT.address,
  hours: CONTACT.hours,
  bank: PAYMENT_DETAILS.bank,
  accountNumber: PAYMENT_DETAILS.accountNumber,
  accountName: PAYMENT_DETAILS.accountName,
  acceptOnlinePayments: true,
}
