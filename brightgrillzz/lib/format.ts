const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Nigerian Naira display, e.g. ₦18,000 */
export function formatNaira(amount: number): string {
  return nairaFormatter.format(amount)
}

/**
 * Compact Naira display for tight spaces (mobile KPI cards, etc.).
 * e.g. ₦950 → ₦950 | ₦18,000 → ₦18k | ₦1,250,000 → ₦1.2m
 */
export function formatNairaCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return `₦${val % 1 === 0 ? val : val.toFixed(1)}m`
  }
  if (amount >= 1_000) {
    const val = amount / 1_000
    return `₦${val % 1 === 0 ? val : val.toFixed(1)}k`
  }
  return `₦${amount}`
}

/** Plain number with thousands separators, e.g. 18,000 */
export function formatNumber(amount: number): string {
  return numberFormatter.format(amount)
}
