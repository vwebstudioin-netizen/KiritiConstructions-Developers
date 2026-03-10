import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Quote, CompanyInfo } from '@/types'

// Colours
const PRIMARY = '#1A3C5E'
const ACCENT  = '#F59E0B'
const LIGHT   = '#EEF3F8'
const MUTED   = '#64748B'
const DARK    = '#1E293B'

function hex2rgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export function generateQuotePDF(quote: Quote, company: CompanyInfo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210
  const margin = 15

  // ── Header bar ────────────────────────────────────────────────
  doc.setFillColor(...hex2rgb(PRIMARY))
  doc.rect(0, 0, W, 38, 'F')

  // Company name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text(company.name, margin, 14)

  // Tagline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 220, 240)
  doc.text(company.tagline, margin, 20)

  // Contact line
  doc.setFontSize(7.5)
  doc.text(`${company.phone}  |  ${company.email}  |  ${company.address}`, margin, 27)

  // QUOTATION title on right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...hex2rgb(ACCENT))
  doc.text('QUOTATION', W - margin, 16, { align: 'right' })

  // Quote number + date
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 240)
  doc.text(quote.quoteNumber, W - margin, 24, { align: 'right' })
  doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - margin, 30, { align: 'right' })
  doc.text(`Valid for ${quote.validityDays} days`, W - margin, 36, { align: 'right' })

  let y = 46

  // ── Two-column: Prepared for  |  Project Details ──────────────
  // Left: client
  doc.setFillColor(...hex2rgb(LIGHT))
  doc.roundedRect(margin, y, 84, 30, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text('PREPARED FOR', margin + 4, y + 7)
  doc.setFontSize(10)
  doc.setTextColor(...hex2rgb(DARK))
  doc.text(quote.clientName, margin + 4, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text(quote.clientPhone, margin + 4, y + 20)
  if (quote.clientEmail) doc.text(quote.clientEmail, margin + 4, y + 26)

  // Right: project
  const rx = W / 2 + 4
  doc.setFillColor(...hex2rgb(LIGHT))
  doc.roundedRect(rx, y, W - rx - margin, 30, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text('PROJECT / WORK', rx + 4, y + 7)
  doc.setFontSize(10)
  doc.setTextColor(...hex2rgb(DARK))
  // Wrap long project title
  const wrappedTitle = doc.splitTextToSize(quote.projectTitle, W - rx - margin - 8)
  doc.text(wrappedTitle[0], rx + 4, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...hex2rgb(MUTED))
  if (quote.siteAddress) {
    const wrappedAddr = doc.splitTextToSize(quote.siteAddress, W - rx - margin - 8)
    doc.text(wrappedAddr[0], rx + 4, y + 20)
    if (wrappedAddr[1]) doc.text(wrappedAddr[1], rx + 4, y + 26)
  }

  y += 38

  // ── Items Table ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...hex2rgb(PRIMARY))
  doc.text('BILL OF QUANTITIES', margin, y)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Description', 'Unit', 'Qty', 'Rate (₹)', 'Amount (₹)']],
    body: quote.items.map((item, i) => [
      i + 1,
      item.description,
      item.unit,
      item.quantity.toLocaleString('en-IN'),
      item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ]),
    headStyles: {
      fillColor: hex2rgb(PRIMARY),
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8.5, textColor: hex2rgb(DARK) },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: hex2rgb(LIGHT),
    tableLineWidth: 0.2,
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── Totals box ────────────────────────────────────────────────
  const boxX = W - margin - 72
  const boxW = 72

  // Subtotal
  doc.setFillColor(...hex2rgb(LIGHT))
  doc.rect(boxX, y, boxW, 8, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text('Subtotal', boxX + 4, y + 5.5)
  doc.setTextColor(...hex2rgb(DARK))
  doc.text(`₹${quote.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, boxX + boxW - 4, y + 5.5, { align: 'right' })
  y += 9

  // GST
  doc.setFillColor(...hex2rgb(LIGHT))
  doc.rect(boxX, y, boxW, 8, 'F')
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text(`GST (${quote.gstPercent}%)`, boxX + 4, y + 5.5)
  doc.setTextColor(...hex2rgb(DARK))
  doc.text(`₹${quote.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, boxX + boxW - 4, y + 5.5, { align: 'right' })
  y += 10

  // Total
  doc.setFillColor(...hex2rgb(PRIMARY))
  doc.rect(boxX, y, boxW, 11, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL', boxX + 4, y + 7.5)
  doc.setTextColor(...hex2rgb(ACCENT))
  doc.text(`₹${quote.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, boxX + boxW - 4, y + 7.5, { align: 'right' })
  y += 16

  // Amount in words
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text(`Amount in words: ${amountInWords(quote.totalAmount)} Only`, margin, y)
  y += 10

  // ── Notes ─────────────────────────────────────────────────────
  if (quote.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...hex2rgb(PRIMARY))
    doc.text('NOTES', margin, y); y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...hex2rgb(DARK))
    const noteLines = doc.splitTextToSize(quote.notes, W - 2 * margin)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 4.5 + 5
  }

  // ── Terms ─────────────────────────────────────────────────────
  if (quote.terms) {
    // Check if we need a new page
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...hex2rgb(PRIMARY))
    doc.text('TERMS & CONDITIONS', margin, y); y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...hex2rgb(MUTED))
    const termLines = doc.splitTextToSize(quote.terms, W - 2 * margin)
    doc.text(termLines, margin, y)
    y += termLines.length * 3.8 + 6
  }

  // ── Signature block ───────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 20 }
  doc.setDrawColor(...hex2rgb(LIGHT))
  doc.line(margin, y, margin + 55, y)
  doc.line(W - margin - 55, y, W - margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...hex2rgb(MUTED))
  doc.text('Client Signature & Stamp', margin, y + 5)
  doc.text('Authorised Signatory', W - margin, y + 5, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...hex2rgb(DARK))
  doc.text(company.name, W - margin, y + 10, { align: 'right' })

  // ── Footer ────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...hex2rgb(LIGHT))
    doc.rect(0, 287, W, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...hex2rgb(MUTED))
    doc.text(`${company.name}  |  ${company.phone}  |  ${company.email}`, margin, 293)
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 293, { align: 'right' })
  }

  doc.save(`Quote-${quote.quoteNumber.replace(/\//g, '-')}-${quote.clientName}.pdf`)
}

// ── Simple amount to words ──────────────────────────────────────
function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function words(n: number): string {
    if (n === 0) return ''
    if (n < 20) return ones[n] + ' '
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' '
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + words(n % 100)
    if (n < 100000) return words(Math.floor(n / 1000)) + 'Thousand ' + words(n % 1000)
    if (n < 10000000) return words(Math.floor(n / 100000)) + 'Lakh ' + words(n % 100000)
    return words(Math.floor(n / 10000000)) + 'Crore ' + words(n % 10000000)
  }

  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let result = 'Rupees ' + words(rupees).trim()
  if (paise > 0) result += ' and ' + words(paise).trim() + ' Paise'
  return result
}
