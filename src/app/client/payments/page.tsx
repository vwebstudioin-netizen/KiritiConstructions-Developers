'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getClientByUid, getPaymentsByClient, getPaymentsByProject, getProjectById } from '@/lib/firestore'
import type { Payment, Client, Project } from '@/types'
import { FiClock, FiPhone } from 'react-icons/fi'

export default function ClientPaymentsPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const c = await getClientByUid(user.uid)
      setClient(c)
      if (c && c.assignedProjects.length > 0) {
        // Query by projectId (reliable) + clientId (fallback), then deduplicate
        const [byProject, byClient] = await Promise.all([
          Promise.all(c.assignedProjects.map((pid) => getPaymentsByProject(pid))),
          getPaymentsByClient(user.uid),
        ])
        const allFromProjects = byProject.flat()
        const allFromClient = byClient
        // Merge and deduplicate by payment id
        const merged = [...allFromProjects]
        allFromClient.forEach((p) => { if (!merged.find((m) => m.id === p.id)) merged.push(p) })
        const allPays = merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPayments(allPays)
        const projs = await Promise.all([...new Set(allPays.map((p) => p.projectId))].map((id) => getProjectById(id)))
        const projMap: Record<string, Project> = {}
        projs.forEach((p) => { if (p) projMap[p.id] = p })
        setProjects(projMap)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  const pending = payments.filter((p) => p.status === 'pending')
  const paid = payments.filter((p) => p.status === 'paid')
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-2">Payments</h1>
      <p className="font-body text-muted text-sm mb-6">Your payment history and pending dues.</p>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="portal-card"><p className="font-display text-2xl text-dark font-bold">₹{totalPaid.toLocaleString('en-IN')}</p><p className="font-body text-xs text-muted mt-0.5">Total Paid</p></div>
        <div className="portal-card"><p className="font-display text-2xl text-red-500 font-bold">{pending.length}</p><p className="font-body text-xs text-muted mt-0.5">Pending</p></div>
        <div className="portal-card"><p className="font-display text-2xl text-dark font-bold">{paid.length}</p><p className="font-body text-xs text-muted mt-0.5">Completed</p></div>
      </div>

      {pending.length > 0 && (
        <div className="portal-card mb-6">
          <h2 className="font-display text-lg text-dark font-bold mb-3 flex items-center gap-2">
            <FiClock className="text-accent" size={18} /> Pending Payments
          </h2>
          <div className="space-y-3">
            {pending.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
                <div>
                  <p className="font-body text-sm font-semibold text-dark">{payment.description}</p>
                  <p className="font-body text-xs text-muted">{projects[payment.projectId]?.title ?? 'Project'} · {new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-lg font-bold text-dark mb-1">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                  <a href="tel:+919386655555" className="flex items-center gap-1.5 font-body text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity">
                    <FiPhone size={12} /> Contact to Pay
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-muted mt-3 p-3 bg-slate rounded-lg border border-gray-100">
            To clear your dues, please contact our office at <strong>+91 93866 55555</strong> or visit us in person.
          </p>
        </div>
      )}

      <div className="portal-card">
        <h2 className="font-display text-lg text-dark font-bold mb-4">Payment History</h2>
        {paid.length === 0 ? <p className="text-center font-body text-muted py-8 text-sm">No payments recorded yet.</p> : (
          <div className="space-y-3">
            {paid.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                <div>
                  <p className="font-body text-sm font-semibold text-dark">{payment.description}</p>
                  <p className="font-body text-xs text-muted">{projects[payment.projectId]?.title ?? ''} · {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-lg font-bold text-dark">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                  <span className="badge-green">Paid</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
