import { jsPDF } from 'jspdf'
import { PAYMENT_DETAILS } from '@/lib/payment'
import type { BankDetails } from '@/lib/whatsapp'
import { getPaymentMethod, paymentMethodLabel, type Order } from '@/lib/orders'

type RGB = [number, number, number]

const NAVY: RGB = [0, 26, 77]
const BURGUNDY: RGB = [196, 30, 58]
const DARK: RGB = [21, 24, 43]
const MUTED: RGB = [107, 107, 118]
const LIGHT: RGB = [245, 243, 238]
const LINE: RGB = [226, 226, 218]
const GREEN: RGB = [22, 163, 74]
const AMBER: RGB = [180, 83, 9]
const WHITE: RGB = [255, 255, 255]

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        const comma = result.indexOf(',')
        resolve(comma >= 0 ? result.slice(comma + 1) : null)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function formatReceiptDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

export async function downloadOrderReceipt(
  order: Order,
  bank: BankDetails = PAYMENT_DETAILS,
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 16
  const right = pageW - margin
  const contentW = pageW - margin * 2

  // Load a Unicode font so the Naira (₦) glyph renders; built-ins can't.
  const [regFont, boldFont] = await Promise.all([
    fetchAsBase64('/fonts/Roboto-Regular.ttf'),
    fetchAsBase64('/fonts/Roboto-Bold.ttf'),
  ])

  const logo = await fetchAsBase64('/logo.png')

  let family = 'helvetica'
  let naira = 'NGN '
  if (regFont && boldFont) {
    doc.addFileToVFS('Roboto-Regular.ttf', regFont)
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
    doc.addFileToVFS('Roboto-Bold.ttf', boldFont)
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
    family = 'Roboto'
    naira = '₦'
  }

  const money = (n: number) => `${naira}${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
  const text = (weight: 'normal' | 'bold', size: number, color: RGB) => {
    doc.setFont(family, weight)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
  }
  const fill = (color: RGB) => doc.setFillColor(color[0], color[1], color[2])

  // ============================ HEADER ============================
  // Brand logo (square) in place of the old "B" monogram
  if (logo) {
    doc.addImage(logo, 'PNG', margin, 12, 18, 18)
  }

  const brandX = margin + 22
  text('bold', 19, DARK)
  doc.text('BrightGrillzz', brandX, 22)
  text('normal', 8.5, MUTED)
  doc.text('Premium BBQ  •  Wuse 2, Abuja', brandX, 27.5)

  text('bold', 15, BURGUNDY)
  doc.text('RECEIPT', right, 18, { align: 'right' })
  text('bold', 10, DARK)
  doc.text(order.trackingId, right, 24, { align: 'right' })
  text('normal', 8.5, MUTED)
  doc.text(formatReceiptDate(order.createdAt), right, 29, { align: 'right' })

  let y = 36
  fill(BURGUNDY)
  doc.rect(margin, y, contentW, 1.1, 'F')
  y += 10

  // ===================== BILLED TO / ORDER INFO =====================
  const colL = margin
  const colR = margin + contentW / 2 + 4

  text('bold', 8, MUTED)
  doc.text('BILLED TO', colL, y)
  doc.text('ORDER INFO', colR, y)
  let yL = y + 6
  let yR = y + 6

  text('bold', 10.5, DARK)
  doc.text(order.customer.fullName || 'N/A', colL, yL)
  yL += 5
  text('normal', 9.5, MUTED)
  if (order.customer.phone) {
    doc.text(order.customer.phone, colL, yL)
    yL += 5
  }
  if (order.customer.email) {
    doc.text(order.customer.email, colL, yL)
    yL += 5
  }
  if (order.fulfillment.type === 'delivery') {
    const addr = [order.fulfillment.address, order.fulfillment.area].filter(Boolean).join(', ')
    if (addr) {
      const lines = doc.splitTextToSize(addr, contentW / 2 - 8)
      doc.text(lines, colL, yL)
      yL += lines.length * 5
    }
  }

  const paidViaPaystack = getPaymentMethod(order) === 'paystack'
  const infoRows: [string, string, RGB][] = [
    ['Fulfillment', order.fulfillment.type === 'delivery' ? 'Delivery' : 'Pickup', DARK],
    ['Payment method', paymentMethodLabel(order), DARK],
    ['Payment status', order.paymentConfirmed ? 'CONFIRMED' : 'PENDING', order.paymentConfirmed ? GREEN : AMBER],
  ]
  if (order.paymentReference) {
    infoRows.push(['Payment ref', order.paymentReference, DARK])
  }
  infoRows.forEach(([label, value, color]) => {
    text('normal', 9.5, MUTED)
    doc.text(label, colR, yR)
    text('bold', 9.5, color)
    doc.text(value, right, yR, { align: 'right' })
    yR += 5.5
  })

  y = Math.max(yL, yR) + 6

  // ============================ ITEMS TABLE ============================
  const qtyRight = margin + contentW * 0.62
  const unitRight = margin + contentW * 0.81
  const amountRight = right - 2
  const nameX = margin + 3
  const nameW = qtyRight - nameX - 14

  const drawTableHeader = () => {
    fill(NAVY)
    doc.rect(margin, y, contentW, 9, 'F')
    text('bold', 8, WHITE)
    doc.text('ITEM', nameX, y + 5.9)
    doc.text('QTY', qtyRight, y + 5.9, { align: 'right' })
    doc.text('UNIT PRICE', unitRight, y + 5.9, { align: 'right' })
    doc.text('AMOUNT', amountRight, y + 5.9, { align: 'right' })
    y += 9
  }

  drawTableHeader()

  order.items.forEach((item, idx) => {
    const lines = doc.splitTextToSize(item.name, nameW) as string[]
    const rowH = Math.max(8.5, 3.4 + lines.length * 4.6)

    if (y + rowH > pageH - 60) {
      doc.addPage()
      y = margin
      drawTableHeader()
    }

    if (idx % 2 === 1) {
      fill(LIGHT)
      doc.rect(margin, y, contentW, rowH, 'F')
    }

    const baseline = y + 5.8
    text('normal', 9.5, DARK)
    doc.text(lines, nameX, baseline)
    doc.text(String(item.qty), qtyRight, baseline, { align: 'right' })
    doc.text(money(item.price ?? 0), unitRight, baseline, { align: 'right' })
    text('bold', 9.5, DARK)
    doc.text(money((item.price ?? 0) * item.qty), amountRight, baseline, { align: 'right' })

    y += rowH
  })

  doc.setDrawColor(LINE[0], LINE[1], LINE[2])
  doc.setLineWidth(0.3)
  doc.line(margin, y, right, y)
  y += 8

  // ============================ TOTALS ============================
  const totalsLabelX = margin + contentW * 0.55
  const totalRow = (label: string, value: string, bold: boolean, color: RGB, size: number) => {
    text(bold ? 'bold' : 'normal', size, bold ? color : MUTED)
    doc.text(label, totalsLabelX, y)
    text('bold', size, color)
    doc.text(value, amountRight, y, { align: 'right' })
  }

  totalRow('Subtotal', money(order.subtotal ?? 0), false, DARK, 10)
  y += 5
  doc.setDrawColor(LINE[0], LINE[1], LINE[2])
  doc.line(totalsLabelX, y, amountRight, y)
  y += 7
  totalRow('TOTAL', money(order.total ?? 0), true, BURGUNDY, 13)
  y += 14

  // ===================== PAYMENT DETAILS BOX =====================
  if (y > pageH - 50) {
    doc.addPage()
    y = margin
  }
  const boxH = 24
  fill(LIGHT)
  doc.setDrawColor(LINE[0], LINE[1], LINE[2])
  doc.roundedRect(margin, y, contentW, boxH, 2.5, 2.5, 'FD')
  text('bold', 8, MUTED)
  doc.text('PAYMENT DETAILS', margin + 5, y + 7)
  if (paidViaPaystack) {
    text('bold', 11, DARK)
    doc.text('Paid online via Paystack', margin + 5, y + 14.5)
    text('normal', 10, DARK)
    doc.text(order.paymentReference ? `Reference: ${order.paymentReference}` : 'Payment confirmed', margin + 5, y + 20)
  } else {
    text('bold', 11, DARK)
    doc.text(bank.bank, margin + 5, y + 14.5)
    text('normal', 10, DARK)
    doc.text(bank.accountNumber, margin + 5, y + 20)
    text('normal', 9.5, MUTED)
    doc.text(bank.accountName, right - 5, y + 20, { align: 'right' })
  }
  y += boxH + 12

  // ============================ FOOTER ============================
  text('bold', 10, DARK)
  doc.text('Thank you for ordering from BrightGrillzz!', pageW / 2, y, { align: 'center' })
  y += 5.5
  text('normal', 8.5, MUTED)
  doc.text('Keep this receipt for your records. For enquiries, message us on WhatsApp.', pageW / 2, y, {
    align: 'center',
  })

  doc.save(`BrightGrillzz-receipt-${order.trackingId}.pdf`)
}
