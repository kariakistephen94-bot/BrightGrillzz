// Payment + WhatsApp constants for the BrightGrillzz ordering flow.
//
// This is a frontend-only ordering experience: customers pay by bank transfer
// and confirm on WhatsApp. Replace the placeholder account details below with
// BrightGrillzz's real settlement account before going live.
export const PAYMENT_DETAILS = {
  bank: 'OPay', // TODO: replace with BrightGrillzz's real bank
  accountNumber: '0000000000', // TODO: replace with the real account number
  accountName: 'BrightGrillzz', // TODO: confirm the registered account name
} as const

// Digits only, international format (no "+", no spaces) — used for wa.me links.
export const WHATSAPP_NUMBER = '2348181070919'
