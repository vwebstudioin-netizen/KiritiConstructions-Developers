'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getInventoryUnits, addInventoryUnit, updateInventoryUnit, deleteInventoryUnit,
  getUnitEnquiriesByProject, updateUnitEnquiry,
  getAllInventoryProjects,
} from '@/lib/firestore'
import type { InventoryUnit, InventoryProject, UnitEnquiry, UnitStatus, UnitFacing, SizeUnit, EnquiryStatus } from '@/types'
import { FiArrowLeft, FiPlus, FiTrash2, FiX, FiCheck } from 'react-icons/fi'

type Tab = 'units' | 'enquiries'

const SIZE_UNITS: SizeUnit[] = ['sqft', 'sqyd', 'cents', 'acres', 'guntas']
const FACINGS: UnitFacing[] = ['East', 'West', 'North', 'South', 'NE', 'NW', 'SE', 'SW']
const STATUS_STYLES: Record<UnitStatus, string> = {
  available: 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100 cursor-pointer',
  booked: 'bg-amber-50 border-amber-300 text-amber-800 cursor-default',
  sold: 'bg-red-50 border-red-300 text-red-800 cursor-default opacity-70',
}
const ENQUIRY_STATUSES: EnquiryStatus[] = ['new', 'contacted', 'converted', 'closed']
const ENQUIRY_COLORS: Record<EnquiryStatus, string> = { new: 'badge-accent', contacted: 'badge-blue', converted: 'badge-green', closed: 'badge-gray' }

const EMPTY_UNIT = { unitNumber: '', type: 'plot' as InventoryUnit['type'], size: 0, sizeUnit: 'sqft' as SizeUnit, price: 0, status: 'available' as UnitStatus, facing: undefined as UnitFacing | undefined, floor: undefined as number | undefined, sortOrder: 0 }

