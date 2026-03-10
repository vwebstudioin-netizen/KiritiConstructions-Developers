'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getAllProjects, getAllClients, getAllPayments, getAllEnquiries, getAllServices, getAllTeam, getAllSupervisors, getAllDailyReportsByDate, getProjectMaterials, getAllProjectsExpenses } from '@/lib/firestore'
import type { DailyReport, Project, ProjectMaterial, ProjectExpense } from '@/types'
import { FiFolder, FiUserCheck, FiCreditCard, FiMessageSquare, FiTool, FiUsers, FiArrowRight, FiAlertTriangle, FiHardDrive, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ projects: 0, clients: 0, payments: 0, enquiries: 0, services: 0, team: 0, supervisors: 0 })
  const [revenue, setRevenue] = useState<{ month: string; amount: number }[]>([])
  const [newEnquiries, setNewEnquiries] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [todayReports, setTodayReports] = useState<DailyReport[]>([])
  const [allLowStock, setAllLowStock] = useState<{ project: Project; material: ProjectMaterial }[]>([])
  const [profitData, setProfitData] = useState<{ title: string; id: string; contractValue: number; totalExpenses: number; margin: number; marginPct: number }[]>([])
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    // Load today's daily reports and low stock across all projects
    getAllDailyReportsByDate(today).then(setTodayReports)
    // Load profit data
    Promise.all([getAllProjects(), getAllProjectsExpenses()]).then(([projects, allExpenses]) => {
      const data = projects
        .filter((p) => (p.totalValue ?? 0) > 0)
        .map((p) => {
          const expenses = allExpenses.filter((e) => e.projectId === p.id)
          const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
          const contractValue = p.totalValue ?? 0
          const margin = contractValue - totalExpenses
          const marginPct = contractValue > 0 ? Math.round((margin / contractValue) * 100) : 0
          return { title: p.title, id: p.id, contractValue, totalExpenses, margin, marginPct }
        })
        .sort((a, b) => b.contractValue - a.contractValue)
        .slice(0, 8)
      setProfitData(data)
    })
    getAllProjects().then(async (projects) => {
      const lowStockData: { project: Project; material: ProjectMaterial }[] = []
      for (const proj of projects.filter((p) => p.status === 'ongoing')) {
        const mats = await getProjectMaterials(proj.id)
        mats.forEach((m) => { if ((m.totalInward - m.totalConsumed) < m.lowStockThreshold) lowStockData.push({ project: proj, material: m }) })
      }
      setAllLowStock(lowStockData)
    })

    Promise.all([getAllProjects(), getAllClients(), getAllPayments(), getAllEnquiries(), getAllServices(), getAllTeam(), getAllSupervisors()])
      .then(([projects, clients, payments, enquiries, services, team, supervisors]) => {
        setCounts({ projects: projects.length, clients: clients.length, payments: payments.length, enquiries: enquiries.length, services: services.length, team: team.length, supervisors: supervisors.length })
        setNewEnquiries(enquiries.filter((e) => e.status === 'new').length)
        const paidPayments = payments.filter((p) => p.status === 'paid')
        setPendingPayments(payments.filter((p) => p.status === 'pending').length)
        setTotalRevenue(paidPayments.reduce((s, p) => s + p.amount, 0))

        // Build monthly revenue chart (last 6 months)
        const monthlyMap: Record<string, number> = {}
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
          monthlyMap[key] = 0
        }
        paidPayments.forEach((p) => {
          if (p.paidAt) {
            const key = new Date(p.paidAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
            if (key in monthlyMap) monthlyMap[key] += p.amount / 100000
          }
        })
        setRevenue(Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount: Math.round(amount * 10) / 10 })))
      })
  }, [])

  const STATS = [
    { label: 'Projects', value: counts.projects, icon: FiFolder, href: '/admin/projects', color: 'bg-blue-50 text-blue-600' },
    { label: 'Clients', value: counts.clients, icon: FiUserCheck, href: '/admin/clients', color: 'bg-purple-50 text-purple-600' },
    { label: 'Supervisors', value: counts.supervisors, icon: FiHardDrive, href: '/admin/supervisors', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Payments', value: counts.payments, icon: FiCreditCard, href: '/admin/payments', color: 'bg-green-50 text-green-600', badge: pendingPayments },
    { label: 'Enquiries', value: counts.enquiries, icon: FiMessageSquare, href: '/admin/enquiries', color: 'bg-amber-50 text-amber-600', badge: newEnquiries },
    { label: 'Services', value: counts.services, icon: FiTool, href: '/admin/services', color: 'bg-primary/10 text-primary' },
    { label: 'Team', value: counts.team, icon: FiUsers, href: '/admin/team', color: 'bg-rose-50 text-rose-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-dark font-bold">Dashboard</h1>
        <p className="font-body text-muted text-sm mt-1">Business overview and quick stats.</p>
      </div>

      {/* Revenue highlight */}
      <div className="admin-card bg-primary text-white mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-body text-white/60 text-sm">Total Revenue Collected</p>
          <p className="font-display text-4xl text-accent font-bold mt-1">₹{(totalRevenue / 100000).toFixed(1)}L</p>
        </div>
        <div className="flex gap-6">
          {pendingPayments > 0 && <div className="text-center"><p className="font-display text-2xl text-white font-bold">{pendingPayments}</p><p className="font-body text-white/60 text-xs">Pending Dues</p></div>}
          <div className="text-center"><p className="font-display text-2xl text-white font-bold">{counts.clients}</p><p className="font-body text-white/60 text-xs">Active Clients</p></div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-6">
        {newEnquiries > 0 && <Link href="/admin/enquiries" className="flex items-center justify-between gap-4 bg-accent/20 border border-accent rounded-2xl px-5 py-3 hover:bg-accent/30 transition-colors"><p className="font-body text-dark font-semibold text-sm">🔔 {newEnquiries} new enquir{newEnquiries === 1 ? 'y' : 'ies'}</p><FiArrowRight /></Link>}
        {pendingPayments > 0 && <Link href="/admin/payments" className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 hover:bg-blue-100 transition-colors"><p className="font-body text-blue-700 font-semibold text-sm">💳 {pendingPayments} payment{pendingPayments > 1 ? 's' : ''} pending from clients</p><FiArrowRight className="text-blue-700" /></Link>}
        {allLowStock.length > 0 && (
          <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
            <p className="font-body text-red-700 font-semibold text-sm flex items-center gap-2"><FiAlertTriangle size={15} /> {allLowStock.length} low stock alert{allLowStock.length > 1 ? 's' : ''} across active sites</p>
            <Link href="/admin/projects" className="font-body text-xs text-red-600 hover:underline">View Projects</Link>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STATS.map(({ label, value, icon: Icon, href, color, badge }) => (
          <Link key={label} href={href} className="admin-card hover:shadow-md transition-shadow flex items-center gap-4 relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={20} /></div>
            <div><p className="font-display text-2xl text-dark font-bold">{value}</p><p className="font-body text-xs text-muted">{label}</p></div>
            {badge && badge > 0 ? <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{badge}</span> : null}
          </Link>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="admin-card">
        <h2 className="font-display text-lg text-dark font-bold mb-6">Revenue (Last 6 Months) — ₹ Lakhs</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} />
            <Tooltip formatter={(v) => [`₹${v}L`, 'Revenue']} contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="amount" fill="#1A3C5E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Today's Site Reports */}
      <div className="admin-card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-dark font-bold flex items-center gap-2"><FiCalendar className="text-accent" size={18} /> Today&apos;s Site Reports</h2>
          <span className="font-body text-xs text-muted">{today}</span>
        </div>
        {todayReports.length === 0 ? (
          <p className="text-center font-body text-muted text-sm py-6">No daily reports filed today yet.</p>
        ) : (
          <div className="space-y-3">
            {todayReports.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-body font-semibold text-dark text-sm">{r.projectId}</span>
                    <span className="font-body text-xs text-muted">{r.weatherCondition} · {r.laborCount} workers · by {r.supervisorName}</span>
                  </div>
                  <p className="font-body text-sm text-muted">{r.workDone}</p>
                  {r.issuesReported && <p className="font-body text-xs text-red-500 mt-0.5">Issue: {r.issuesReported}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock Summary */}
      {allLowStock.length > 0 && (
        <div className="admin-card mt-6">
          <h2 className="font-display text-lg text-dark font-bold flex items-center gap-2 mb-4"><FiAlertTriangle className="text-red-500" size={18} /> Low Stock Alerts</h2>
          <div className="space-y-2">
            {allLowStock.map(({ project, material }) => {
              const balance = material.totalInward - material.totalConsumed
              return (
                <div key={`${project.id}_${material.id}`} className="flex items-center justify-between gap-4 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="font-body text-sm font-semibold text-dark">{material.name}</p>
                    <p className="font-body text-xs text-muted">{project.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-base font-bold text-red-600">{balance} {material.unit}</p>
                    <p className="font-body text-xs text-muted">min: {material.lowStockThreshold}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Profit Dashboard */}
      {profitData.length > 0 && (
        <div className="admin-card mt-6">
          <h2 className="font-display text-lg text-dark font-bold flex items-center gap-2 mb-5">
            <FiTrendingUp className="text-accent" size={18} /> Project Profit / Loss
          </h2>
          <div className="space-y-3">
            {profitData.map((p) => {
              const isLoss = p.margin < 0
              const expPct = p.contractValue > 0 ? Math.min((p.totalExpenses / p.contractValue) * 100, 100) : 0
              return (
                <div key={p.id} className={`p-4 rounded-xl border ${isLoss ? 'bg-red-50 border-red-100' : 'bg-slate border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/projects/${p.id}`} className="font-body font-semibold text-dark text-sm hover:text-primary transition-colors truncate block">{p.title}</Link>
                      <div className="flex gap-4 mt-1 font-body text-xs text-muted flex-wrap">
                        <span>Contract: ₹{p.contractValue.toLocaleString('en-IN')}</span>
                        <span>Expenses: ₹{p.totalExpenses.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-display text-lg font-bold ${isLoss ? 'text-red-600' : 'text-green-600'}`}>
                        {isLoss ? '-' : '+'}₹{Math.abs(p.margin).toLocaleString('en-IN')}
                      </p>
                      <p className={`font-body text-xs font-semibold ${isLoss ? 'text-red-500' : p.marginPct < 15 ? 'text-amber-600' : 'text-green-600'}`}>
                        {p.marginPct}% margin
                      </p>
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isLoss ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${expPct}%` }} />
                  </div>
                  <div className="flex justify-between font-body text-xs text-muted mt-1">
                    <span>{Math.round(expPct)}% spent</span>
                    <span>{100 - Math.round(expPct)}% remaining</span>
                  </div>
                </div>
              )
            })}
          </div>
          {profitData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 font-body text-sm">
              <div>
                <span className="text-muted">Total Contract</span>
                <p className="font-display font-bold text-dark">₹{profitData.reduce((s, p) => s + p.contractValue, 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-muted">Total Expenses</span>
                <p className="font-display font-bold text-red-500">₹{profitData.reduce((s, p) => s + p.totalExpenses, 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-muted">Gross Margin</span>
                <p className="font-display font-bold text-green-600">₹{profitData.reduce((s, p) => s + p.margin, 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {profitData.length === 0 && (
        <div className="admin-card mt-6 text-center py-8">
          <FiTrendingUp className="text-muted mx-auto mb-2" size={24} />
          <p className="font-body text-muted text-sm">No expense data yet. Go to <Link href="/admin/projects" className="text-primary underline">Admin → Projects → Expenses tab</Link> to start logging expenses for profit tracking.</p>
        </div>
      )}
    </div>
  )
}
