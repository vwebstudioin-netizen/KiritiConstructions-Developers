'use client'
import { useEffect, useState } from 'react'
import { getAllServices, addService, updateService, deleteService } from '@/lib/firestore'
import type { Service, ServiceCategory } from '@/types'
import { FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'

const CATS: ServiceCategory[] = ['Construction', 'Renovation', 'Interior', 'Civil']
const EMPTY: Omit<Service, 'id'> = { name: '', slug: '', description: '', longDescription: '', icon: 'FiHome', category: 'Construction', features: [], isAvailable: true, sortOrder: 0 }

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([])
  const [form, setForm] = useState(EMPTY)
  const [featureInput, setFeatureInput] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { getAllServices().then(setServices) }, [])
  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async () => {
    if (!form.name) return
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const id = await addService({ ...form, slug })
    setServices((s) => [...s, { ...form, slug, id }])
    setForm(EMPTY); setFeatureInput(''); showMsg('Added!')
  }

  const addFeature = () => { if (!featureInput.trim()) return; setForm((f) => ({ ...f, features: [...f.features, featureInput.trim()] })); setFeatureInput('') }

  const toggle = async (id: string, val: boolean) => { await updateService(id, { isAvailable: !val }); setServices((s) => s.map((sv) => sv.id === id ? { ...sv, isAvailable: !val } : sv)) }

  const remove = async (id: string) => { if (!confirm('Delete?')) return; await deleteService(id); setServices((s) => s.filter((sv) => sv.id !== id)) }

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-6">Services</h1>
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}
      <div className="admin-card mb-6">
        <h2 className="font-display text-lg text-dark font-bold mb-4">Add Service</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
          <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })} className="input-field">{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
          <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Features</label><div className="flex gap-2 mb-2"><input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFeature()} placeholder="Add feature, press Enter" className="input-field flex-1" /><button onClick={addFeature} className="btn-primary px-4"><FiPlus /></button></div><div className="flex flex-wrap gap-2">{form.features.map((f, i) => <span key={i} className="badge-primary cursor-pointer hover:bg-red-100 hover:text-red-600" onClick={() => setForm((sf) => ({ ...sf, features: sf.features.filter((_, j) => j !== i) }))}>{f} ×</span>)}</div></div>
        </div>
        <button onClick={handleAdd} className="btn-primary mt-4 gap-2"><FiPlus /> Add</button>
      </div>
      <div className="admin-card space-y-3">
        {services.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
            <div className="flex-1"><div className="flex items-center gap-2 flex-wrap mb-0.5"><span className="font-body font-semibold text-dark text-sm">{s.name}</span><span className="badge-primary">{s.category}</span>{!s.isAvailable && <span className="badge-gray">Hidden</span>}</div><p className="font-body text-xs text-muted line-clamp-1">{s.description}</p></div>
            <div className="flex gap-2"><button onClick={() => toggle(s.id, s.isAvailable)} className={`p-2 rounded-xl transition-colors ${s.isAvailable ? 'text-green-500 bg-green-50' : 'text-muted bg-gray-100'}`}>{s.isAvailable ? <FiEye size={15} /> : <FiEyeOff size={15} />}</button><button onClick={() => remove(s.id)} className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors"><FiTrash2 size={15} /></button></div>
          </div>
        ))}
        {services.length === 0 && <p className="text-center font-body text-muted py-8 text-sm">No services yet.</p>}
      </div>
    </div>
  )
}
