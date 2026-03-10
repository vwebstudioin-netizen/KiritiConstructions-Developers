'use client'
import { useEffect, useState } from 'react'
import { getAllSupervisors, addSupervisor, updateSupervisor, deleteSupervisor, getAllProjects } from '@/lib/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { Supervisor, Project } from '@/types'
import { DEFAULT_PROJECTS } from '@/types'
import { FiPlus, FiTrash2, FiUserCheck, FiFolder, FiMapPin, FiCheck } from 'react-icons/fi'

const EMPTY = { name: '', phone: '', email: '', password: '', assignedProjects: [] as string[] }

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAllSupervisors(), getAllProjects()]).then(([s, p]) => {
      setSupervisors(s)
      setProjects(p.length > 0 ? p : DEFAULT_PROJECTS)
    })
  }, [])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return
    setAdding(true)
    try {
      if (!auth) { showMsg('Firebase not configured'); return }
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const id = await addSupervisor({
        uid: cred.user.uid, name: form.name, phone: form.phone, email: form.email,
        assignedProjects: form.assignedProjects, isActive: true, createdAt: new Date().toISOString(),
      })
      setSupervisors((s) => [...s, { id, uid: cred.user.uid, name: form.name, phone: form.phone, email: form.email, assignedProjects: form.assignedProjects, isActive: true, createdAt: new Date().toISOString() }])
      setForm(EMPTY); showMsg('Supervisor account created!')
    } catch (err: unknown) {
      showMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setAdding(false)
  }

  const toggleProject = async (sup: Supervisor, projectId: string) => {
    const updated = sup.assignedProjects.includes(projectId)
      ? sup.assignedProjects.filter((p) => p !== projectId)
      : [...sup.assignedProjects, projectId]
    await updateSupervisor(sup.id, { assignedProjects: updated })
    setSupervisors((s) => s.map((sv) => sv.id === sup.id ? { ...sv, assignedProjects: updated } : sv))
  }

  const toggleActive = async (sup: Supervisor) => {
    await updateSupervisor(sup.id, { isActive: !sup.isActive })
    setSupervisors((s) => s.map((sv) => sv.id === sup.id ? { ...sv, isActive: !sv.isActive } : sv))
  }

  const remove = async (id: string) => {
    if (!confirm('Delete supervisor account record? (Firebase Auth user must be deleted separately from Firebase Console)')) return
    await deleteSupervisor(id)
    setSupervisors((s) => s.filter((sv) => sv.id !== id))
    showMsg('Supervisor removed.')
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-2">Supervisors</h1>
      <p className="font-body text-muted text-sm mb-6">Manage supervisor accounts and their site assignments.</p>

      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}

      {/* Add supervisor */}
      <div className="admin-card mb-6">
        <h2 className="font-display text-lg text-dark font-bold mb-4">Add New Supervisor</h2>
        <p className="font-body text-xs text-muted mb-4">Creates a Firebase login account for the supervisor so they can access their assigned sites.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 93866 55555" className="input-field" /></div>
          <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Email (Login) *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Temp Password * (min 6 chars)</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" /></div>
          <div className="md:col-span-2">
            <label className="block font-body text-xs text-muted uppercase tracking-wider mb-2">
              Assign Projects <span className="ml-1 text-primary font-semibold">{form.assignedProjects.length > 0 ? `(${form.assignedProjects.length} selected)` : ''}</span>
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {projects.map((p) => {
                const selected = form.assignedProjects.includes(p.id)
                return (
                  <button key={p.id} type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      assignedProjects: f.assignedProjects.includes(p.id)
                        ? f.assignedProjects.filter((x) => x !== p.id)
                        : [...f.assignedProjects, p.id]
                    }))}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'bg-primary border-primary' : 'border-gray-200 hover:border-primary bg-white'}`}>
                    <div className="min-w-0">
                      <p className={`font-body text-sm font-semibold truncate ${selected ? 'text-white' : 'text-dark'}`}>{p.title}</p>
                      <p className={`font-body text-xs flex items-center gap-1 mt-0.5 ${selected ? 'text-white/70' : 'text-muted'}`}>
                        <FiMapPin size={10} />{p.location}
                      </p>
                      <span className={`inline-block mt-1 font-body text-xs capitalize px-2 py-0.5 rounded-full ${p.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-muted'}`}>
                        {p.status}
                      </span>
                    </div>
                    {selected && <FiCheck className="text-white flex-shrink-0 mt-0.5" size={16} />}
                  </button>
                )
              })}
            </div>
            {projects.length === 0 && <p className="font-body text-xs text-muted p-3 bg-slate rounded-lg">No projects found. Add projects first from Admin → Projects.</p>}
          </div>
        </div>
        <button onClick={handleAdd} disabled={adding} className="btn-primary mt-4 gap-2 disabled:opacity-60">
          <FiPlus size={15} /> {adding ? 'Creating...' : 'Create Supervisor Account'}
        </button>
      </div>

      {/* Supervisor list */}
      <div className="space-y-4">
        {supervisors.map((sup) => (
          <div key={sup.id} className="admin-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FiUserCheck className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-display text-dark font-bold">{sup.name}</p>
                  <p className="font-body text-xs text-muted">{sup.email} · {sup.phone}</p>
                  <p className="font-body text-xs text-muted mt-0.5">
                    {sup.assignedProjects.length === 0
                      ? 'No projects assigned'
                      : projects.filter((p) => sup.assignedProjects.includes(p.id)).map((p) => p.title).join(', ') || `${sup.assignedProjects.length} project${sup.assignedProjects.length !== 1 ? 's' : ''} assigned`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setExpandedId(expandedId === sup.id ? null : sup.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-body text-xs border border-gray-200 text-dark hover:border-primary hover:text-primary rounded-lg transition-colors">
                  <FiFolder size={12} /> {expandedId === sup.id ? 'Hide' : 'Assign'}
                </button>
                <button onClick={() => toggleActive(sup)}
                  className={`px-3 py-1.5 font-body text-xs rounded-lg transition-colors ${sup.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-muted'}`}>
                  {sup.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(sup.id)} className="p-2 text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            {/* Project assignment panel */}
            {expandedId === sup.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-body text-xs text-muted uppercase tracking-wider">Assign / Remove Projects</p>
                  <p className="font-body text-xs text-primary font-semibold">{sup.assignedProjects.length} assigned</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {projects.map((p) => {
                    const assigned = sup.assignedProjects.includes(p.id)
                    return (
                      <button key={p.id} onClick={() => toggleProject(sup, p.id)}
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl border-2 text-left transition-all ${assigned ? 'bg-primary border-primary' : 'border-gray-200 hover:border-primary bg-slate'}`}>
                        <div className="min-w-0">
                          <p className={`font-body text-sm font-semibold truncate ${assigned ? 'text-white' : 'text-dark'}`}>{p.title}</p>
                          <p className={`font-body text-xs flex items-center gap-1 mt-0.5 ${assigned ? 'text-white/70' : 'text-muted'}`}>
                            <FiMapPin size={10} />{p.location}
                          </p>
                          <span className={`inline-block mt-1 font-body text-xs capitalize px-2 py-0.5 rounded-full ${p.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-muted'}`}>
                            {p.status}
                          </span>
                        </div>
                        {assigned && <FiCheck className="text-white flex-shrink-0 mt-0.5" size={16} />}
                      </button>
                    )
                  })}
                  {projects.length === 0 && <p className="col-span-2 font-body text-xs text-muted p-3 bg-white rounded-lg border border-gray-100">No projects found. Add projects first.</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {supervisors.length === 0 && (
          <div className="text-center py-12 admin-card">
            <FiUserCheck className="text-muted mx-auto mb-3" size={28} />
            <p className="font-body text-muted">No supervisors yet. Add one above.</p>
          </div>
        )}
      </div>

      <p className="font-body text-xs text-muted mt-4 p-4 bg-slate rounded-xl border border-gray-100">
        Supervisors log in at <strong>/supervisor</strong> with their email and password. They can only see projects assigned to them and log material entries and daily reports.
      </p>
    </div>
  )
}
