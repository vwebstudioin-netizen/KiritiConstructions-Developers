import { NextRequest, NextResponse } from 'next/server'
import { updatePayment, getClientByUid, getProjectById } from '@/lib/firestore'
import { sendPaymentConfirmation } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const {
      paymentId, clientId, projectId, amount, description,
    } = await req.json()

    if (!paymentId) return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 })

    const paidAt = new Date().toISOString()

    // Mark payment as paid in Firestore
    await updatePayment(paymentId, { status: 'paid', paidAt })

    // Send email receipt to client + admin
    let whatsappText = ''
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && clientId) {
      const [client, project] = await Promise.all([
        getClientByUid(clientId),
        projectId ? getProjectById(projectId) : Promise.resolve(null),
      ])

      if (client) {
        await sendPaymentConfirmation({
          clientName: client.name,
          clientEmail: client.email,
          amount: amount * 100, // sendPaymentConfirmation expects paise
          description,
          projectTitle: project?.title ?? 'Your Project',
          paymentId,
        })

        // Build WhatsApp message for admin to send
        const amountFormatted = `₹${Number(amount).toLocaleString('en-IN')}`
        whatsappText = `Dear ${client.name},\n\nThis is to confirm that your payment of *${amountFormatted}* for *${description}* has been received by Kiriti Constructions & Developers Pvt. Ltd.\n\nProject: ${project?.title ?? 'Your Project'}\nDate: ${new Date(paidAt).toLocaleDateString('en-IN')}\n\nThank you for your payment. Please log in to your client portal to view updated project progress.\n\nRegards,\nKiriti Constructions & Developers`

        // WhatsApp URL with client phone
        const phone = client.phone.replace(/\D/g, '')
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`

        return NextResponse.json({ success: true, whatsappUrl, clientName: client.name, clientPhone: client.phone })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Mark-paid error:', err)
    return NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 })
  }
}
