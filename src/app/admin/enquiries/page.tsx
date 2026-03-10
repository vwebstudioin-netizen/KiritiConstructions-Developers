'use client'
import { useEffect, useState } from 'react'
import { getAllEnquiries, updateEnquiry, deleteEnquiry } from '@/lib/firestore'
import type { Enquiry, EnquiryStatus } from '@/types'
import { FiPhone, FiMail, FiTrash2, FiHome } from 'react-icons/fi'

const STATUS_COLORS: Record<EnquiryStatus, string> = { new: 'bg-blue-100 text-blue-700', contacted: 'bg-amber-100 text-amber-700', converted: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-muted' }

const isPlotEnquiry = (e: Enquiry) => e.serviceType?.startsWith('Plot/Unit Enquiry')

export default function EnquiriesPage() {
  const [all, setAll] = useState<Enquiry[]>([])
  const [filter, setFilter] = useState<EnquiryStatus | 'all'>('all')

  useEffect(() => {
    getAllEnquiries().then((items) => {
      setAll(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
  }, [])

  const filtered = filter === 'all' ? all : all.filter((e) => e.status === filter)

  const handleStatus = async (item: Enquiry, status: EnquiryStatus) => {
    await updateEnquiry(item.id, { status })
    setAll((prev) => prev.map((e) => e.id === item.id ? { ...e, status } : e))
  }

  const handleDelete = async (item: Enquiry) => {
    if (!confirm('Delete this enquiry?')) return
    await deleteEnquiry(item.id)
    setAll((prev) => prev.filter((e) => e.id !== item.id))
  }

  const newCount = all.filter((e) => e.status === 'new').length

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-2">Enquiries</h1>
      <p className="font-body text-muted text-sm mb-6">
        {newCount} new · {all.filter((e) => !isPlotEnquiry(e)).length} quote requests · {all.filter((e) => isPlotEnquiry(e)).length} plot enquiries
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'new', 'contacted', 'converted', 'closed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl font-body text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark hover:border-primary'}`}>
            {f === 'all' ? `All (${all.length})` : `${f} (${all.filter((e) => e.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((enq) => (
          <div key={enq.id} className="admin-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="font-display text-dark font-bold">{enq.name}</h3>
                  <span className={`badge text-xs ${STATUS_COLORS[enq.status]}`}>{enq.status}</span>
                  {isPlotEnquiry(enq) ? (
                    <span className="flex items-center gap-1 badge bg-primary/10 text-primary">
                      <FiHome size={11} /> Plot Enquiry
                    </span>
                  ) : (
                    <span className="badge-accent">{enq.serviceType}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm font-body text-muted mb-2">
                  <a href={`tel:${enq.phone}`} className="flex items-center gap-1.5 hover:text-primary"><FiPhone size={13} />{enq.phone}</a>
                  <a href={`mailto:${enq.email}`} className="flex items-center gap-1.5 hover:text-primary"><FiMail size={13} />{enq.email}</a>
                  {isPlotEnquiry(enq) ? (
                    <span>{enq.serviceType}</span>
                  ) : (
                    <>
                      <span>{enq.projectLocation}</span>
                      <span>{enq.budget}</span>
                    </>
                  )}
                </div>

                {enq.message && <p className="font-body text-sm text-muted bg-slate rounded-xl px-4 py-3 mb-2">{enq.message}</p>}
                <p className="font-body text-xs text-muted">{new Date(enq.createdAt).toLocaleString('en-IN')}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <select value={enq.status} onChange={(e) => handleStatus(enq, e.target.value as EnquiryStatus)} className="input-field text-xs py-2 w-32">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
                <button onClick={() => handleDelete(enq)} className="p-2 text-red-400 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><FiTrash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 admin-card">
            <p className="font-body text-muted">No {filter === 'all' ? '' : filter} enquiries.</p>
          </div>
        )}
      </div>
    </div>
  )
}
