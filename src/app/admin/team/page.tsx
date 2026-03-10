'use client'
import { useEffect, useState } from 'react'
import { getAllTeam, addTeamMember, updateTeamMember, deleteTeamMember } from '@/lib/firestore'
import type { TeamMember } from '@/types'
import { FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'

const EMPTY: Omit<TeamMember, 'id'> = { name: '', role: '', bio: '', photo: '', experience: 0, isVisible: true, sortOrder: 0 }

export default function TeamAdminPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState('')

  useEffect(() => { getAllTeam().then(setTeam) }, [])
  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async () => { if (!form.name) return; const id = await addTeamMember(form); setTeam((t) => [...t, { ...form, id }]); setForm(EMPTY); showMsg('Added!') }
  const toggle = async (id: string, val: boolean) => { await updateTeamMember(id, { isVisible: !val }); setTeam((t) => t.map((m) => m.id === id ? { ...m, isVisible: !val } : m)) }
  const remove = async (id: string) => { if (!confirm('Delete?')) return; await deleteTeamMember(id); setTeam((t) => t.filter((m) => m.id !== id)) }

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-6">Team</h1>
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}
      <div className="admin-card mb-6">
        <h2 className="font-display text-lg text-dark font-bold mb-4">Add Member</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Role</label><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Experience (years)</label><input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Photo URL</label><input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} className="input-field" /></div>
          <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="input-field resize-none" /></div>
        </div>
        <button onClick={handleAdd} className="btn-primary mt-4 gap-2"><FiPlus /> Add</button>
      </div>
      <div className="admin-card grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((m) => (
          <div key={m.id} className="p-4 bg-slate rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3"><span className="font-display text-primary font-bold">{m.name[0]}</span></div>
            <p className="font-display text-dark font-bold text-sm">{m.name}</p>
            <p className="font-body text-xs text-accent font-semibold mb-2">{m.role}</p>
            <p className="font-body text-xs text-muted line-clamp-2 mb-3">{m.bio}</p>
            <div className="flex gap-2">
              <button onClick={() => toggle(m.id, m.isVisible)} className={`p-2 rounded-lg flex-1 justify-center flex transition-colors ${m.isVisible ? 'text-green-500 bg-green-50' : 'text-muted bg-gray-100'}`}>{m.isVisible ? <FiEye size={14} /> : <FiEyeOff size={14} />}</button>
              <button onClick={() => remove(m.id)} className="p-2 rounded-lg text-red-400 bg-red-50 flex-1 flex justify-center"><FiTrash2 size={14} /></button>
            </div>
          </div>
        ))}
        {team.length === 0 && <p className="col-span-full text-center font-body text-muted py-8 text-sm">No team members yet.</p>}
      </div>
    </div>
  )
}
