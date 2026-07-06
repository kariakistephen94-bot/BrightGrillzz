import CheckoutClient from './CheckoutClient'

// Bank details and the Paystack toggle come from live settings via the site
// layout's SettingsProvider (which reads them per request), so this page just
// renders the checkout form.
export default function CheckoutPage() {
  return <CheckoutClient />
}
