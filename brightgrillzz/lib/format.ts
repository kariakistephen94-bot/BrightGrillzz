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

/** Plain number with thousands separators, e.g. 18,000 */
export function formatNumber(amount: number): string {
  return numberFormatter.format(amount)
}
