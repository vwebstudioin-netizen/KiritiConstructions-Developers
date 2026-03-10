'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getProjectById, getMilestones, getDocuments, getPaymentsByProject, getClientByUid } from '@/lib/firestore'
import type { Project, Milestone, ProjectDocument, Payment, Client } from '@/types'
import { FiArrowLeft, FiMapPin, FiCalendar, FiMaximize2, FiClock, FiDownload, FiPhone } from 'react-icons/fi'

const STATUS_COLORS = { planning: 'badge-blue', ongoing: 'badge-accent', completed: 'badge-green', 'on-hold': 'badge-gray' }
const MILESTONE_COLORS = { pending: 'border-gray-200 bg-gray-50 text-muted', 'in-progress': 'border-accent bg-accent/10 text-accent-dark', completed: 'border-green-300 bg-green-50 text-green-700' }
const DOC_ICONS: Record<string, string> = { blueprint: '📐', estimate: '📋', invoice: '🧾', completion: '✅', other: '📄' }

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'milestones' | 'documents' | 'payments'>('milestones')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !id) return
      const [p, m, d, pay, c] = await Promise.all([
        getProjectById(id),
        getMilestones(id),
        getDocuments(id, true),
        getPaymentsByProject(id),
        getClientByUid(user.uid),
      ])
      setProject(p); setMilestones(m); setDocuments(d); setPayments(pay); setClient(c)
      setLoading(false)
    })
    return () => unsub()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!project) return <div className="text-center py-16"><p className="font-body text-muted">Project not found.</p></div>

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length
  const overallProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      <Link href="/client/projects" className="inline-flex items-center gap-2 text-muted hover:text-primary font-body text-sm mb-6 transition-colors"><FiArrowLeft size={14} /> Back to Projects</Link>

      {/* Header */}
      <div className="portal-card mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="font-display text-2xl text-dark font-bold">{project.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 font-body text-sm text-muted">
              <span className="flex items-center gap-1"><FiMapPin size={13} />{project.location}</span>
              <span className="flex items-center gap-1"><FiCalendar size={13} />{project.year}</span>
              {project.area && <span className="flex items-center gap-1"><FiMaximize2 size={13} />{project.area}</span>}
              {project.duration && <span className="flex items-center gap-1"><FiClock size={13} />{project.duration}</span>}
            </div>
          </div>
          <span className={`badge capitalize ${STATUS_COLORS[project.status] ?? 'badge-gray'}`}>{project.status}</span>
        </div>

        {/* Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between mb-2 font-body text-sm">
              <span className="text-muted">Milestone Progress</span>
              <span className="font-semibold text-dark">{overallProgress}% ({completedMilestones}/{milestones.length})</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${overallProgress}%` }} /></div>
          </div>
          {project.totalValue && (
            <div>
              <div className="flex justify-between mb-2 font-body text-sm">
                <span className="text-muted">Payment Progress</span>
                <span className="font-semibold text-dark">{Math.round(totalPaid / project.totalValue * 100)}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill bg-green-500" style={{ width: `${Math.round(totalPaid / project.totalValue * 100)}%` }} /></div>
              <p className="font-body text-xs text-muted mt-1">₹{(totalPaid / 100000).toFixed(1)}L paid of ₹{(project.totalValue / 100000).toFixed(1)}L</p>
            </div>
          )}
        </div>

        {pendingPayments.length > 0 && (
          <div className="mt-4 p-4 bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-body text-sm font-semibold text-dark">{pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''}</p>
              <p className="font-body text-xs text-muted">Total due: ₹{(pendingPayments.reduce((s, p) => s + p.amount, 0) / 100000).toFixed(1)}L — Contact our office to pay</p>
            </div>
            <a href="tel:+919876543210" className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
              <FiPhone size={14} /> Call to Pay
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['milestones', 'documents', 'payments'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-body text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark hover:border-primary hover:text-primary'}`}>
            {tab} {tab === 'payments' && pendingPayments.length > 0 ? `(${pendingPayments.length})` : ''}
          </button>
        ))}
      </div>

      {/* Milestones */}
      {activeTab === 'milestones' && (
        <div className="portal-card">
          <h2 className="font-display text-lg text-dark font-bold mb-6">Project Timeline</h2>
          {milestones.length === 0 ? (
            <p className="text-center font-body text-muted py-8">Milestones will appear here once added by our team.</p>
          ) : (
            <div>
              {milestones.map((m, i) => (
                <div key={m.id} className="timeline-item">
                  <div className="timeline-line" />
                  <div className={`timeline-dot border-2 ${m.status === 'completed' ? 'border-green-400 bg-green-50 text-green-600' : m.status === 'in-progress' ? 'border-accent bg-accent/10 text-accent-dark' : 'border-gray-200 bg-gray-50 text-muted'}`}>
                    {m.status === 'completed' ? '✓' : i + 1}
                  </div>
                  <div className={`rounded-xl border p-4 ${MILESTONE_COLORS[m.status]}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-display text-dark font-bold text-sm">{m.title}</h3>
                        {m.description && <p className="font-body text-xs text-muted mt-0.5">{m.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs font-semibold">{m.percentage}%</span>
                        <span className={`badge capitalize ${m.status === 'completed' ? 'badge-green' : m.status === 'in-progress' ? 'badge-accent' : 'badge-gray'}`}>{m.status}</span>
                      </div>
                    </div>
                    {m.completedAt && <p className="font-body text-xs text-muted mt-2">Completed: {new Date(m.completedAt).toLocaleDateString('en-IN')}</p>}
                    {m.photos.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {m.photos.slice(0, 4).map((photo, pi) => (
                          <a key={pi} href={photo} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-xs text-muted hover:opacity-80 transition-opacity">📷</a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {activeTab === 'documents' && (
        <div className="portal-card">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Project Documents</h2>
          {documents.length === 0 ? (
            <p className="text-center font-body text-muted py-8">No documents available yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{DOC_ICONS[doc.type] ?? '📄'}</span>
                    <div>
                      <p className="font-body text-sm font-semibold text-dark">{doc.name}</p>
                      <p className="font-body text-xs text-muted capitalize">{doc.type} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-body text-sm text-primary hover:underline flex-shrink-0">
                    <FiDownload size={14} /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payments */}
      {activeTab === 'payments' && (
        <div className="portal-card">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Payments</h2>
          {payments.length === 0 ? (
            <p className="text-center font-body text-muted py-8">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                  <div>
                    <p className="font-body text-sm font-semibold text-dark">{payment.description}</p>
                    <p className="font-body text-xs text-muted">{new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg font-bold text-dark">₹{(payment.amount / 100000).toFixed(1)}L</p>
                    {payment.status === 'pending' ? (
                      <a href="tel:+919876543210" className="flex items-center gap-1 font-body text-xs text-primary hover:underline mt-1">
                        <FiPhone size={11} /> Contact to Pay
                      </a>
                    ) : (
                      <span className={`badge ${payment.status === 'paid' ? 'badge-green' : 'badge-gray'}`}>{payment.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
