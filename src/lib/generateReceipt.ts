import jsPDF from 'jspdf'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export interface ReceiptData {
  receiptNumber: string       // e.g. "KCD/2025/001"
  paymentId: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  projectTitle: string
  description: string
  amount: number              // in rupees (not paise)
  paidAt: string              // ISO date string
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
}

/**
 * Generates a professional A4 payment receipt PDF and returns it as a Blob.
 */
export function generateReceiptPDF(data: ReceiptData): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210   // page width
  const margin = 18

  const amountFormatted = `Rs. ${Number(data.amount).toLocaleString('en-IN')}`
  const dateFormatted = new Date(data.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  // ─── Header bar ───────────────────────────────────────────────
  doc.setFillColor(26, 60, 94)             // primary #1A3C5E
  doc.rect(0, 0, W, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(data.companyName, margin, 16)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 200, 220)
  doc.text(data.companyAddress, margin, 23)
  doc.text(`${data.companyPhone}  |  ${data.companyEmail}`, margin, 29)

  // Receipt label (right side of header)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(245, 158, 11)           // accent #F59E0B
  doc.text('RECEIPT', W - margin, 20, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 200, 220)
  doc.text(`#${data.receiptNumber}`, W - margin, 28, { align: 'right' })

  // ─── PAID stamp ───────────────────────────────────────────────
  doc.setTextColor(34, 197, 94)            // green-500
  doc.setFontSize(42)
  doc.setFont('helvetica', 'bold')
  doc.text('PAID', W - margin - 2, 60, { align: 'right' })
  // underline-style border
  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(1.2)
  doc.line(W - margin - 38, 63, W - margin, 63)

  // ─── Date ─────────────────────────────────────────────────────
  doc.setTextColor(100, 116, 139)          // muted
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Date of Payment', margin, 50)
  doc.setTextColor(30, 41, 59)             // dark
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(dateFormatted, margin, 57)

  // ─── Divider ──────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(margin, 70, W - margin, 70)

  // ─── Client details ───────────────────────────────────────────
  let y = 82

  const field = (label: string, value: string, x: number, yPos: number) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label.toUpperCase(), x, yPos)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(value, x, yPos + 6)
  }

  field('Received From', data.clientName, margin, y)
  field('Phone', data.clientPhone, 110, y)

  y += 20
  if (data.clientEmail) {
    field('Email', data.clientEmail, margin, y)
    y += 20
  }
  field('Project', data.projectTitle, margin, y)

  // ─── Divider ──────────────────────────────────────────────────
  y += 16
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(margin, y, W - margin, y)

  // ─── Payment details table ─────────────────────────────────────
  y += 12

  // Table header
  doc.setFillColor(248, 250, 252)          // slate bg
  doc.rect(margin, y - 4, W - margin * 2, 10, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('DESCRIPTION', margin + 3, y + 2)
  doc.text('AMOUNT', W - margin - 3, y + 2, { align: 'right' })

  y += 14

  // Table row
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 41, 59)
  doc.text(data.description, margin + 3, y)
  doc.setFont('helvetica', 'bold')
  doc.text(amountFormatted, W - margin - 3, y, { align: 'right' })

  // ─── Total box ────────────────────────────────────────────────
  y += 16
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(margin, y, W - margin, y)

  y += 8
  doc.setFillColor(26, 60, 94)
  doc.roundedRect(W - margin - 68, y - 6, 68, 18, 2, 2, 'F')
  doc.setTextColor(180, 200, 220)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL RECEIVED', W - margin - 4, y + 1, { align: 'right' })
  doc.setTextColor(245, 158, 11)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(amountFormatted, W - margin - 4, y + 9, { align: 'right' })

  // Amount in words
  y += 28
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 116, 139)
  doc.text(`Amount in words: ${amountInWords(data.amount)} Rupees Only`, margin, y)

  // ─── Reference ────────────────────────────────────────────────
  y += 12
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`Payment Reference ID: ${data.paymentId}`, margin, y)

  // ─── Footer ───────────────────────────────────────────────────
  const footerY = 275
  doc.setFillColor(248, 250, 252)
  doc.rect(0, footerY, W, 22, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(0, footerY, W, footerY)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('This is a computer-generated receipt and is valid without a signature.', W / 2, footerY + 7, { align: 'center' })
  doc.text(`${data.companyName}  |  ${data.companyPhone}  |  ${data.companyEmail}`, W / 2, footerY + 14, { align: 'center' })

  return doc.output('blob')
}

/**
 * Uploads the receipt PDF to Firebase Storage and returns the public download URL.
 */
export async function uploadReceiptAndGetURL(blob: Blob, paymentId: string, clientName: string): Promise<string> {
  const safeName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const timestamp = Date.now()
  const path = `receipts/${paymentId}-${safeName}-${timestamp}.pdf`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, blob, { contentType: 'application/pdf' })
  return await getDownloadURL(snapshot.ref)
}

// ─── Helper: number to words (simple Indian format) ───────────────
function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (amount === 0) return 'Zero'

  const convert = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }

  return convert(Math.floor(amount))
}
