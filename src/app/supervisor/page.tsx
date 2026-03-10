'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getSupervisorByUid, getProjectById, getProjectMaterials, getDailyReports } from '@/lib/firestore'
import type { Project, ProjectMaterial, DailyReport, Supervisor } from '@/types'
import { FiMapPin, FiAlertTriangle, FiArrowRight, FiFileText } from 'react-icons/fi'
import { format } from 'date-fns'

interface ProjectSummary {
  project: Project
  materials: ProjectMaterial[]
  todayReport: DailyReport | null
}

export default function SupervisorDashboard() {
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [sites, setSites] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const sup = await getSupervisorByUid(user.uid)
      if (!sup) return
      setSupervisor(sup)

      // Load all assigned projects with material summaries
      const summaries = await Promise.all(
        sup.assignedProjects.map(async (projectId) => {
          const [project, materials, reports] = await Promise.all([
            getProjectById(projectId),
            getProjectMaterials(projectId),
            getDailyReports(projectId),
          ])
          const todayReport = reports.find((r) => r.date === today) ?? null
          return project ? { project, materials, todayReport } : null
        })
      )
      setSites(summaries.filter(Boolean) as ProjectSummary[])
      setLoading(false)
    })
    return () => unsub()
  }, [today])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-dark font-bold">My Sites</h1>
        <p className="font-body text-muted text-sm mt-1">Hello {supervisor?.name} — {sites.length} site{sites.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {/* Today's status bar */}
      <div className="admin-card bg-primary text-white mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="font-body text-white/50 text-xs uppercase tracking-wider mb-1">Today</p>
          <p className="font-display text-xl text-white">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-6">
          <div><p className="font-display text-2xl text-accent font-bold">{sites.filter((s) => s.todayReport).length}</p><p className="font-body text-white/50 text-xs">Reports Filed</p></div>
          <div><p className="font-display text-2xl text-white font-bold">{sites.filter((s) => !s.todayReport).length}</p><p className="font-body text-white/50 text-xs">Pending Report</p></div>
          <div><p className="font-display text-2xl text-red-400 font-bold">{sites.reduce((sum, s) => sum + s.materials.filter((m) => (m.totalInward - m.totalConsumed) < m.lowStockThreshold).length, 0)}</p><p className="font-body text-white/50 text-xs">Low Stock Alerts</p></div>
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-16 admin-card">
          <p className="font-display text-dark font-bold text-lg mb-2">No sites assigned yet</p>
          <p className="font-body text-muted text-sm">Contact your admin to get assigned to a project.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {sites.map(({ project, materials, todayReport }) => {
            const lowStockItems = materials.filter((m) => (m.totalInward - m.totalConsumed) < m.lowStockThreshold)
            return (
              <div key={project.id} className="admin-card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display text-lg text-dark font-bold">{project.title}</h2>
                    <p className="font-body text-xs text-muted flex items-center gap-1 mt-1"><FiMapPin size={11} />{project.location}</p>
                  </div>
                  <span className={`badge capitalize ${project.status === 'ongoing' ? 'badge-accent' : project.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>{project.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate rounded-xl border border-gray-100 text-center">
                    <p className="font-display text-xl text-dark font-bold">{materials.length}</p>
                    <p className="font-body text-xs text-muted">Materials</p>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${lowStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate border-gray-100'}`}>
                    <p className={`font-display text-xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-dark'}`}>{lowStockItems.length}</p>
                    <p className="font-body text-xs text-muted flex items-center gap-1 justify-center">{lowStockItems.length > 0 && <FiAlertTriangle size={10} />}Low Stock</p>
                  </div>
                </div>

                {/* Today's report status */}
                <div className={`flex items-center justify-between p-3 rounded-xl border mb-4 ${todayReport ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2">
                    <FiFileText className={todayReport ? 'text-green-600' : 'text-amber-600'} size={14} />
                    <p className={`font-body text-sm font-medium ${todayReport ? 'text-green-700' : 'text-amber-700'}`}>
                      {todayReport ? "Today's report filed" : "Today's report pending"}
                    </p>
                  </div>
                  {todayReport && <span className="font-body text-xs text-green-600">{todayReport.laborCount} workers</span>}
                </div>

                <Link href={`/supervisor/${project.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-body font-medium text-sm hover:bg-primary-light transition-colors rounded-xl">
                  Open Site <FiArrowRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
