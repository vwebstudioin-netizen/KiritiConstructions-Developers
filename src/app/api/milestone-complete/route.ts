import { NextRequest, NextResponse } from 'next/server'
import { sendMilestoneUpdate } from '@/lib/mailer'
import { getClientByUid, getProjectById } from '@/lib/firestore'

export async function POST(req: NextRequest) {
  try {
    const { clientId, projectTitle, milestoneTitle, percentage } = await req.json()
    if (!clientId || !projectTitle || !milestoneTitle) {
      return NextResponse.json({ success: false, reason: 'missing fields' })
    }
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({ success: false, reason: 'smtp not configured' })
    }
    const client = await getClientByUid(clientId)
    if (!client) return NextResponse.json({ success: false, reason: 'client not found' })
    await sendMilestoneUpdate({
      clientName: client.name,
      clientEmail: client.email,
      milestoneTitle,
      projectTitle,
      percentage,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Milestone email error:', err)
    return NextResponse.json({ success: false, reason: 'error' }, { status: 500 })
  }
}
