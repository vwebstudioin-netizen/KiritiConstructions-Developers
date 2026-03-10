import { NextRequest, NextResponse } from 'next/server'
import { addUnitEnquiry } from '@/lib/firestore'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { projectId, projectTitle, unitId, unitNumber, name, phone, email, message } = data

    if (!projectId || !name || !phone || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Save to Firestore
    await addUnitEnquiry({
      projectId, projectTitle, unitId, unitNumber,
      name, phone, email, message,
      status: 'new', createdAt: new Date().toISOString(),
    })

    // Send email to admin
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
      })
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL
      const unitInfo = unitNumber ? `Unit: <strong>${unitNumber}</strong><br>` : ''
      await transporter.sendMail({
        from: `"${name}" <${process.env.SMTP_EMAIL}>`,
        to: adminEmail,
        subject: `New Unit Enquiry — ${unitNumber ? `${unitNumber} | ` : ''}${projectTitle}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:580px">
          <div style="background:#1A3C5E;padding:24px 32px;border-radius:12px 12px 0 0">
            <h2 style="color:white;margin:0">New Unit Enquiry</h2>
          </div>
          <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
            <p><b>Project:</b> ${projectTitle}</p>
            ${unitInfo}
            <p><b>Name:</b> ${name}</p>
            <p><b>Phone:</b> ${phone}</p>
            <p><b>Email:</b> ${email}</p>
            ${message ? `<p><b>Message:</b> ${message}</p>` : ''}
            <hr style="margin:16px 0">
            <p style="color:#64748B;font-size:12px">Manage this enquiry at <a href="/admin/inventory">Admin → Inventory</a></p>
          </div>
        </div>`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unit enquiry error:', err)
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 })
  }
}
