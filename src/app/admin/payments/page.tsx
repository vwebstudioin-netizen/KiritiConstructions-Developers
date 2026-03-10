'use client'
import { useEffect, useState } from 'react'
import { getAllPayments, getAllProjects, getAllClients, updatePayment } from '@/lib/firestore'
import { getCompanyInfo } from '@/lib/firestore'
import type { Payment, Project, Client } from '@/types'
import { DEFAULT_COMPANY } from '@/types'
import { FiDownload, FiCheckCircle, FiCheck, FiFileText } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { generateReceiptPDF, uploadReceiptAndGetURL } from '@/lib/generateReceipt'

const STATUS_COLORS: Record<string, string> = { pending: 'badge-gray', paid: 'badge-green', failed: 'badge-red' }

function receiptNumber(payId: string): string {
  return `KCD/${new Date().getFullYear()}/${payId.slice(-6).toUpperCase()}`
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all')
  const [marking, setMarking] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [company, setCompany] = useState(DEFAULT_COMPANY)

  useEffect(() => {
    Promise.all([getAllPayments(), getAllProjects(), getAllClients(), getCompanyInfo()]).then(([pays, projs, clts, co]) => {
      setPayments(pays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      const projMap: Record<string, Project> = {}; projs.forEach((p) => { projMap[p.id] = p }); setProjects(projMap)
      const cltMap: Record<string, Client> = {}; clts.forEach((c) => { cltMap[c.uid] = c }); setClients(cltMap)
      if (co) setCompany(co)
    })
  }, [])

  const markAsPaid = async (pay: Payment) => {
    setMarking(pay.id)
    const paidAt = new Date().toISOString()
    await updatePayment(pay.id, { status: 'paid', paidAt })
    setPayments((prev) => prev.map((p) => p.id === pay.id ? { ...p, status: 'paid', paidAt } : p))
    setMarking(null)
  }

  const handleReceiptAction = async (pay: Payment, action: 'download' | 'whatsapp') => {
    const client = clients[pay.clientId ?? '']
    const project = projects[pay.projectId]
    setGenerating(pay.id)
    try {
      const blob = generateReceiptPDF({
        receiptNumber: receiptNumber(pay.id),
        paymentId: pay.id,
        clientName: client?.name ?? 'Client',
        clientPhone: client?.phone ?? '',
        clientEmail: client?.email,
        projectTitle: project?.title ?? 'Your Project',
        description: pay.description,
        amount: pay.amount,
        paidAt: pay.paidAt ?? pay.createdAt,
        companyName: company.name,
        companyAddress: company.address,
        companyPhone: company.phone,
        companyEmail: company.email,
      })

      if (action === 'download') {
        // Download directly in browser
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Receipt-${receiptNumber(pay.id)}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // Upload to Firebase Storage → share URL via WhatsApp
        const pdfUrl = await uploadReceiptAndGetURL(blob, pay.id, client?.name ?? 'client')
        const amount = `Rs. ${pay.amount.toLocaleString('en-IN')}`
        const date = pay.paidAt ? new Date(pay.paidAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')
        const phone = client?.phone.replace(/\D/g, '') ?? ''
        const msg = `Dear ${client?.name ?? 'Sir/Madam'},\n\nThank you for your payment of *${amount}* for *${pay.description}*.\n\nProject: ${project?.title ?? ''}\nDate: ${date}\n\nPlease find your payment receipt here:\n${pdfUrl}\n\nRegards,\n${company.name}`
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
      }
    } catch (err) {
      console.error('Receipt error:', err)
      alert('Could not generate receipt. Check Firebase Storage is configured.')
    }
    setGenerating(null)
  }

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter)
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  const exportCSV = () => {
    const rows = [['Description', 'Project', 'Client', 'Amount', 'Status', 'Date']]
    filtered.forEach((p) => rows.push([p.description, projects[p.projectId]?.title ?? '', clients[p.clientId]?.name ?? '', String(p.amount), p.status, p.paidAt ?? p.createdAt]))
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-dark font-bold">Payments</h1>
        <button onClick={exportCSV} className="btn-outline gap-2 text-sm"><FiDownload size={15} /> Export CSV</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="admin-card"><p className="font-display text-2xl text-green-600 font-bold">₹{totalPaid.toLocaleString('en-IN')}</p><p className="font-body text-xs text-muted mt-0.5">Total Collected</p></div>
        <div className="admin-card"><p className="font-display text-2xl text-accent-dark font-bold">₹{totalPending.toLocaleString('en-IN')}</p><p className="font-body text-xs text-muted mt-0.5">Pending Dues</p></div>
        <div className="admin-card"><p className="font-display text-2xl text-dark font-bold">{payments.length}</p><p className="font-body text-xs text-muted mt-0.5">Total Transactions</p></div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'pending', 'paid', 'failed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl font-body text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark hover:border-primary'}`}>
            {f === 'all' ? `All (${payments.length})` : `${f} (${payments.filter((p) => p.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="admin-card space-y-3">
        {filtered.map((pay) => {
          const client = clients[pay.clientId ?? '']
          const project = projects[pay.projectId]
          const isPending = pay.status === 'pending'
          return (
            <div key={pay.id} className={`p-4 rounded-xl border ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-slate border-gray-100'}`}>
              {/* Top row: description + amount */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-body font-semibold text-dark text-sm">{pay.description}</span>
                    <span className={`badge capitalize ${STATUS_COLORS[pay.status] ?? 'badge-gray'}`}>{pay.status}</span>
                  </div>
                  <p className="font-body text-xs text-muted">{project?.title ?? '—'}</p>
                  <p className="font-body text-xs text-muted">{client?.name ?? '—'} {client ? `· ${client.phone}` : ''}</p>
                  <p className="font-body text-xs text-muted">{new Date(pay.createdAt).toLocaleDateString('en-IN')}</p>
                  {pay.status === 'paid' && pay.paidAt && (
                    <p className="font-body text-xs text-green-600 mt-0.5">Paid on {new Date(pay.paidAt).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
                <p className="font-display text-xl text-dark font-bold flex-shrink-0">
                  ₹{pay.amount.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {isPending ? (
                  <button
                    onClick={() => markAsPaid(pay)}
                    disabled={marking === pay.id}
                    className="flex items-center gap-1.5 font-body text-sm font-semibold bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
                  >
                    <FiCheckCircle size={14} />
                    {marking === pay.id ? 'Saving...' : 'Mark as Paid'}
                  </button>
                ) : pay.status === 'paid' ? (
                  <>
                    <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                      <FiCheck size={13} /> Paid
                    </span>
                    <button
                      onClick={() => handleReceiptAction(pay, 'download')}
                      disabled={generating === pay.id}
                      className="flex items-center gap-1.5 font-body text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60"
                    >
                      <FiFileText size={14} />
                      {generating === pay.id ? 'Generating...' : 'Download Receipt'}
                    </button>
                    {client && (
                      <button
                        onClick={() => handleReceiptAction(pay, 'whatsapp')}
                        disabled={generating === pay.id}
                        className="flex items-center gap-1.5 font-body text-sm font-semibold bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-[#1ebe59] transition-colors disabled:opacity-60"
                      >
                        <FaWhatsapp size={15} />
                        {generating === pay.id ? 'Uploading...' : 'Share PDF via WhatsApp'}
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-center font-body text-muted py-8 text-sm">No payments found.</p>}
      </div>

    </div>
  )
}
