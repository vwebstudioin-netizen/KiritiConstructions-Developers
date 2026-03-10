'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getSupervisorByUid, getProjectById, getProjectMaterials, addMaterialTransaction, getMaterialTransactions, getDailyReports, addDailyReport, getSiteTeam } from '@/lib/firestore'
import type { Project, ProjectMaterial, MaterialTransaction, DailyReport, SiteTeamMember, Supervisor, TransactionType, WeatherCondition } from '@/types'
import { FiArrowLeft, FiCheckCircle, FiArrowDown, FiArrowUp, FiAlertTriangle } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { format } from 'date-fns'
import PhotoUpload from '@/components/ui/PhotoUpload'

type Tab = 'log-entry' | 'daily-report' | 'materials' | 'transactions' | 'team'
const WEATHER_OPTIONS: WeatherCondition[] = ['Sunny', 'Cloudy', 'Rainy', 'Stormy']
const UNITS = ['loads', 'bags', 'kg', 'tons', 'cubic meters', 'pieces', 'sqft', 'liters', 'tankers']

export default function SupervisorProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [materials, setMaterials] = useState<ProjectMaterial[]>([])
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [team, setTeam] = useState<SiteTeamMember[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('log-entry')
  const [message, setMessage] = useState('')
  const [waAlerts, setWaAlerts] = useState<Record<string, string>>({})

  const today = format(new Date(), 'yyyy-MM-dd')

  // Forms
  const [entry, setEntry] = useState({ materialId: '', type: 'inward' as TransactionType, quantity: 0, date: today, notes: '', photos: [] as string[] })
  const [report, setReport] = useState({ date: today, workDone: '', laborCount: 0, weatherCondition: 'Sunny' as WeatherCondition, issuesReported: '', materialsHighlight: '' })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !projectId) return
      const [sup, proj, mats, txns, reports, tm] = await Promise.all([
        getSupervisorByUid(user.uid),
        getProjectById(projectId),
        getProjectMaterials(projectId),
        getMaterialTransactions(projectId),
        getDailyReports(projectId),
        getSiteTeam(projectId),
      ])
      setSupervisor(sup); setProject(proj); setMaterials(mats); setTransactions(txns); setDailyReports(reports); setTeam(tm)
    })
    return () => unsub()
  }, [projectId])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 5000) }

  const handleLogEntry = async () => {
    if (!entry.materialId || !entry.quantity || !projectId || !supervisor) return
    const mat = materials.find((m) => m.id === entry.materialId)
    if (!mat) return

    const txnId = await addMaterialTransaction(projectId, {
      ...entry, materialName: mat.name, unit: mat.unit,
      supervisorName: supervisor.name, supervisorId: supervisor.uid,
      photos: entry.photos,
      createdAt: new Date().toISOString(),
    })

    setMaterials((prev) => prev.map((m) => m.id === entry.materialId ? {
      ...m,
      totalInward: entry.type === 'inward' ? m.totalInward + entry.quantity : m.totalInward,
      totalConsumed: entry.type === 'consumed' ? m.totalConsumed + entry.quantity : m.totalConsumed,
    } : m))
    setTransactions((prev) => [{ id: txnId, projectId, ...entry, materialName: mat.name, unit: mat.unit, supervisorName: supervisor.name, supervisorId: supervisor.uid, createdAt: new Date().toISOString() }, ...prev])

    // Check low stock
    if (entry.type === 'consumed') {
      const balance = mat.totalInward - mat.totalConsumed - entry.quantity
      if (balance < mat.lowStockThreshold) {
        const res = await fetch('/api/alert/low-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectTitle: project?.title, materialName: mat.name, unit: mat.unit, balance, threshold: mat.lowStockThreshold }),
        })
        const data = await res.json()
        if (data.whatsappUrl) setWaAlerts((prev) => ({ ...prev, [mat.id]: data.whatsappUrl }))
        showMsg(`Entry saved. Low stock alert sent to admin! ${mat.name}: only ${balance} ${mat.unit} remaining.`)
      } else {
        showMsg(`Consumed ${entry.quantity} ${mat.unit} of ${mat.name} logged.`)
      }
    } else {
      showMsg(`Received ${entry.quantity} ${mat.unit} of ${mat.name} logged.`)
    }
    setEntry({ materialId: '', type: 'inward', quantity: 0, date: today, notes: '', photos: [] })
  }

  const handleSubmitReport = async () => {
    if (!report.workDone || !projectId || !supervisor) return
    const reportId = await addDailyReport(projectId, { ...report, supervisorName: supervisor.name, supervisorId: supervisor.uid, createdAt: new Date().toISOString() })
    setDailyReports((prev) => [{ id: reportId, projectId, ...report, supervisorName: supervisor.name, supervisorId: supervisor.uid, createdAt: new Date().toISOString() }, ...prev])
    showMsg('Daily report submitted successfully!')
    setReport({ date: today, workDone: '', laborCount: 0, weatherCondition: 'Sunny', issuesReported: '', materialsHighlight: '' })
  }

  const todayReport = dailyReports.find((r) => r.date === today)
  const lowStockItems = materials.filter((m) => (m.totalInward - m.totalConsumed) < m.lowStockThreshold)

  if (!project) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <Link href="/supervisor" className="inline-flex items-center gap-2 text-muted hover:text-primary font-body text-sm mb-6 transition-colors"><FiArrowLeft size={14} /> My Sites</Link>
      <h1 className="font-display text-2xl text-dark font-bold mb-1">{project.title}</h1>
      <p className="font-body text-muted text-sm mb-4">{project.location} · {project.status}</p>

      {/* Message */}
      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 font-body text-sm ${message.toLowerCase().includes('low stock') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Low stock alerts with WhatsApp */}
      {Object.entries(waAlerts).map(([matId, url]) => {
        const mat = materials.find((m) => m.id === matId)
        return (
          <div key={matId} className="mb-3 flex items-center justify-between gap-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-body text-sm text-red-700 flex items-center gap-2">
              <FiAlertTriangle size={14} /> Low stock alert for <strong>{mat?.name}</strong> — admin notified by email
            </p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-body text-xs font-semibold bg-[#25D366] text-white px-3 py-1.5 rounded-lg whitespace-nowrap">
              <FaWhatsapp size={13} /> Also WhatsApp Admin
            </a>
          </div>
        )
      })}

      {/* Today status */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="admin-card text-center"><p className="font-display text-xl text-dark font-bold">{materials.length}</p><p className="font-body text-xs text-muted">Materials</p></div>
        <div className={`admin-card text-center ${lowStockItems.length > 0 ? 'border-red-200 bg-red-50' : ''}`}><p className={`font-display text-xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-dark'}`}>{lowStockItems.length}</p><p className="font-body text-xs text-muted">Low Stock</p></div>
        <div className={`admin-card text-center ${!todayReport ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}><p className={`font-display text-xl font-bold ${!todayReport ? 'text-amber-600' : 'text-green-600'}`}>{todayReport ? '✓' : '!'}</p><p className="font-body text-xs text-muted">Today&apos;s Report</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {([
          { key: 'log-entry', label: 'Log Entry' },
          { key: 'daily-report', label: `Daily Report${!todayReport ? ' !' : ''}` },
          { key: 'materials', label: 'Stock', badge: lowStockItems.length },
          { key: 'transactions', label: 'History' },
          { key: 'team', label: 'Team' },
        ] as { key: Tab; label: string; badge?: number }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 rounded-xl font-body text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark hover:border-primary'}`}>
            {tab.label}
            {tab.badge ? <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ─── LOG ENTRY ─── */}
      {activeTab === 'log-entry' && (
        <div className="admin-card max-w-lg">
          <h2 className="font-display text-lg text-dark font-bold mb-2">Log Material Movement</h2>
          <p className="font-body text-xs text-muted mb-5">Record when materials are received at site or used in construction.</p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Material *</label>
              <select value={entry.materialId} onChange={(e) => setEntry({ ...entry, materialId: e.target.value })} className="input-field">
                <option value="">Select material...</option>
                {materials.map((m) => {
                  const balance = m.totalInward - m.totalConsumed
                  const isLow = balance < m.lowStockThreshold
                  return <option key={m.id} value={m.id}>{isLow ? '⚠ ' : ''}{m.name} — Balance: {balance} {m.unit}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Type *</label>
              <div className="flex gap-3">
                <button onClick={() => setEntry({ ...entry, type: 'inward' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm font-medium border-2 transition-all ${entry.type === 'inward' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-dark hover:border-green-400'}`}>
                  <FiArrowDown size={15} /> Received
                </button>
                <button onClick={() => setEntry({ ...entry, type: 'consumed' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm font-medium border-2 transition-all ${entry.type === 'consumed' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-dark hover:border-red-400'}`}>
                  <FiArrowUp size={15} /> Used
                </button>
              </div>
            </div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Quantity *</label><input type="number" min={0} value={entry.quantity} onChange={(e) => setEntry({ ...entry, quantity: Number(e.target.value) })} placeholder="e.g. 50" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Date</label><input type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Notes (Optional)</label><input value={entry.notes} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} placeholder="Vehicle no., supplier, delivery challan no." className="input-field" /></div>
            {projectId && entry.materialId && (
              <PhotoUpload
                projectId={projectId}
                materialName={materials.find((m) => m.id === entry.materialId)?.name ?? 'material'}
                onUploaded={(urls) => setEntry((prev) => ({ ...prev, photos: urls }))}
                maxPhotos={3}
              />
            )}
            <button onClick={handleLogEntry} className="btn-primary w-full justify-center gap-2 py-3.5 text-base">
              <FiCheckCircle size={16} /> Submit Entry
            </button>
          </div>
        </div>
      )}

      {/* ─── DAILY REPORT ─── */}
      {activeTab === 'daily-report' && (
        <div className="space-y-5">
          {todayReport ? (
            <div className="admin-card border-green-200 bg-green-50">
              <p className="font-body text-sm text-green-700 font-medium mb-3">Today&apos;s report already submitted ({today})</p>
              <div className="p-4 bg-white rounded-xl border border-green-100">
                <div className="flex flex-wrap gap-4 mb-2 font-body text-sm text-muted">
                  <span>{todayReport.weatherCondition}</span><span>{todayReport.laborCount} workers</span><span>by {todayReport.supervisorName}</span>
                </div>
                <p className="font-body text-sm text-dark">{todayReport.workDone}</p>
                {todayReport.materialsHighlight && <p className="font-body text-xs text-muted mt-1">{todayReport.materialsHighlight}</p>}
                {todayReport.issuesReported && <p className="font-body text-xs text-red-500 mt-1">Issue: {todayReport.issuesReported}</p>}
              </div>
            </div>
          ) : (
            <div className="admin-card border-amber-200 bg-amber-50">
              <p className="font-body text-sm text-amber-700 font-medium">Today&apos;s report not yet submitted — please file it before end of day.</p>
            </div>
          )}

          <div className="admin-card max-w-xl">
            <h2 className="font-display text-lg text-dark font-bold mb-4">{todayReport ? 'Submit Another Report' : 'Submit Today\'s Report'}</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Date</label><input type="date" value={report.date} onChange={(e) => setReport({ ...report, date: e.target.value })} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Labour Count</label><input type="number" min={0} value={report.laborCount} onChange={(e) => setReport({ ...report, laborCount: Number(e.target.value) })} className="input-field" /></div>
                <div className="md:col-span-2"><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Weather</label>
                  <div className="flex gap-2 flex-wrap">
                    {WEATHER_OPTIONS.map((w) => (
                      <button key={w} onClick={() => setReport({ ...report, weatherCondition: w })}
                        className={`px-4 py-2 rounded-xl font-body text-sm transition-all border ${report.weatherCondition === w ? 'bg-primary text-white border-primary' : 'border-gray-200 text-dark hover:border-primary'}`}>
                        {w === 'Sunny' ? '☀️' : w === 'Cloudy' ? '☁️' : w === 'Rainy' ? '🌧️' : '⛈️'} {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Work Done Today *</label><textarea value={report.workDone} onChange={(e) => setReport({ ...report, workDone: e.target.value })} rows={3} className="input-field resize-none" placeholder="Describe work completed today..." /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Materials Summary</label><textarea value={report.materialsHighlight} onChange={(e) => setReport({ ...report, materialsHighlight: e.target.value })} rows={2} className="input-field resize-none" placeholder="e.g. Used 30 bags cement, 2 loads sand..." /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Issues / Delays (if any)</label><textarea value={report.issuesReported} onChange={(e) => setReport({ ...report, issuesReported: e.target.value })} rows={2} className="input-field resize-none" placeholder="Any problems, safety incidents, or delays..." /></div>
              <button onClick={handleSubmitReport} className="btn-primary w-full justify-center gap-2 py-3.5 text-base">
                <FiCheckCircle size={16} /> Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STOCK ─── */}
      {activeTab === 'materials' && (
        <div className="admin-card overflow-x-auto">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Current Stock Levels</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-body font-semibold text-dark py-3 pr-4">Material</th>
                <th className="text-right font-body font-semibold text-green-600 py-3 pr-4">Inward</th>
                <th className="text-right font-body font-semibold text-red-500 py-3 pr-4">Consumed</th>
                <th className="text-right font-body font-semibold text-dark py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const balance = m.totalInward - m.totalConsumed
                const isLow = balance < m.lowStockThreshold
                return (
                  <tr key={m.id} className={`border-b border-gray-50 ${isLow ? 'bg-red-50/60' : ''}`}>
                    <td className="py-3 pr-4">
                      <p className="font-body font-medium text-dark">{m.name}</p>
                      <p className="font-body text-xs text-muted">{m.unit}</p>
                    </td>
                    <td className="py-3 pr-4 text-right font-body text-green-600 font-semibold">{m.totalInward}</td>
                    <td className="py-3 pr-4 text-right font-body text-red-500 font-semibold">{m.totalConsumed}</td>
                    <td className={`py-3 text-right font-display text-lg font-bold ${isLow ? 'text-red-600' : 'text-dark'}`}>
                      {balance} {isLow && <FiAlertTriangle className="inline ml-1 text-red-500" size={13} />}
                    </td>
                  </tr>
                )
              })}
              {materials.length === 0 && <tr><td colSpan={4} className="py-8 text-center font-body text-muted text-sm">No materials configured yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── HISTORY ─── */}
      {activeTab === 'transactions' && (
        <div className="admin-card space-y-2">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Transaction History</h2>
          {transactions.slice(0, 50).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 p-3 bg-slate rounded-xl border border-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === 'inward' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {t.type === 'inward' ? <FiArrowDown className="text-green-600" size={13} /> : <FiArrowUp className="text-red-500" size={13} />}
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-dark">{t.materialName}</p>
                  <p className="font-body text-xs text-muted">{t.date}{t.notes ? ` · ${t.notes}` : ''}</p>
                  {t.photos && t.photos.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {t.photos.map((url, pi) => (
                        <a key={pi} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                          <img src={url} alt={`Proof ${pi + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className={`font-display text-base font-bold ${t.type === 'inward' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'inward' ? '+' : '-'}{t.quantity} {t.unit}
              </span>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No entries yet.</p>}
        </div>
      )}

      {/* ─── TEAM ─── */}
      {activeTab === 'team' && (
        <div className="admin-card">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Site Team</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {team.map((m) => (
              <div key={m.id} className="p-4 bg-slate rounded-xl border border-gray-100">
                <p className="font-body font-semibold text-dark text-sm">{m.name}</p>
                <p className="font-body text-xs text-accent-dark font-medium">{m.role}</p>
                {m.phone && <p className="font-body text-xs text-muted mt-0.5">{m.phone}</p>}
              </div>
            ))}
            {team.length === 0 && <p className="col-span-full text-center font-body text-muted py-6 text-sm">No team members added yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
