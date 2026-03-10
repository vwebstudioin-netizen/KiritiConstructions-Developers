import { NextRequest, NextResponse } from 'next/server'
import { sendLowStockAlert, buildLowStockWhatsApp } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const { projectTitle, materialName, unit, balance, threshold } = await req.json()

    const adminPhone = process.env.ADMIN_WHATSAPP || '919386655555'

    // Send email to admin
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      await sendLowStockAlert({ projectTitle, materialName, unit, balance, threshold })
    }

    // Build WhatsApp URL for admin to manually send
    const whatsappUrl = buildLowStockWhatsApp(adminPhone, { projectTitle, materialName, unit, balance, threshold })

    return NextResponse.json({ success: true, whatsappUrl })
  } catch (err) {
    console.error('Low stock alert error:', err)
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 })
  }
}