export default function AdminInventoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<InventoryProject | null>(null)
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [enquiries, setEnquiries] = useState<UnitEnquiry[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('units')
  const [message, setMessage] = useState('')

  // New unit form
  const [newUnit, setNewUnit] = useState(EMPTY_UNIT)
  const [bulkCount, setBulkCount] = useState(0)
  const [bulkPrefix, setBulkPrefix] = useState('Plot-')
  const [bulkStart, setBulkStart] = useState(1)
  const [showBulk, setShowBulk] = useState(false)

  // Status modal
  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null)
  const [modalStatus, setModalStatus] = useState<UnitStatus>('available')
  const [modalName, setModalName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [savingModal, setSavingModal] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getAllInventoryProjects(),
      getInventoryUnits(id),
      getUnitEnquiriesByProject(id),
    ]).then(([projs, u, e]) => {
      setProject(projs.find((p) => p.id === id) ?? null)
      setUnits(u); setEnquiries(e)
    })
  }, [id])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAddUnit = async () => {
    if (!newUnit.unitNumber || !id) return
    const unitId = await addInventoryUnit(id, newUnit)
    setUnits((u) => [...u, { ...newUnit, id: unitId, projectId: id }])
    setNewUnit(EMPTY_UNIT); showMsg('Unit added!')
  }

  const handleBulkAdd = async () => {
    if (!bulkCount || !id) return
    const newUnits: InventoryUnit[] = []
    for (let i = 0; i < bulkCount; i++) {
      const num = bulkStart + i
      const unit = { ...newUnit, unitNumber: `${bulkPrefix}${num}`, sortOrder: num }
      const unitId = await addInventoryUnit(id, unit)
      newUnits.push({ ...unit, id: unitId, projectId: id })
    }
    setUnits((u) => [...u, ...newUnits])
    setShowBulk(false); showMsg(`${bulkCount} units added!`)
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!id || !confirm('Delete this unit?')) return
    await deleteInventoryUnit(id, unitId)
    setUnits((u) => u.filter((x) => x.id !== unitId))
  }

  const openModal = (unit: InventoryUnit) => {
    setSelectedUnit(unit)
    setModalStatus(unit.status)
    setModalName(unit.bookedByName ?? '')
    setModalPhone(unit.bookedByPhone ?? '')
  }

  const saveModal = async () => {
    if (!selectedUnit || !id) return
    setSavingModal(true)
    const update: Partial<InventoryUnit> = { status: modalStatus }
    if (modalStatus !== 'available') {
      update.bookedByName = modalName
      update.bookedByPhone = modalPhone
      update.bookedAt = new Date().toISOString()
    } else {
      update.bookedByName = ''; update.bookedByPhone = ''; update.bookedAt = ''
    }
    await updateInventoryUnit(id, selectedUnit.id, update)
    setUnits((u) => u.map((x) => x.id === selectedUnit.id ? { ...x, ...update } : x))
    setSelectedUnit(null); setSavingModal(false); showMsg('Unit status updated!')
  }

  const updateEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
    await updateUnitEnquiry(enquiryId, { status })
    setEnquiries((e) => e.map((x) => x.id === enquiryId ? { ...x, status } : x))
  }

  const available = units.filter((u) => u.status === 'available').length
  const booked = units.filter((u) => u.status === 'booked').length
  const sold = units.filter((u) => u.status === 'sold').length

  if (!project) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-muted hover:text-primary font-body text-sm mb-6 transition-colors"><FiArrowLeft size={14} /> All Inventory</Link>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl text-dark font-bold">{project.title}</h1>
          <p className="font-body text-muted text-sm">{project.location} · <span className="capitalize">{project.type}</span></p>
        </div>
        <Link href={`/plots/${project.slug}`} target="_blank" className="btn-outline text-xs gap-2">View Public Page</Link>
      </div>

      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="admin-card text-center"><p className="font-display text-2xl text-dark font-bold">{units.length}</p><p className="font-body text-xs text-muted">Total</p></div>
        <div className="admin-card text-center border-green-200 bg-green-50"><p className="font-display text-2xl text-green-600 font-bold">{available}</p><p className="font-body text-xs text-muted">Available</p></div>
        <div className="admin-card text-center border-amber-200 bg-amber-50"><p className="font-display text-2xl text-amber-600 font-bold">{booked}</p><p className="font-body text-xs text-muted">Booked</p></div>
        <div className="admin-card text-center border-red-200 bg-red-50"><p className="font-display text-2xl text-red-600 font-bold">{sold}</p><p className="font-body text-xs text-muted">Sold</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([['units', 'Units Grid'], ['enquiries', `Enquiries (${enquiries.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl font-body text-sm font-medium transition-all ${activeTab === key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark hover:border-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── UNITS GRID ─── */}
      {activeTab === 'units' && (
        <div className="space-y-5">
          {/* Unit grid */}
          <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-dark font-bold">Unit Status Map</h2>
              <p className="font-body text-xs text-muted">Click an available unit to change status</p>
            </div>
            {units.length === 0 ? (
              <p className="text-center font-body text-muted py-8 text-sm">No units yet. Add them below.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {units.map((unit) => (
                  <div key={unit.id}
                    onClick={() => openModal(unit)}
                    className={`relative border-2 rounded-xl p-3 transition-all ${STATUS_STYLES[unit.status]}`}>
                    <p className="font-display text-sm font-bold">{unit.unitNumber}</p>
                    <p className="font-body text-xs">{unit.size} {unit.sizeUnit}</p>
                    <p className="font-body text-xs font-semibold">₹{(unit.price / 100000).toFixed(1)}L</p>
                    {unit.facing && <p className="font-body text-xs opacity-70">{unit.facing}</p>}
                    <p className="font-body text-xs font-medium capitalize mt-0.5">{unit.status}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUnit(unit.id) }}
                      className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                      <FiX size={8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4 mt-4 font-body text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-300 border border-green-400 inline-block" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-300 border border-amber-400 inline-block" /> Booked</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-300 border border-red-400 inline-block" /> Sold</span>
            </div>
          </div>

          {/* Add single unit */}
          <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-dark font-bold">Add Unit</h2>
              <button onClick={() => setShowBulk(!showBulk)} className="font-body text-xs text-primary underline">
                {showBulk ? 'Single add' : 'Bulk add multiple'}
              </button>
            </div>

            {showBulk ? (
              <div className="space-y-4">
                <p className="font-body text-sm text-muted">Add multiple units with sequential numbers (e.g. Plot-1 to Plot-20)</p>
                <div className="grid md:grid-cols-4 gap-4">
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Prefix</label><input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="Plot-" className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Start Number</label><input type="number" value={bulkStart} onChange={(e) => setBulkStart(Number(e.target.value))} className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">How Many</label><input type="number" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} placeholder="10" className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Size ({newUnit.sizeUnit})</label><input type="number" value={newUnit.size} onChange={(e) => setNewUnit({ ...newUnit, size: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Unit</label>
                    <select value={newUnit.sizeUnit} onChange={(e) => setNewUnit({ ...newUnit, sizeUnit: e.target.value as SizeUnit })} className="input-field">
                      {SIZE_UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Price (₹ each)</label><input type="number" value={newUnit.price} onChange={(e) => setNewUnit({ ...newUnit, price: Number(e.target.value) })} className="input-field" /></div>
                </div>
                <p className="font-body text-sm text-muted">Preview: <strong>{bulkPrefix}{bulkStart}</strong> to <strong>{bulkPrefix}{bulkStart + bulkCount - 1}</strong> ({bulkCount} units)</p>
                <button onClick={handleBulkAdd} className="btn-primary gap-2"><FiPlus /> Add {bulkCount} Units</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Unit Number *</label><input value={newUnit.unitNumber} onChange={(e) => setNewUnit({ ...newUnit, unitNumber: e.target.value })} placeholder="e.g. Plot-15 or A-201" className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Type</label>
                  <select value={newUnit.type} onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value as InventoryUnit['type'] })} className="input-field">
                    {['plot', 'apartment', 'villa', 'floor'].map((t) => <option key={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Size *</label>
                  <div className="flex gap-2">
                    <input type="number" value={newUnit.size} onChange={(e) => setNewUnit({ ...newUnit, size: Number(e.target.value) })} className="input-field flex-1" />
                    <select value={newUnit.sizeUnit} onChange={(e) => setNewUnit({ ...newUnit, sizeUnit: e.target.value as SizeUnit })} className="input-field w-28">
                      {SIZE_UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Price (₹) *</label><input type="number" value={newUnit.price} onChange={(e) => setNewUnit({ ...newUnit, price: Number(e.target.value) })} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Facing</label>
                  <select value={newUnit.facing ?? ''} onChange={(e) => setNewUnit({ ...newUnit, facing: e.target.value as UnitFacing || undefined })} className="input-field">
                    <option value="">No preference</option>
                    {FACINGS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Floor (for apartments)</label><input type="number" value={newUnit.floor ?? ''} onChange={(e) => setNewUnit({ ...newUnit, floor: e.target.value ? Number(e.target.value) : undefined })} className="input-field" /></div>
              </div>
            )}
            {!showBulk && <button onClick={handleAddUnit} className="btn-primary mt-4 gap-2"><FiPlus /> Add Unit</button>}
          </div>
        </div>
      )}

      {/* ─── ENQUIRIES ─── */}
      {activeTab === 'enquiries' && (
        <div className="admin-card">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Unit Enquiries</h2>
          {enquiries.length === 0 ? (
            <p className="text-center font-body text-muted py-8 text-sm">No enquiries yet for this project.</p>
          ) : (
            <div className="space-y-3">
              {enquiries.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-body font-semibold text-dark text-sm">{e.name}</span>
                      {e.unitNumber && <span className="badge-primary">{e.unitNumber}</span>}
                      <span className={`badge capitalize ${ENQUIRY_COLORS[e.status]}`}>{e.status}</span>
                    </div>
                    <p className="font-body text-xs text-muted">{e.phone} · {e.email}</p>
                    <p className="font-body text-xs text-muted">{new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {e.message && <p className="font-body text-xs text-dark mt-1">{e.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {ENQUIRY_STATUSES.map((s) => (
                      <button key={s} onClick={() => updateEnquiryStatus(e.id, s)}
                        className={`px-2.5 py-1 rounded-lg font-body text-xs capitalize transition-colors ${e.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── STATUS MODAL ─── */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-dark font-bold">{selectedUnit.unitNumber}</h3>
              <button onClick={() => setSelectedUnit(null)} className="text-muted hover:text-dark"><FiX size={18} /></button>
            </div>
            <p className="font-body text-sm text-muted mb-4">{selectedUnit.size} {selectedUnit.sizeUnit} · ₹{(selectedUnit.price / 100000).toFixed(1)}L{selectedUnit.facing ? ` · ${selectedUnit.facing} facing` : ''}</p>

            <div className="space-y-2 mb-4">
              <label className="block font-body text-xs text-muted uppercase tracking-wider">Status</label>
              <div className="flex gap-2">
                {(['available', 'booked', 'sold'] as UnitStatus[]).map((s) => (
                  <button key={s} onClick={() => setModalStatus(s)}
                    className={`flex-1 py-2.5 rounded-xl font-body text-xs font-semibold capitalize border-2 transition-all ${modalStatus === s ? s === 'available' ? 'bg-green-500 text-white border-green-500' : s === 'booked' ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-dark hover:border-gray-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {modalStatus !== 'available' && (
              <div className="space-y-3 mb-4">
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Customer Name</label><input value={modalName} onChange={(e) => setModalName(e.target.value)} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Customer Phone</label><input value={modalPhone} onChange={(e) => setModalPhone(e.target.value)} className="input-field" /></div>
              </div>
            )}

            <button onClick={saveModal} disabled={savingModal} className="btn-primary w-full justify-center gap-2">
              <FiCheck size={16} /> {savingModal ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
