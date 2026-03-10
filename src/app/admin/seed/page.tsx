'use client'
import { useState } from 'react'
import { FiDatabase, FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi'

type Section = 'company' | 'services' | 'projects' | 'payments' | 'siteTeams' | 'materials' | 'dailyReports' | 'testimonials' | 'team' | 'blog'
type Status = 'idle' | 'loading' | 'success' | 'error'

const SECTIONS: { key: Section; label: string; description: string; count: string; tag?: string }[] = [
  { key: 'company', label: 'Company Info', description: 'Name, tagline, address, phone, hours, social links', count: '1 document' },
  { key: 'services', label: 'Services', description: 'Residential, Commercial, Renovation, Interior, Civil, Painting', count: '6 services' },
  { key: 'projects', label: 'Projects', description: 'Villa, Office Complex, Apartments, Showroom, Renovation, Civil work', count: '6 projects' },
  { key: 'payments', label: 'Payments', description: 'Demo payment requests with paid + pending status across 3 projects', count: '12 payments', tag: 'Admin demo' },
  { key: 'siteTeams', label: 'Site Teams', description: 'Site engineers, masons, and foremen for Villa and Apartment projects', count: '7 members', tag: 'Admin demo' },
  { key: 'materials', label: 'Materials & Inventory', description: 'Sand, Cement, Steel, Bricks with realistic inward/consumed quantities for G+3 Apartments', count: '8 materials', tag: 'Admin demo' },
  { key: 'dailyReports', label: 'Daily Reports', description: '3 recent supervisor daily reports for G+3 Apartment project', count: '3 reports', tag: 'Admin demo' },
  { key: 'testimonials', label: 'Testimonials', description: 'Client reviews with ratings and project types', count: '4 reviews' },
  { key: 'team', label: 'Company Team', description: 'MD, Civil Engineer, Supervisor, Interior Lead', count: '4 members' },
  { key: 'blog', label: 'Blog Posts', description: 'Construction tips, material tracking, steel vs concrete guides', count: '3 articles' },
]

export default function SeedPage() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [seedingAll, setSeedingAll] = useState(false)

  const seed = async (section: Section | 'all') => {
    if (section === 'all') {
      setSeedingAll(true)
      const newStatuses: Record<string, Status> = {}
      SECTIONS.forEach((s) => { newStatuses[s.key] = 'loading' })
      setStatuses(newStatuses)
    } else {
      setStatuses((prev) => ({ ...prev, [section]: 'loading' }))
    }

    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      })
      const data = await res.json()

      if (data.success) {
        const newStatuses: Record<string, Status> = {}
        const newMessages: Record<string, string> = {}
        if (section === 'all') {
          SECTIONS.forEach((s) => {
            newStatuses[s.key] = 'success'
            newMessages[s.key] = data.results[s.key] ?? 'Done'
          })
        } else {
          newStatuses[section] = 'success'
          newMessages[section] = data.results[section] ?? 'Done'
        }
        setStatuses((prev) => ({ ...prev, ...newStatuses }))
        setMessages((prev) => ({ ...prev, ...newMessages }))
      } else {
        const newStatuses: Record<string, Status> = {}
        if (section === 'all') {
          SECTIONS.forEach((s) => { newStatuses[s.key] = 'error' })
        } else {
          newStatuses[section] = 'error'
        }
        setStatuses((prev) => ({ ...prev, ...newStatuses }))
        setMessages((prev) => ({ ...prev, [section === 'all' ? 'all' : section]: data.error ?? 'Failed' }))
      }
    } catch (err) {
      const newStatuses: Record<string, Status> = {}
      if (section === 'all') {
        SECTIONS.forEach((s) => { newStatuses[s.key] = 'error' })
      } else {
        newStatuses[section] = 'error'
      }
      setStatuses((prev) => ({ ...prev, ...newStatuses }))
    } finally {
      setSeedingAll(false)
    }
  }

  const allDone = SECTIONS.every((s) => statuses[s.key] === 'success')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <FiDatabase className="text-primary" size={24} />
        <h1 className="font-display text-3xl text-dark font-bold">Seed Database</h1>
      </div>
      <p className="font-body text-muted text-sm mb-6">
        Populate your Firebase database with default data. Run this once after setting up Firebase.
        Each section will <strong>overwrite</strong> existing data of that type.
      </p>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-body text-sm text-amber-700 flex items-start gap-2 mb-6">
        <FiAlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <span>This will replace any existing data in each section with the demo data. Only use this on a fresh database or when you want to reset demo content.</span>
      </div>

      {/* Seed All button */}
      {!allDone && (
        <button
          onClick={() => seed('all')}
          disabled={seedingAll}
          className="w-full btn-primary justify-center gap-2 py-4 text-base mb-6 disabled:opacity-60"
        >
          {seedingAll ? (
            <><FiLoader className="animate-spin" size={18} /> Seeding all sections...</>
          ) : (
            <><FiDatabase size={18} /> Seed All Sections at Once</>
          )}
        </button>
      )}

      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 font-body text-green-700 flex items-center gap-3 mb-6">
          <FiCheckCircle size={20} />
          <div>
            <p className="font-semibold">All sections seeded successfully!</p>
            <p className="text-sm mt-0.5">Your database is ready. Go to <a href="/admin" className="underline font-medium">Admin Dashboard</a> to start managing your content.</p>
          </div>
        </div>
      )}

      {/* Individual sections */}
      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const status = statuses[s.key] ?? 'idle'
          return (
            <div key={s.key} className={`admin-card flex items-center justify-between gap-4 ${status === 'success' ? 'border-green-200 bg-green-50/40' : status === 'error' ? 'border-red-200 bg-red-50/40' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${status === 'success' ? 'bg-green-100' : status === 'error' ? 'bg-red-100' : 'bg-primary-50'}`}>
                  {status === 'success' ? <FiCheckCircle className="text-green-600" size={16} /> :
                   status === 'error' ? <FiAlertTriangle className="text-red-500" size={16} /> :
                   status === 'loading' ? <FiLoader className="text-primary animate-spin" size={16} /> :
                   <FiDatabase className="text-primary" size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body font-semibold text-dark text-sm">{s.label}</p>
                    {s.tag && <span className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.tag}</span>}
                  </div>
                  <p className="font-body text-xs text-muted">{status === 'success' ? (messages[s.key] ?? 'Done') : status === 'error' ? (messages[s.key] ?? 'Failed — check Firebase config') : s.description}</p>
                  <p className="font-body text-xs text-muted/60 mt-0.5">{s.count}</p>
                </div>
              </div>
              <button
                onClick={() => seed(s.key)}
                disabled={status === 'loading' || seedingAll}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-body text-xs font-semibold transition-colors disabled:opacity-50 ${
                  status === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                  status === 'error' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                  'bg-primary text-white hover:bg-primary-600'
                }`}
              >
                {status === 'loading' ? 'Seeding...' : status === 'success' ? 'Re-seed' : status === 'error' ? 'Retry' : 'Seed'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="font-body text-xs text-muted mt-6 p-4 bg-slate rounded-xl border border-gray-100">
        After seeding, update the real company details in <a href="/admin/settings" className="text-primary underline">Admin → Settings</a>, add real projects in <a href="/admin/projects" className="text-primary underline">Admin → Projects</a>, and remove or update the demo blog posts in <a href="/admin/blog" className="text-primary underline">Admin → Blog</a>.
      </p>
    </div>
  )
}
