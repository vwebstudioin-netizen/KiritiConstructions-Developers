import { NextRequest, NextResponse } from 'next/server'
import { addEnquiry } from '@/lib/firestore'
import { sendEnquiryEmail } from '@/lib/mailer'
import type { EnquiryStatus } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, serviceType, projectLocation, budget, message } = body
    if (!name || !phone || !email || !serviceType || !projectLocation || !budget)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    await addEnquiry({ name, phone, email, serviceType, projectLocation, budget, message: message ?? '', status: 'new' as EnquiryStatus, createdAt: new Date().toISOString() })
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD)
      await sendEnquiryEmail({ name, phone, email, serviceType, projectLocation, budget, message: message ?? '' })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Quote API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
