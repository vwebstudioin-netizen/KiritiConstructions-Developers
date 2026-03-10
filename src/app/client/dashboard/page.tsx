'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getClientByUid, getProjectsByClient, getPaymentsByClient } from '@/lib/firestore'
import type { Client, Project, Payment } from '@/types'
import { FiFolder, FiCreditCard, FiFileText, FiArrowRight, FiClock } from 'react-icons/fi'

export default function ClientDashboard() {
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const [c, p] = await Promise.all([getClientByUid(user.uid), getProjectsByClient(user.uid)])
      setClient(c)
      setProjects(p)
      if (p.length > 0) {
        const pays = await Promise.all(p.map((pr) => getPaymentsByClient(user.uid)))
        setPayments(pays.flat())
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const ongoingProjects = projects.filter((p) => p.status === 'ongoing')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-dark font-bold">Welcome back{client ? `, ${client.name.split(' ')[0]}` : ''}!</h1>
        <p className="font-body text-muted text-sm mt-1">Here&apos;s your project overview.</p>
      </div>

      {/* Alert for pending payments */}
      {pendingPayments.length > 0 && (
        <Link href="/client/payments" className="flex items-center justify-between gap-4 bg-accent/20 border border-accent rounded-2xl px-5 py-4 mb-6 hover:bg-accent/30 transition-colors">
          <p className="font-body text-dark font-semibold text-sm">💳 You have <strong>{pendingPayments.length}</strong> pending payment{pendingPayments.length > 1 ? 's' : ''}</p>
          <FiArrowRight className="text-dark flex-shrink-0" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'My Projects', value: projects.length, icon: FiFolder, href: '/client/projects', color: 'bg-blue-50 text-blue-600' },
          { label: 'Ongoing', value: ongoingProjects.length, icon: FiClock, href: '/client/projects', color: 'bg-amber-50 text-amber-600' },
          { label: 'Total Paid', value: `₹${(totalPaid / 100000).toFixed(1)}L`, icon: FiCreditCard, href: '/client/payments', color: 'bg-green-50 text-green-600' },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="portal-card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={20} /></div>
            <div><p className="font-display text-2xl text-dark font-bold">{value}</p><p className="font-body text-xs text-muted">{label}</p></div>
          </Link>
        ))}
      </div>

      {/* Active projects */}
      {ongoingProjects.length > 0 && (
        <div className="portal-card mb-6">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Active Projects</h2>
          <div className="space-y-4">
            {ongoingProjects.map((project) => {
              const progress = project.totalValue ? Math.round((project.paidAmount ?? 0) / project.totalValue * 100) : 0
              return (
                <Link key={project.id} href={`/client/projects/${project.id}`} className="block p-4 bg-slate rounded-xl hover:bg-primary-50 transition-colors group">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-display text-dark font-bold text-sm group-hover:text-primary transition-colors">{project.title}</h3>
                      <p className="font-body text-xs text-muted">{project.location}</p>
                    </div>
                    <span className="badge-accent capitalize">{project.status}</span>
                  </div>
                  {project.totalValue && (
                    <>
                      <div className="flex justify-between mb-1.5">
                        <span className="font-body text-xs text-muted">Financial Progress</span>
                        <span className="font-body text-xs font-semibold text-dark">{progress}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                      <div className="flex justify-between mt-1.5 font-body text-xs text-muted">
                        <span>Paid: ₹{((project.paidAmount ?? 0) / 100000).toFixed(1)}L</span>
                        <span>Total: ₹{(project.totalValue / 100000).toFixed(1)}L</span>
                      </div>
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="portal-card">
        <h2 className="font-display text-lg text-dark font-bold mb-4">Quick Access</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'View All Projects', href: '/client/projects', icon: FiFolder },
            { label: 'Payment History', href: '/client/payments', icon: FiCreditCard },
            { label: 'My Documents', href: '/client/documents', icon: FiFileText },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="flex items-center gap-3 p-4 bg-slate rounded-xl hover:bg-primary-50 hover:text-primary transition-colors group">
              <Icon size={18} className="text-muted group-hover:text-primary" />
              <span className="font-body text-sm font-medium text-dark group-hover:text-primary">{label}</span>
              <FiArrowRight size={14} className="ml-auto text-muted group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
