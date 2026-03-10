'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getProjectsByClient } from '@/lib/firestore'
import type { Project } from '@/types'
import { FiMapPin, FiCalendar, FiArrowRight } from 'react-icons/fi'

const STATUS_COLORS = { planning: 'badge-blue', ongoing: 'badge-accent', completed: 'badge-green', 'on-hold': 'badge-gray' }

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const p = await getProjectsByClient(user.uid)
      setProjects(p)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-2">My Projects</h1>
      <p className="font-body text-muted text-sm mb-6">All projects assigned to your account.</p>

      {projects.length === 0 ? (
        <div className="portal-card text-center py-16">
          <p className="font-display text-dark font-bold text-lg mb-2">No projects yet</p>
          <p className="font-body text-muted text-sm">Your projects will appear here once assigned by our team.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {projects.map((project) => {
            const progress = project.totalValue ? Math.round((project.paidAmount ?? 0) / project.totalValue * 100) : 0
            return (
              <Link key={project.id} href={`/client/projects/${project.id}`} className="portal-card group hover:shadow-md transition-all hover:-translate-y-0.5 block">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display text-dark font-bold group-hover:text-primary transition-colors">{project.title}</h2>
                    <div className="flex flex-wrap gap-3 mt-1 font-body text-xs text-muted">
                      <span className="flex items-center gap-1"><FiMapPin size={11} />{project.location.split(',')[0]}</span>
                      <span className="flex items-center gap-1"><FiCalendar size={11} />{project.year}</span>
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 ${STATUS_COLORS[project.status] ?? 'badge-gray'} capitalize`}>{project.status}</span>
                </div>

                {project.totalValue && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5 font-body text-xs">
                      <span className="text-muted">Payment Progress</span>
                      <span className="font-semibold text-dark">{progress}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                    <div className="flex justify-between mt-1 font-body text-xs text-muted">
                      <span>₹{((project.paidAmount ?? 0) / 100000).toFixed(1)}L paid</span>
                      <span>₹{(project.totalValue / 100000).toFixed(1)}L total</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-body">
                  <span className="text-muted">{project.area && `${project.area}`}{project.duration && ` · ${project.duration}`}</span>
                  <span className="flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">View Details <FiArrowRight size={12} /></span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
