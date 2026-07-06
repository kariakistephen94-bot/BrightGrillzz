// Payment + WhatsApp constants for the BrightGrillzz ordering flow.
//
// This is a frontend-only ordering experience: customers pay by bank transfer
// and confirm on WhatsApp. Replace the placeholder account details below with
// BrightGrillzz's real settlement account before going live.
export const PAYMENT_DETAILS = {
  bank: 'UBA',
  accountNumber: '1028930153',
  accountName: 'Brightgrillzz Global Ltd',
} as const

// Digits only, international format (no "+", no spaces), used for wa.me links.
export const WHATSAPP_NUMBER = '2348181070919'
