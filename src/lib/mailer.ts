import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
})

const adminEmail = () => process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL!

// ─── Quote Enquiry ─────────────────────────────────────────────────

export async function sendEnquiryEmail(data: { name: string; phone: string; email: string; serviceType: string; projectLocation: string; budget: string; message: string }) {
  await transporter.sendMail({
    from: `"${data.name}" <${process.env.SMTP_EMAIL}>`,
    to: adminEmail(),
    subject: `New Quote Request — ${data.serviceType} | ${data.name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><div style="background:#1A3C5E;padding:24px 32px;border-radius:12px 12px 0 0"><h2 style="color:white;margin:0">New Quote Request</h2></div><div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p><b>Name:</b> ${data.name}</p><p><b>Phone:</b> ${data.phone}</p><p><b>Email:</b> ${data.email}</p><p><b>Service:</b> ${data.serviceType}</p><p><b>Location:</b> ${data.projectLocation}</p><p><b>Budget:</b> ${data.budget}</p>${data.message ? `<p><b>Message:</b> ${data.message}</p>` : ''}</div></div>`,
  })
  await transporter.sendMail({
    from: `"Kiriti Constructions & Developers" <${process.env.SMTP_EMAIL}>`,
    to: data.email,
    subject: 'We received your quote request — Kiriti Constructions & Developers',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><div style="background:#1A3C5E;padding:24px 32px;border-radius:12px 12px 0 0"><h2 style="color:white;margin:0">Thank You, ${data.name}!</h2></div><div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p>We received your quote request for <b>${data.serviceType}</b> and will get back to you within 24 hours.</p><p>📞 <b>+91 93866 55555</b></p></div></div>`,
  })
}

// ─── Payment Confirmation ───────────────────────────────────────────

export async function sendPaymentConfirmation(data: { clientName: string; clientEmail: string; amount: number; description: string; projectTitle: string; paymentId: string }) {
  const formatted = `₹${(data.amount / 100).toLocaleString('en-IN')}`
  await transporter.sendMail({
    from: `"Kiriti Constructions & Developers" <${process.env.SMTP_EMAIL}>`,
    to: data.clientEmail,
    subject: `Payment Confirmed — ${formatted} | ${data.projectTitle}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><div style="background:#1A3C5E;padding:24px 32px;border-radius:12px 12px 0 0"><h2 style="color:white;margin:0">Payment Confirmed ✓</h2></div><div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p>Dear <b>${data.clientName}</b>,</p><p>Your payment of <b>${formatted}</b> for <b>${data.description}</b> has been successfully received.</p><p><b>Project:</b> ${data.projectTitle}</p><p><b>Payment ID:</b> ${data.paymentId}</p><p>You can view your payment history in your client portal.</p></div></div>`,
  })
  await transporter.sendMail({
    from: `"Kiriti Constructions & Developers" <${process.env.SMTP_EMAIL}>`,
    to: adminEmail(),
    subject: `Payment Received — ${formatted} from ${data.clientName}`,
    html: `<p>Payment of <b>${formatted}</b> received from <b>${data.clientName}</b> for <b>${data.description}</b>.<br>Payment ID: ${data.paymentId}</p>`,
  })
}

// ─── Low Stock Alert ───────────────────────────────────────────────

export async function sendLowStockAlert(data: { projectTitle: string; materialName: string; unit: string; balance: number; threshold: number }) {
  const subject = `Low Stock Alert — ${data.materialName} | ${data.projectTitle}`
  const html = `<div style="font-family:Arial,sans-serif;max-width:580px">
    <div style="background:#1A3C5E;padding:24px 32px;border-radius:12px 12px 0 0">
      <h2 style="color:#F59E0B;margin:0;font-size:18px;">Low Stock Alert</h2>
    </div>
    <div style="background:#fef3c7;padding:32px;border:1px solid #fcd34d;border-radius:0 0 12px 12px">
      <p style="font-size:15px;color:#1C1C1E;margin-bottom:12px;">Material stock has fallen below the minimum threshold.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#8A8A8A;font-size:13px;width:160px">Project</td><td style="padding:8px 0;color:#1C1C1E;font-size:13px;font-weight:600">${data.projectTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#8A8A8A;font-size:13px">Material</td><td style="padding:8px 0;color:#dc2626;font-size:13px;font-weight:600">${data.materialName}</td></tr>
        <tr><td style="padding:8px 0;color:#8A8A8A;font-size:13px">Current Balance</td><td style="padding:8px 0;color:#dc2626;font-size:15px;font-weight:700">${data.balance} ${data.unit}</td></tr>
        <tr><td style="padding:8px 0;color:#8A8A8A;font-size:13px">Minimum Threshold</td><td style="padding:8px 0;color:#1C1C1E;font-size:13px">${data.threshold} ${data.unit}</td></tr>
      </table>
      <div style="margin-top:20px;padding:14px;background:#dc262615;border-left:4px solid #dc2626;">
        <p style="margin:0;font-size:13px;color:#1C1C1E;">Please arrange for immediate replenishment to avoid project delays.</p>
      </div>
    </div>
  </div>`
  await transporter.sendMail({
    from: `"Kiriti Constructions & Developers" <${process.env.SMTP_EMAIL}>`,
    to: adminEmail(),
    subject, html,
  })
}

export function buildLowStockWhatsApp(adminPhone: string, data: { projectTitle: string; materialName: string; unit: string; balance: number; threshold: number }): string {
  const msg = `*Low Stock Alert — Kiriti Constructions & Developers*\n\nProject: *${data.projectTitle}*\nMaterial: *${data.materialName}*\nCurrent Balance: *${data.balance} ${data.unit}*\nMinimum Required: ${data.threshold} ${data.unit}\n\nPlease arrange replenishment immediately to avoid delays.`
  const phone = adminPhone.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

// ─── Milestone Update ───────────────────────────────────────────────

export async function sendMilestoneUpdate(data: { clientName: string; clientEmail: string; milestoneTitle: string; projectTitle: string; percentage: number }) {
  await transporter.sendMail({
    from: `"Kiriti Constructions & Developers" <${process.env.SMTP_EMAIL}>`,
    to: data.clientEmail,
    subject: `Project Update: "${data.milestoneTitle}" Completed — ${data.projectTitle}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><div style="background:#1A3C5E;padding:24px 32px;border-radius:12px 12px 0 0"><h2 style="color:white;margin:0">Milestone Completed 🏗️</h2></div><div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p>Dear <b>${data.clientName}</b>,</p><p>Great news! The milestone <b>"${data.milestoneTitle}"</b> for your project <b>${data.projectTitle}</b> has been completed.</p><p>Overall project progress: <b>${data.percentage}%</b></p><p>Log in to your client portal to view photos and updates.</p></div></div>`,
  })
}
