'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllProjects, addProject, updateProject, deleteProject, getAllClients } from '@/lib/firestore'
import type { Project, ProjectCategory, ProjectStatus, Client } from '@/types'
import { DEFAULT_PROJECTS } from '@/types'
import { FiPlus, FiTrash2, FiEye, FiEyeOff, FiStar, FiSettings, FiInfo } from 'react-icons/fi'
import ImageUpload from '@/components/ui/ImageUpload'

const CATEGORIES: ProjectCategory[] = ['Residential', 'Commercial', 'Renovation', 'Interior']
const STATUSES: ProjectStatus[] = ['planning', 'ongoing', 'completed', 'on-hold']
const STATUS_COLORS = { planning: 'badge-blue', ongoing: 'badge-accent', completed: 'badge-green', 'on-hold': 'badge-gray' }

const EMPTY: Omit<Project, 'id'> = { title: '', slug: '', description: '', category: 'Residential', location: '', area: '', year: new Date().getFullYear(), duration: '', images: [], coverImage: '', clientId: '', status: 'planning', totalValue: 0, paidAmount: 0, isVisible: true, isFeatured: false, sortOrder: 0 }

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    Promise.all([getAllProjects(), getAllClients()]).then(([p, c]) => {
      if (p.length === 0) { setProjects(DEFAULT_PROJECTS); setIsDemo(true) } else { setProjects(p) }
      setClients(c)
    })
  }, [])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async () => {
    if (!form.title) return
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const id = await addProject({ ...form, slug })
    setProjects((p) => [...p, { ...form, slug, id }])
    setForm(EMPTY); setShowForm(false); showMsg('Project added!')
  }

  const toggle = async (id: string, field: 'isVisible' | 'isFeatured', val: boolean) => {
    await updateProject(id, { [field]: !val })
    setProjects((p) => p.map((pr) => pr.id === id ? { ...pr, [field]: !val } : pr))
  }

  const updateStatus = async (id: string, status: ProjectStatus) => {
    await updateProject(id, { status })
    setProjects((p) => p.map((pr) => pr.id === id ? { ...pr, status } : pr))
  }

  const remove = async (id: string) => {
    if (!confirm('Delete?')) return
    await deleteProject(id)
    setProjects((p) => p.filter((pr) => pr.id !== id))
    showMsg('Deleted.')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-dark font-bold">Projects</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2"><FiPlus /> Add Project</button>
      </div>
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}
      {isDemo && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 font-body text-sm flex items-start gap-2">
          <FiInfo size={16} className="mt-0.5 flex-shrink-0" />
          <span>Showing <strong>demo projects</strong> — Firebase is not configured. Add your <code>.env.local</code> keys to connect to your database. Projects you add here will be saved once Firebase is configured.</span>
        </div>
      )}

      {showForm && (
        <div className="admin-card mb-6">
          <h2 className="font-display text-lg text-dark font-bold mb-4">New Project</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" /></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProjectCategory })} className="input-field">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })} className="input-field">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Assign to Client</label><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field"><option value="">No client</option>{clients.map((c) => <option key={c.id} value={c.uid}>{c.name}</option>)}</select></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" /></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Year</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="input-field" /></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Total Value (₹)</label><input type="number" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: Number(e.target.value) })} className="input-field" /></div>
            <div className="md:col-span-2">
              <ImageUpload
                folder="projects"
                value={form.images}
                onChange={(urls) => setForm({ ...form, images: urls, coverImage: urls[0] ?? '' })}
                maxImages={8}
                label="Project Images (first image = cover photo)"
              />
            </div>
            <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} className="btn-primary gap-2"><FiPlus /> Add</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-body font-semibold text-dark text-sm truncate">{p.title}</span>
                  <span className="badge-accent">{p.category}</span>
                  <span className={`badge capitalize ${STATUS_COLORS[p.status] ?? 'badge-gray'}`}>{p.status}</span>
                  {p.isFeatured && <span className="badge-primary">Featured</span>}
                  {p.clientId && <span className="badge bg-purple-100 text-purple-700">Has Client</span>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="font-body text-xs text-muted">{p.location} · {p.year}</p>
                  {p.totalValue ? <p className="font-body text-xs text-muted">₹{(p.totalValue / 100000).toFixed(1)}L</p> : null}
                </div>
                <div className="flex gap-2 mt-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => updateStatus(p.id, s)}
                      className={`px-2.5 py-1 rounded-lg font-body text-xs font-medium transition-colors capitalize ${p.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/admin/projects/${p.id}`} className="p-2 rounded-xl text-primary bg-primary-50 hover:bg-primary-100 transition-colors"><FiSettings size={15} /></Link>
                <button onClick={() => toggle(p.id, 'isFeatured', p.isFeatured)} className={`p-2 rounded-xl transition-colors ${p.isFeatured ? 'text-accent bg-amber-50' : 'text-muted bg-gray-100'}`}><FiStar size={15} /></button>
                <button onClick={() => toggle(p.id, 'isVisible', p.isVisible)} className={`p-2 rounded-xl transition-colors ${p.isVisible ? 'text-green-500 bg-green-50' : 'text-muted bg-gray-100'}`}>{p.isVisible ? <FiEye size={15} /> : <FiEyeOff size={15} />}</button>
                <button onClick={() => remove(p.id)} className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors"><FiTrash2 size={15} /></button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-center font-body text-muted py-8 text-sm">No projects yet.</p>}
        </div>
      </div>
    </div>
  )
}
