'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiMapPin, FiArrowLeft, FiPhone, FiMail, FiUser, FiCheckCircle } from 'react-icons/fi'
import { getInventoryProjectBySlug, getInventoryUnits, getCompanyInfo } from '@/lib/firestore'
import { DEFAULT_COMPANY } from '@/types'
import type { InventoryProject, InventoryUnit, CompanyInfo } from '@/types'

const STATUS_CARD: Record<string, string> = {
  available: 'bg-green-50 border-2 border-green-400 text-green-800 cursor-pointer hover:bg-green-100 hover:shadow-md active:scale-95 transition-all',
  booked: 'bg-amber-50 border-2 border-amber-300 text-amber-700 cursor-not-allowed opacity-80',
  sold: 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60',
}

export default function PlotsDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [project, setProject] = useState<InventoryProject | null>(null)
  const [units, setUnits] = useState<InventoryUnit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const enquiryRef = useRef<HTMLDivElement>(null)

  // Enquiry form
  const [form, setForm] = useState({ name: '', phone: '', email: '', unitNumber: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCompanyInfo(), getInventoryProjectBySlug(slug)]).then(async ([c, p]) => {
      if (c) setCompany(c)
      if (p) {
        setProject(p)
        const u = await getInventoryUnits(p.id)
        setUnits(u)
      }
      setLoading(false)
    })
  }, [slug])

  const handleUnitClick = (unit: InventoryUnit) => {
    if (unit.status !== 'available') return
    setSelectedUnit(unit)
    setForm((f) => ({ ...f, unitNumber: unit.unitNumber }))
    setTimeout(() => enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/unit-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          projectTitle: project.title,
          unitId: selectedUnit?.id,
          unitNumber: form.unitNumber || undefined,
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          status: 'new',
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch { setError('Something went wrong. Please call us directly.') }
    finally { setSubmitting(false) }
  }

  const available = units.filter((u) => u.status === 'available').length
  const booked = units.filter((u) => u.status === 'booked').length
  const sold = units.filter((u) => u.status === 'sold').length

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!project) return <div className="min-h-screen flex items-center justify-center"><p className="font-body text-muted">Project not found. <Link href="/plots" className="text-primary underline">View all plots</Link></p></div>

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        {/* Hero */}
        <section className="section-dark">
          <div className="container-custom">
            <Link href="/plots" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-body text-sm mb-6 transition-colors">
              <FiArrowLeft size={14} /> All Plots & Inventory
            </Link>
            <div className="flex flex-wrap items-start gap-4 mb-4">
              <span className="badge bg-accent text-dark capitalize">{project.type}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-3">{project.title}</h1>
            <p className="font-body text-white/60 flex items-center gap-2 mb-4"><FiMapPin size={14} />{project.location}</p>
            <p className="font-display text-2xl text-accent font-bold">
              ₹{(project.priceFrom / 100000).toFixed(1)}L{project.priceTo && project.priceTo > project.priceFrom ? ` – ₹${(project.priceTo / 100000).toFixed(1)}L` : '+'}
            </p>
          </div>
        </section>

        <section className="section bg-slate">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                {/* Cover image */}
                {project.coverImage && (
                  <div className="relative h-64 rounded-2xl overflow-hidden">
                    <Image src={project.coverImage} alt={project.title} fill className="object-cover" />
                  </div>
                )}

                {/* Description */}
                {project.description && (
                  <div className="admin-card">
                    <h2 className="font-display text-lg text-dark font-bold mb-2">About This Project</h2>
                    <p className="font-body text-muted text-base leading-relaxed">{project.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {project.amenities.length > 0 && (
                  <div className="admin-card">
                    <h2 className="font-display text-lg text-dark font-bold mb-3">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.amenities.map((a) => (
                        <span key={a} className="flex items-center gap-1.5 font-body text-sm bg-primary-50 text-primary px-3 py-1.5 rounded-xl">
                          <FiCheckCircle size={12} /> {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live availability stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="admin-card text-center border-green-200 bg-green-50">
                    <p className="font-display text-3xl text-green-600 font-bold">{available}</p>
                    <p className="font-body text-sm text-muted">Available</p>
                  </div>
                  <div className="admin-card text-center border-amber-200 bg-amber-50">
                    <p className="font-display text-3xl text-amber-600 font-bold">{booked}</p>
                    <p className="font-body text-sm text-muted">Booked</p>
                  </div>
                  <div className="admin-card text-center border-gray-200">
                    <p className="font-display text-3xl text-gray-500 font-bold">{sold}</p>
                    <p className="font-body text-sm text-muted">Sold</p>
                  </div>
                </div>

                {/* Interactive unit grid */}
                <div className="admin-card">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-lg text-dark font-bold">Unit Availability</h2>
                    <div className="flex gap-3 font-body text-xs">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-green-400 bg-green-50 inline-block" /> Available</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-amber-300 bg-amber-50 inline-block" /> Booked</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-gray-200 bg-gray-100 inline-block" /> Sold</span>
                    </div>
                  </div>
                  <p className="font-body text-xs text-muted mb-4">Click any green unit to enquire about it.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {units.map((unit) => (
                      <div key={unit.id} onClick={() => handleUnitClick(unit)}
                        className={`border-2 rounded-xl p-3 ${STATUS_CARD[unit.status]} ${selectedUnit?.id === unit.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        <p className="font-display text-sm font-bold">{unit.unitNumber}</p>
                        <p className="font-body text-xs">{unit.size} {unit.sizeUnit}</p>
                        <p className="font-body text-xs font-semibold">₹{(unit.price / 100000).toFixed(1)}L</p>
                        {unit.facing && <p className="font-body text-xs opacity-70">{unit.facing}</p>}
                        <p className="font-body text-xs font-medium capitalize mt-0.5">{unit.status}</p>
                      </div>
                    ))}
                    {units.length === 0 && <p className="col-span-full text-center font-body text-muted py-8">Unit details coming soon.</p>}
                  </div>
                </div>

                {/* Map */}
                {project.mapEmbed && (
                  <div className="rounded-2xl overflow-hidden h-72 border border-gray-100">
                    <iframe src={project.mapEmbed} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Location" />
                  </div>
                )}
              </div>

              {/* Enquiry form */}
              <div>
                <div ref={enquiryRef} className="admin-card sticky top-28">
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheckCircle className="text-green-600" size={28} />
                      </div>
                      <h3 className="font-display text-dark font-bold text-lg mb-2">Enquiry Received!</h3>
                      <p className="font-body text-muted text-sm">We will contact you within 24 hours regarding <strong>{form.unitNumber || 'your selected unit'}</strong>.</p>
                      <button onClick={() => { setSubmitted(false); setForm((f) => ({ ...f, name: '', phone: '', email: '', message: '' })); setSelectedUnit(null) }} className="mt-4 font-body text-xs text-primary underline">
                        Enquire about another unit
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-display text-lg text-dark font-bold mb-1">
                        {selectedUnit ? `Enquire: ${selectedUnit.unitNumber}` : 'Enquire About a Unit'}
                      </h3>
                      <p className="font-body text-xs text-muted mb-5">
                        {selectedUnit
                          ? `${selectedUnit.size} ${selectedUnit.sizeUnit} · ₹${(selectedUnit.price / 100000).toFixed(1)}L${selectedUnit.facing ? ` · ${selectedUnit.facing} facing` : ''}`
                          : 'Select a unit from the grid, or specify your preferred unit number below.'}
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Unit Number</label>
                          <input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. Plot-12 or any available" className="input-field" />
                        </div>
                        <div>
                          <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Your Name *</label>
                          <div className="relative"><FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field pl-9" /></div>
                        </div>
                        <div>
                          <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Phone *</label>
                          <div className="relative"><FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field pl-9" /></div>
                        </div>
                        <div>
                          <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Email *</label>
                          <div className="relative"><FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-9" /></div>
                        </div>
                        <div>
                          <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Message (Optional)</label>
                          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="input-field resize-none" placeholder="Any specific requirements..." />
                        </div>
                        {error && <p className="font-body text-xs text-red-500">{error}</p>}
                        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center gap-2 py-3.5 disabled:opacity-60">
                          {submitting ? 'Sending...' : 'Send Enquiry'}
                        </button>
                      </form>
                      <p className="font-body text-xs text-muted mt-3 text-center">
                        Or call <a href={`tel:${company.phone}`} className="text-primary font-medium">{company.phone}</a>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
