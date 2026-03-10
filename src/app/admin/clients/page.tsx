'use client'
import { useEffect, useState } from 'react'
import { getAllClients, addClient, deleteClient, getAllProjects } from '@/lib/firestore'
import type { Client, Project } from '@/types'
import { FiPlus, FiTrash2, FiUser } from 'react-icons/fi'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const EMPTY = { name: '', phone: '', email: '', password: '', address: '' }

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { Promise.all([getAllClients(), getAllProjects()]).then(([c, p]) => { setClients(c); setProjects(p) }) }, [])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return
    setAdding(true)
    try {
      // Create Firebase Auth account
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const uid = userCred.user.uid
      const id = await addClient({ uid, name: form.name, phone: form.phone, email: form.email, address: form.address, assignedProjects: [], createdAt: new Date().toISOString() })
      setClients((c) => [...c, { id, uid, name: form.name, phone: form.phone, email: form.email, address: form.address, assignedProjects: [], createdAt: new Date().toISOString() }])
      setForm(EMPTY)
      showMsg('Client account created!')
    } catch (err: unknown) {
      showMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setAdding(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this client record? (Firebase Auth user will NOT be deleted automatically)')) return
    await deleteClient(id)
    setClients((c) => c.filter((cl) => cl.id !== id))
    showMsg('Client removed.')
  }

  const getClientProjects = (uid: string) => projects.filter((p) => p.clientId === uid)

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-6">Clients</h1>
      {message && <div className={`mb-4 rounded-xl px-4 py-3 font-body text-sm ${message.startsWith('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>{message}</div>}

      <div className="admin-card mb-6">
        <h2 className="font-display text-lg text-dark font-bold mb-4">Add New Client</h2>
        <p className="font-body text-xs text-muted mb-4">This will create a Firebase Auth account so the client can log in to their portal.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Temporary Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" className="input-field" /></div>
          <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
        </div>
        <button onClick={handleAdd} disabled={adding} className="btn-primary mt-4 gap-2 disabled:opacity-60"><FiPlus /> {adding ? 'Creating...' : 'Create Client Account'}</button>
      </div>

      <div className="admin-card">
        <h2 className="font-display text-lg text-dark font-bold mb-4">All Clients ({clients.length})</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {clients.map((client) => {
            const clientProjects = getClientProjects(client.uid)
            return (
              <div key={client.id} className="p-4 bg-slate rounded-xl border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-primary font-bold">{client.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-display text-dark font-bold text-sm">{client.name}</p>
                      <p className="font-body text-xs text-muted">{client.email}</p>
                      {client.phone && <p className="font-body text-xs text-muted">{client.phone}</p>}
                    </div>
                  </div>
                  <button onClick={() => remove(client.id)} className="p-2 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"><FiTrash2 size={14} /></button>
                </div>
                {clientProjects.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="font-body text-xs text-muted mb-1">Projects:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {clientProjects.map((p) => <span key={p.id} className="badge-primary text-xs">{p.title.split('—')[0].trim()}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {clients.length === 0 && <p className="col-span-full text-center font-body text-muted py-8 text-sm">No clients yet.</p>}
        </div>
      </div>
    </div>
  )
}
