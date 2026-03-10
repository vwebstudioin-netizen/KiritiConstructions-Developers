'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllInventoryProjects, addInventoryProject, updateInventoryProject, deleteInventoryProject, getInventoryUnits } from '@/lib/firestore'
import type { InventoryProject, InventoryType } from '@/types'
import { FiPlus, FiTrash2, FiEye, FiEyeOff, FiStar, FiArrowRight, FiMap } from 'react-icons/fi'
import ImageUpload from '@/components/ui/ImageUpload'

const TYPES: InventoryType[] = ['plots', 'apartments', 'villas', 'floors']
const TYPE_LABELS: Record<InventoryType, string> = { plots: 'Plotted Layout', apartments: 'Apartment Block', villas: 'Villa Project', floors: 'Floor-wise' }

const EMPTY: Omit<InventoryProject, 'id' | 'createdAt'> = {
  title: '', slug: '', description: '', location: '', type: 'plots',
  images: [], coverImage: '', priceFrom: 0, priceTo: 0,
  totalUnits: 0, isVisible: true, isFeatured: false, amenities: [], mapEmbed: '',
}

export default function AdminInventoryPage() {
  const [projects, setProjects] = useState<InventoryProject[]>([])
  const [unitCounts, setUnitCounts] = useState<Record<string, { total: number; available: number }>>({})
  const [form, setForm] = useState(EMPTY)
  const [amenitiesText, setAmenitiesText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    getAllInventoryProjects().then(async (projs) => {
      setProjects(projs)
      const counts: Record<string, { total: number; available: number }> = {}
      await Promise.all(projs.map(async (p) => {
        const units = await getInventoryUnits(p.id)
        counts[p.id] = { total: units.length, available: units.filter((u) => u.status === 'available').length }
      }))
      setUnitCounts(counts)
    })
  }, [])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async () => {
    if (!form.title) return
    setAdding(true)
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const amenities = amenitiesText.split(',').map((a) => a.trim()).filter(Boolean)
    const id = await addInventoryProject({ ...form, slug, amenities, totalUnits: 0, createdAt: new Date().toISOString() })
    setProjects((p) => [...p, { ...form, slug, amenities, totalUnits: 0, id, createdAt: new Date().toISOString() }])
    setUnitCounts((c) => ({ ...c, [id]: { total: 0, available: 0 } }))
    setForm(EMPTY); setAmenitiesText(''); setShowForm(false); showMsg('Inventory project created!')
    setAdding(false)
  }

  const toggle = async (id: string, field: 'isVisible' | 'isFeatured', val: boolean) => {
    await updateInventoryProject(id, { [field]: !val })
    setProjects((p) => p.map((pr) => pr.id === id ? { ...pr, [field]: !val } : pr))
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this inventory project and all its units?')) return
    await deleteInventoryProject(id)
    setProjects((p) => p.filter((pr) => pr.id !== id))
    showMsg('Deleted.')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-dark font-bold">Inventory</h1>
          <p className="font-body text-muted text-sm mt-1">Manage plots, apartments, and units for sale.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2"><FiPlus /> Add Project</button>
      </div>

      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}

      {showForm && (
        <div className="admin-card mb-6">
          <h2 className="font-display text-lg text-dark font-bold mb-4">New Inventory Project</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Project Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sri Sai Nagar Plotted Layout" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InventoryType })} className="input-field">
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Location *</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Patancheru, Hyderabad" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Price From (₹)</label><input type="number" value={form.priceFrom} onChange={(e) => setForm({ ...form, priceFrom: Number(e.target.value) })} placeholder="2500000" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Price To (₹) Optional</label><input type="number" value={form.priceTo ?? 0} onChange={(e) => setForm({ ...form, priceTo: Number(e.target.value) })} placeholder="5000000" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Amenities (comma separated)</label><input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="DTCP Approved, Gated Community, 24hr Water" className="input-field" /></div>
            <div className="md:col-span-2"><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" /></div>
            <div className="md:col-span-2">
              <ImageUpload folder="inventory" value={form.images} onChange={(urls) => setForm({ ...form, images: urls, coverImage: urls[0] ?? '' })} maxImages={6} label="Project Images (first = cover)" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} disabled={adding} className="btn-primary gap-2 disabled:opacity-60">{adding ? 'Creating...' : <><FiPlus /> Create</>}</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 admin-card">
          <FiMap className="text-muted mx-auto mb-3" size={36} />
          <p className="font-display text-dark font-bold text-lg mb-1">No inventory projects yet</p>
          <p className="font-body text-muted text-sm">Click "Add Project" to create your first plotted layout or apartment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const counts = unitCounts[p.id] ?? { total: 0, available: 0 }
            const booked = counts.total - counts.available
            return (
              <div key={p.id} className="admin-card flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  {p.coverImage ? (
                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-16 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FiMap className="text-primary" size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display text-dark font-bold text-base truncate">{p.title}</span>
                      <span className="badge-primary capitalize">{p.type}</span>
                      {p.isFeatured && <span className="badge bg-amber-100 text-amber-700">Featured</span>}
                    </div>
                    <p className="font-body text-xs text-muted mb-2">{p.location} · ₹{(p.priceFrom / 100000).toFixed(1)}L{p.priceTo ? ` – ₹${(p.priceTo / 100000).toFixed(1)}L` : '+'}</p>
                    <div className="flex gap-3 font-body text-xs">
                      <span className="text-green-600 font-semibold">{counts.available} Available</span>
                      <span className="text-amber-600 font-semibold">{booked} Booked</span>
                      <span className="text-muted">{counts.total} Total Units</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/inventory/${p.id}`} className="flex items-center gap-1.5 px-3 py-2 font-body text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Manage <FiArrowRight size={12} />
                  </Link>
                  <button onClick={() => toggle(p.id, 'isFeatured', p.isFeatured)} className={`p-2 rounded-lg transition-colors ${p.isFeatured ? 'text-amber-500 bg-amber-50' : 'text-muted bg-gray-100'}`}><FiStar size={15} /></button>
                  <button onClick={() => toggle(p.id, 'isVisible', p.isVisible)} className={`p-2 rounded-lg transition-colors ${p.isVisible ? 'text-green-500 bg-green-50' : 'text-muted bg-gray-100'}`}>{p.isVisible ? <FiEye size={15} /> : <FiEyeOff size={15} />}</button>
                  <button onClick={() => remove(p.id)} className="p-2 text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><FiTrash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
