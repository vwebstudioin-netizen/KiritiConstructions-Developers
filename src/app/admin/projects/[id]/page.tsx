'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getProjectById, getMilestones, addMilestone, updateMilestone, deleteMilestone,
  getDocuments, addDocument, deleteDocument, updateDocument,
  getPaymentsByProject, addPayment, getAllClients,
  getProjectMaterials, addProjectMaterial, updateProjectMaterial, deleteProjectMaterial,
  getMaterialTransactions, addMaterialTransaction, deleteMaterialTransaction,
  getDailyReports, addDailyReport, updateDailyReport,
  getSiteTeam, addSiteTeamMember, deleteSiteTeamMember,
  getProjectExpenses, addProjectExpense, deleteProjectExpense,
  getProjectVendors, addProjectVendor, deleteProjectVendor,
  getVendorOrders, addVendorOrder, updateVendorOrder, deleteVendorOrder,
} from '@/lib/firestore'
import type {
  Project, Milestone, ProjectDocument, Payment, Client,
  MilestoneStatus, DocumentType, PaymentStatus,
  ProjectMaterial, MaterialTransaction, DailyReport, SiteTeamMember,
  MaterialCategory, TransactionType, WeatherCondition,
  ProjectExpense, ExpenseCategory,
  ProjectVendor, VendorOrder, VendorType, OrderStatus,
} from '@/types'
import { DEFAULT_CONSTRUCTION_MATERIALS } from '@/types'
import { FiArrowLeft, FiPlus, FiTrash2, FiCheckCircle, FiAlertTriangle, FiArrowDown, FiArrowUp } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
// sendMilestoneUpdate called via /api/milestone-complete to avoid nodemailer in client bundle
import { format } from 'date-fns'
import PhotoUpload from '@/components/ui/PhotoUpload'
import ImageUpload from '@/components/ui/ImageUpload'

type Tab = 'overview' | 'images' | 'materials' | 'log-entry' | 'transactions' | 'daily-report' | 'team' | 'milestones' | 'documents' | 'payments' | 'expenses' | 'vendors'

const MILESTONE_STATUSES: MilestoneStatus[] = ['pending', 'in-progress', 'completed']
const DOC_TYPES: DocumentType[] = ['blueprint', 'estimate', 'invoice', 'completion', 'other']
const MATERIAL_CATEGORIES: MaterialCategory[] = ['Aggregate', 'Binding', 'Steel', 'Masonry', 'Finishing', 'Plumbing', 'Other']
const WEATHER_OPTIONS: WeatherCondition[] = ['Sunny', 'Cloudy', 'Rainy', 'Stormy']
const UNITS = ['loads', 'bags', 'kg', 'tons', 'cubic meters', 'pieces', 'sqft', 'liters', 'tankers', 'bundles', 'sheets']

export default function ProjectManagePage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [materials, setMaterials] = useState<ProjectMaterial[]>([])
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [team, setTeam] = useState<SiteTeamMember[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [message, setMessage] = useState('')
  const [markingPayment, setMarkingPayment] = useState<string | null>(null)
  const [waLinks, setWaLinks] = useState<Record<string, string>>({})
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [newExpense, setNewExpense] = useState({ category: 'Materials' as ExpenseCategory, description: '', amount: 0, date: new Date().toISOString().split('T')[0], addedBy: 'Admin' })
  const [vendors, setVendors] = useState<ProjectVendor[]>([])
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([])
  const [newVendor, setNewVendor] = useState({ name: '', type: 'Material Supplier' as VendorType, phone: '', gstNumber: '', notes: '' })
  const [newOrder, setNewOrder] = useState({ vendorId: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], invoiceNumber: '' })

  // Forms
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', percentage: 0, status: 'pending' as MilestoneStatus, photos: [] as string[], sortOrder: 0 })
  const [newDoc, setNewDoc] = useState({ name: '', type: 'estimate' as DocumentType, url: '', isClientVisible: true, uploadedAt: new Date().toISOString() })
  const [newPayment, setNewPayment] = useState({ description: '', amount: 0 })
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'bags', category: 'Binding' as MaterialCategory, lowStockThreshold: 50, totalInward: 0, totalConsumed: 0, sortOrder: 0 })
  const [newEntry, setNewEntry] = useState({ materialId: '', type: 'inward' as TransactionType, quantity: 0, date: format(new Date(), 'yyyy-MM-dd'), supervisorName: 'Admin', notes: '', photos: [] as string[] })
  const [newReport, setNewReport] = useState({ date: format(new Date(), 'yyyy-MM-dd'), supervisorName: 'Admin', workDone: '', laborCount: 0, weatherCondition: 'Sunny' as WeatherCondition, issuesReported: '', materialsHighlight: '' })
  const [newMember, setNewMember] = useState({ name: '', role: '', phone: '' })

  useEffect(() => {
    if (!id) return
    Promise.all([
      getProjectById(id), getMilestones(id), getDocuments(id),
      getPaymentsByProject(id), getAllClients(),
      getProjectMaterials(id), getMaterialTransactions(id),
      getDailyReports(id), getSiteTeam(id), getProjectExpenses(id),
      getProjectVendors(id), getVendorOrders(id),
    ]).then(([p, m, d, pay, c, mats, txns, reports, tm, exps, vends, orders]) => {
      setProject(p); setMilestones(m); setDocuments(d); setPayments(pay); setClients(c)
      setMaterials(mats); setTransactions(txns); setDailyReports(reports); setTeam(tm)
      setExpenses(exps); setVendors(vends); setVendorOrders(orders)
    })
  }, [id])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  // ─── Material helpers ──────────────────────────────────────────────
  const initDefaultMaterials = async () => {
    if (!id) return
    if (!confirm('Add standard construction materials to this project?')) return
    for (const mat of DEFAULT_CONSTRUCTION_MATERIALS) {
      const matId = await addProjectMaterial(id, mat)
      setMaterials((prev) => [...prev, { ...mat, id: matId, projectId: id }])
    }
    showMsg('Default materials added!')
  }

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !id) return
    const matId = await addProjectMaterial(id, newMaterial)
    setMaterials((prev) => [...prev, { ...newMaterial, id: matId, projectId: id }])
    setNewMaterial({ name: '', unit: 'bags', category: 'Binding', lowStockThreshold: 50, totalInward: 0, totalConsumed: 0, sortOrder: 0 })
    showMsg('Material added!')
  }

  const handleDeleteMaterial = async (matId: string) => {
    if (!id || !confirm('Delete this material?')) return
    await deleteProjectMaterial(id, matId)
    setMaterials((prev) => prev.filter((m) => m.id !== matId))
  }

  const handleLogEntry = async () => {
    if (!newEntry.materialId || !newEntry.quantity || !id) return
    const mat = materials.find((m) => m.id === newEntry.materialId)
    if (!mat) return
    const txnId = await addMaterialTransaction(id, { ...newEntry, materialName: mat.name, unit: mat.unit, supervisorId: 'admin', photos: newEntry.photos, createdAt: new Date().toISOString() })
    // Update local material totals
    setMaterials((prev) => prev.map((m) => m.id === newEntry.materialId ? {
      ...m,
      totalInward: newEntry.type === 'inward' ? m.totalInward + newEntry.quantity : m.totalInward,
      totalConsumed: newEntry.type === 'consumed' ? m.totalConsumed + newEntry.quantity : m.totalConsumed,
    } : m))
    const newTxn: MaterialTransaction = { id: txnId, projectId: id, ...newEntry, materialName: mat.name, unit: mat.unit, supervisorId: 'admin', createdAt: new Date().toISOString() }
    setTransactions((prev) => [newTxn, ...prev])

    // Check low stock after consumed entry
    if (newEntry.type === 'consumed') {
      const balance = mat.totalInward - mat.totalConsumed - newEntry.quantity
      if (balance < mat.lowStockThreshold) {
        const res = await fetch('/api/alert/low-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectTitle: project?.title, materialName: mat.name, unit: mat.unit, balance, threshold: mat.lowStockThreshold }),
        })
        const data = await res.json()
        if (data.whatsappUrl) setWaLinks((prev) => ({ ...prev, [`stock_${mat.id}`]: data.whatsappUrl }))
        showMsg(`Entry logged. Low stock alert: ${mat.name} balance is ${balance} ${mat.unit}!`)
      } else {
        showMsg(`Consumed ${newEntry.quantity} ${mat.unit} of ${mat.name} logged.`)
      }
    } else {
      showMsg(`Inward entry logged — received ${newEntry.quantity} ${mat.unit} of ${mat.name}`)
    }
    setNewEntry({ materialId: '', type: 'inward', quantity: 0, date: format(new Date(), 'yyyy-MM-dd'), supervisorName: 'Admin', notes: '', photos: [] })
  }

  const handleDeleteTransaction = async (txn: MaterialTransaction) => {
    if (!id || !confirm('Delete this entry? Running totals will be reversed.')) return
    await deleteMaterialTransaction(id, txn.id, txn.materialId, txn.type, txn.quantity)
    setTransactions((prev) => prev.filter((t) => t.id !== txn.id))
    setMaterials((prev) => prev.map((m) => m.id === txn.materialId ? {
      ...m,
      totalInward: txn.type === 'inward' ? m.totalInward - txn.quantity : m.totalInward,
      totalConsumed: txn.type === 'consumed' ? m.totalConsumed - txn.quantity : m.totalConsumed,
    } : m))
    showMsg('Entry deleted.')
  }

  const handleAddDailyReport = async () => {
    if (!newReport.workDone || !id) return
    const reportId = await addDailyReport(id, { ...newReport, supervisorId: 'admin', createdAt: new Date().toISOString() })
    setDailyReports((prev) => [{ id: reportId, projectId: id, ...newReport, supervisorId: 'admin', createdAt: new Date().toISOString() }, ...prev])
    setNewReport({ date: format(new Date(), 'yyyy-MM-dd'), supervisorName: 'Admin', workDone: '', laborCount: 0, weatherCondition: 'Sunny', issuesReported: '', materialsHighlight: '' })
    showMsg('Daily report saved!')
  }

  const handleAddTeamMember = async () => {
    if (!newMember.name || !newMember.role || !id) return
    const memberId = await addSiteTeamMember(id, newMember)
    setTeam((prev) => [...prev, { id: memberId, projectId: id, ...newMember }])
    setNewMember({ name: '', role: '', phone: '' })
    showMsg('Team member added!')
  }

  // ─── Existing functions ────────────────────────────────────────────
  const handleAddMilestone = async () => {
    if (!newMilestone.title || !id) return
    const mId = await addMilestone(id, newMilestone)
    setMilestones((m) => [...m, { ...newMilestone, id: mId, projectId: id }])
    setNewMilestone({ title: '', description: '', percentage: 0, status: 'pending', photos: [], sortOrder: 0 })
    showMsg('Milestone added!')
  }

  const handleMilestoneStatus = async (mId: string, status: MilestoneStatus) => {
    if (!id) return
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined
    await updateMilestone(id, mId, { status, ...(completedAt && { completedAt }) })
    setMilestones((m) => m.map((ms) => ms.id === mId ? { ...ms, status, completedAt } : ms))
    // Send milestone notification via API (keeps nodemailer server-side only)
    if (status === 'completed' && project?.clientId) {
      const milestone = milestones.find((m) => m.id === mId)
      if (milestone) {
        const completedCount = milestones.filter((m) => m.status === 'completed').length + 1
        const pct = Math.round((completedCount / milestones.length) * 100)
        fetch('/api/milestone-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: project.clientId, projectTitle: project.title, milestoneTitle: milestone.title, percentage: pct }),
        }).catch(() => {}) // fire-and-forget
      }
    }
    showMsg('Milestone updated!')
  }

  const handleAddDocument = async () => {
    if (!newDoc.name || !newDoc.url || !id) return
    const dId = await addDocument(id, newDoc)
    setDocuments((d) => [...d, { ...newDoc, id: dId, projectId: id }])
    setNewDoc({ name: '', type: 'estimate', url: '', isClientVisible: true, uploadedAt: new Date().toISOString() })
    showMsg('Document added!')
  }

  const handleToggleDocVisibility = async (dId: string, val: boolean) => {
    if (!id) return
    await updateDocument(id, dId, { isClientVisible: !val })
    setDocuments((d) => d.map((doc) => doc.id === dId ? { ...doc, isClientVisible: !val } : doc))
  }

  const handleAddPayment = async () => {
    if (!newPayment.description || !newPayment.amount || !project || !id) return
    const payId = await addPayment({ projectId: id, clientId: project.clientId ?? '', amount: newPayment.amount, description: newPayment.description, status: 'pending' as PaymentStatus, createdAt: new Date().toISOString() })
    setPayments((p) => [...p, { id: payId, projectId: id, clientId: project.clientId ?? '', ...newPayment, status: 'pending', createdAt: new Date().toISOString() }])
    setNewPayment({ description: '', amount: 0 })
    showMsg('Payment request created!')
  }

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !id) return
    const expId = await addProjectExpense(id, { ...newExpense, createdAt: new Date().toISOString() })
    setExpenses((prev) => [{ ...newExpense, id: expId, projectId: id, createdAt: new Date().toISOString() }, ...prev])
    setNewExpense({ category: 'Materials', description: '', amount: 0, date: new Date().toISOString().split('T')[0], addedBy: 'Admin' })
    showMsg('Expense logged!')
  }

  const handleAddVendor = async () => {
    if (!newVendor.name || !id) return
    const vendorId = await addProjectVendor(id, { ...newVendor, createdAt: new Date().toISOString() })
    setVendors((prev) => [...prev, { ...newVendor, id: vendorId, projectId: id, createdAt: new Date().toISOString() }])
    setNewVendor({ name: '', type: 'Material Supplier', phone: '', gstNumber: '', notes: '' })
    showMsg('Vendor added!')
  }

  const handleAddOrder = async () => {
    if (!newOrder.vendorId || !newOrder.description || !newOrder.amount || !id) return
    const vendor = vendors.find((v) => v.id === newOrder.vendorId)
    if (!vendor) return
    // 1. Create vendor order
    const orderId = await addVendorOrder(id, {
      ...newOrder, vendorName: vendor.name, status: 'pending', createdAt: new Date().toISOString(),
    })
    // 2. Auto-create project expense so profit dashboard updates
    const expCategory: ExpenseCategory = vendor.type === 'Labour Contractor' ? 'Labour' : vendor.type === 'Equipment Rental' ? 'Equipment' : vendor.type === 'Subcontractor' ? 'Subcontractor' : 'Materials'
    const expId = await addProjectExpense(id, {
      category: expCategory,
      description: `${vendor.name} — ${newOrder.description}${newOrder.invoiceNumber ? ` (Inv: ${newOrder.invoiceNumber})` : ''}`,
      amount: newOrder.amount,
      date: newOrder.date,
      addedBy: 'Auto (Vendor Order)',
      createdAt: new Date().toISOString(),
    })
    // 3. Link expense id to order
    await updateVendorOrder(id, orderId, { expenseId: expId })
    const order: VendorOrder = { ...newOrder, id: orderId, projectId: id, vendorName: vendor.name, status: 'pending', expenseId: expId, createdAt: new Date().toISOString() }
    setVendorOrders((prev) => [order, ...prev])
    setExpenses((prev) => [{ category: expCategory, description: `${vendor.name} — ${newOrder.description}`, amount: newOrder.amount, date: newOrder.date, addedBy: 'Auto (Vendor Order)', id: expId, projectId: id, createdAt: new Date().toISOString() }, ...prev])
    setNewOrder({ vendorId: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], invoiceNumber: '' })
    showMsg(`Order logged and expense deducted from profit automatically!`)
  }

  const handleMarkOrderPaid = async (order: VendorOrder) => {
    if (!id) return
    const paidAt = new Date().toISOString()
    await updateVendorOrder(id, order.id, { status: 'paid', paidAt })
    setVendorOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: 'paid', paidAt } : o))
    showMsg(`Payment to ${order.vendorName} marked as paid.`)
  }

  const handleMarkAsPaid = async (pay: Payment) => {
    setMarkingPayment(pay.id)
    const paidAt = new Date().toISOString()
    await (await import('@/lib/firestore')).updatePayment(pay.id, { status: 'paid', paidAt })
    setPayments((prev) => prev.map((p) => p.id === pay.id ? { ...p, status: 'paid', paidAt } : p))
    setMarkingPayment(null)
    showMsg('Payment marked as paid.')
  }

  const buildPayWhatsApp = (pay: Payment): string => {
    const c = clients.find((cl) => cl.uid === pay.clientId)
    if (!c) return '#'
    const amount = `₹${Number(pay.amount).toLocaleString('en-IN')}`
    const msg = `*Payment Receipt*\n\nDear ${c.name},\n\nWe confirm receipt of your payment:\n\n*Amount:* ${amount}\n*For:* ${pay.description}\n*Project:* ${project?.title ?? ''}\n*Date:* ${pay.paidAt ? new Date(pay.paidAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}\n\nThank you!\n— Kiriti Constructions & Developers`
    const phone = c.phone.replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  if (!project) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'images', label: 'Images', badge: project.images?.length || undefined },
    { key: 'materials', label: 'Materials', badge: materials.filter((m) => (m.totalInward - m.totalConsumed) < m.lowStockThreshold).length || undefined },
    { key: 'log-entry', label: 'Log Entry' },
    { key: 'transactions', label: 'Transactions', badge: transactions.length || undefined },
    { key: 'daily-report', label: 'Daily Report' },
    { key: 'team', label: 'Team', badge: team.length || undefined },
    { key: 'milestones', label: 'Milestones' },
    { key: 'documents', label: 'Documents' },
    { key: 'payments', label: 'Payments' },
    { key: 'expenses', label: 'Expenses', badge: expenses.length || undefined },
    { key: 'vendors', label: 'Vendors', badge: vendorOrders.filter((o) => o.status === 'pending').length || undefined },
  ]

  const totalInward = transactions.filter((t) => t.type === 'inward').reduce((s, t) => s + t.quantity, 0)
  const totalConsumed = transactions.filter((t) => t.type === 'consumed').reduce((s, t) => s + t.quantity, 0)
  const lowStockCount = materials.filter((m) => (m.totalInward - m.totalConsumed) < m.lowStockThreshold).length

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-muted hover:text-primary font-body text-sm mb-6 transition-colors"><FiArrowLeft size={14} /> Back to Projects</Link>
      <h1 className="font-display text-2xl text-dark font-bold mb-1">{project.title}</h1>
      <p className="font-body text-muted text-sm mb-4">{project.location} · {project.year} · <span className="capitalize">{project.status}</span></p>

      {message && <div className={`mb-4 rounded-xl px-4 py-3 font-body text-sm ${message.toLowerCase().includes('low stock') || message.toLowerCase().includes('error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>{message}</div>}

      {/* WhatsApp low-stock alerts */}
      {Object.entries(waLinks).filter(([k]) => k.startsWith('stock_')).map(([k, url]) => (
        <div key={k} className="mb-3 flex items-center justify-between gap-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-body text-sm text-red-700 flex items-center gap-2"><FiAlertTriangle size={14} /> Low stock alert sent by email. Notify via WhatsApp too?</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-body text-xs font-semibold bg-[#25D366] text-white px-3 py-1.5 rounded-lg whitespace-nowrap">
            <FaWhatsapp size={13} /> Send Alert
          </a>
        </div>
      ))}

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 rounded-xl font-body text-xs font-medium capitalize transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-dark hover:border-primary hover:text-primary'}`}>
            {tab.label.replace('-', ' ')}
            {tab.badge ? <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-white text-xs font-bold rounded-full flex items-center justify-center ${tab.key === 'materials' && lowStockCount > 0 ? 'bg-red-500' : 'bg-accent-dark'}`}>{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="admin-card text-center"><p className="font-display text-2xl text-dark font-bold">{milestones.filter((m) => m.status === 'completed').length}/{milestones.length}</p><p className="font-body text-xs text-muted">Milestones</p></div>
            <div className="admin-card text-center"><p className="font-display text-2xl text-dark font-bold">{team.length}</p><p className="font-body text-xs text-muted">Team Members</p></div>
            <div className={`admin-card text-center ${lowStockCount > 0 ? 'border-red-200 bg-red-50' : ''}`}><p className={`font-display text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-dark'}`}>{lowStockCount}</p><p className="font-body text-xs text-muted">Low Stock Items</p></div>
            <div className="admin-card text-center"><p className="font-display text-2xl text-dark font-bold">{dailyReports.length}</p><p className="font-body text-xs text-muted">Daily Reports</p></div>
          </div>
          {project.totalValue && (
            <div className="admin-card">
              <div className="flex justify-between mb-2 font-body text-sm"><span className="text-muted">Payment Progress</span><span className="font-semibold text-dark">{Math.round(((project.paidAmount ?? 0) / project.totalValue) * 100)}%</span></div>
              <div className="progress-bar"><div className="progress-fill bg-green-500" style={{ width: `${Math.round(((project.paidAmount ?? 0) / project.totalValue) * 100)}%` }} /></div>
              <p className="font-body text-xs text-muted mt-1">₹{((project.paidAmount ?? 0) / 100000).toFixed(1)}L paid of ₹{(project.totalValue / 100000).toFixed(1)}L</p>
            </div>
          )}
          {dailyReports.length > 0 && (
            <div className="admin-card">
              <h3 className="font-display text-lg text-dark font-bold mb-3">Latest Daily Report</h3>
              <div className="p-4 bg-slate rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body font-medium text-dark text-sm">{dailyReports[0].date}</span>
                  <span className="font-body text-xs text-muted">{dailyReports[0].weatherCondition} · {dailyReports[0].laborCount} workers</span>
                </div>
                <p className="font-body text-sm text-muted">{dailyReports[0].workDone}</p>
                {dailyReports[0].issuesReported && <p className="font-body text-xs text-red-500 mt-1">Issue: {dailyReports[0].issuesReported}</p>}
              </div>
            </div>
          )}

          {/* ─── Project Settings (assign client, status, value) ─── */}
          <div className="admin-card">
            <h3 className="font-display text-lg text-dark font-bold mb-4">Project Settings</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Assign Client */}
              <div>
                <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Assigned Client</label>
                <select
                  value={project.clientId ?? ''}
                  onChange={async (e) => {
                    const clientId = e.target.value
                    setProject((p) => p ? { ...p, clientId } : p)
                    if (id) {
                      const { updateProject } = await import('@/lib/firestore')
                      await updateProject(id, { clientId })
                    }
                    showMsg('Client assigned!')
                  }}
                  className="input-field"
                >
                  <option value="">— No client assigned —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.uid}>{c.name} · {c.phone}</option>
                  ))}
                </select>
                {project.clientId && (
                  <p className="font-body text-xs text-green-600 mt-1.5">
                    Client portal active — client can view milestones, documents & payments.
                  </p>
                )}
                {!project.clientId && (
                  <p className="font-body text-xs text-muted mt-1.5">
                    Select a client to give them portal access to this project.
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Project Status</label>
                <select
                  value={project.status}
                  onChange={async (e) => {
                    const status = e.target.value as typeof project.status
                    setProject((p) => p ? { ...p, status } : p)
                    if (id) {
                      const { updateProject } = await import('@/lib/firestore')
                      await updateProject(id, { status })
                    }
                    showMsg('Status updated!')
                  }}
                  className="input-field capitalize"
                >
                  {(['planning', 'ongoing', 'completed', 'on-hold'] as const).map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>

              {/* Total Value */}
              <div>
                <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Contract Value (₹)</label>
                <input
                  type="number"
                  value={project.totalValue ?? ''}
                  onChange={(e) => setProject((p) => p ? { ...p, totalValue: Number(e.target.value) } : p)}
                  onBlur={async (e) => {
                    if (id) {
                      const { updateProject } = await import('@/lib/firestore')
                      await updateProject(id, { totalValue: Number(e.target.value) })
                      showMsg('Contract value saved!')
                    }
                  }}
                  placeholder="e.g. 4500000"
                  className="input-field"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={project.startDate ?? ''}
                  onChange={(e) => setProject((p) => p ? { ...p, startDate: e.target.value } : p)}
                  onBlur={async (e) => {
                    if (id) {
                      const { updateProject } = await import('@/lib/firestore')
                      await updateProject(id, { startDate: e.target.value })
                      showMsg('Start date saved!')
                    }
                  }}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMAGES ─── */}
      {activeTab === 'images' && (
        <div className="admin-card">
          <h2 className="font-display text-lg text-dark font-bold mb-2">Project Images</h2>
          <p className="font-body text-xs text-muted mb-5">Upload photos of the project. The first image is the cover shown on the website. Hover over any image to set it as cover or remove it.</p>
          <ImageUpload
            folder={`projects/${id}`}
            value={project.images ?? []}
            onChange={async (urls) => {
              const updated = { images: urls, coverImage: urls[0] ?? '' }
              setProject((p) => p ? { ...p, ...updated } : p)
              if (id) await (await import('@/lib/firestore')).updateProject(id, updated)
            }}
            maxImages={12}
            label="Project Gallery"
          />
          {project.coverImage && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="font-body text-xs text-muted uppercase tracking-wider mb-2">Current Cover Image</p>
              <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-accent">
                <img src={project.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 bg-accent text-dark text-xs font-bold px-2 py-0.5 rounded-lg">Cover</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MATERIALS ─── */}
      {activeTab === 'materials' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-dark font-bold">Material Inventory</h2>
              <p className="font-body text-xs text-muted mt-0.5">Current stock levels per material. Balance = Total Inward − Total Consumed.</p>
            </div>
            {materials.length === 0 && (
              <button onClick={initDefaultMaterials} className="btn-accent text-xs gap-2"><FiPlus size={13} /> Add Default Materials</button>
            )}
          </div>

          {/* Low stock alerts */}
          {materials.filter((m) => (m.totalInward - m.totalConsumed) < m.lowStockThreshold).map((m) => {
            const balance = m.totalInward - m.totalConsumed
            return (
              <div key={m.id} className="flex items-center justify-between gap-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-body text-sm text-red-700 flex items-center gap-2"><FiAlertTriangle size={14} /> <strong>{m.name}</strong> — Balance: {balance} {m.unit} (threshold: {m.lowStockThreshold})</p>
                {waLinks[`stock_${m.id}`] && (
                  <a href={waLinks[`stock_${m.id}`]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-body text-xs font-semibold bg-[#25D366] text-white px-3 py-1.5 rounded-lg whitespace-nowrap"><FaWhatsapp size={12} /> Alert WhatsApp</a>
                )}
              </div>
            )
          })}

          {/* Materials table */}
          <div className="admin-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-body font-semibold text-dark py-3 pr-4">Material</th>
                  <th className="text-left font-body font-semibold text-dark py-3 pr-4">Category</th>
                  <th className="text-right font-body font-semibold text-green-600 py-3 pr-4">Inward</th>
                  <th className="text-right font-body font-semibold text-red-500 py-3 pr-4">Consumed</th>
                  <th className="text-right font-body font-semibold text-dark py-3 pr-4">Balance</th>
                  <th className="text-right font-body font-semibold text-muted py-3 pr-4">Threshold</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const balance = m.totalInward - m.totalConsumed
                  const isLow = balance < m.lowStockThreshold
                  return (
                    <tr key={m.id} className={`border-b border-gray-50 ${isLow ? 'bg-red-50/50' : ''}`}>
                      <td className="py-3 pr-4">
                        <p className="font-body font-medium text-dark">{m.name}</p>
                        <p className="font-body text-xs text-muted">{m.unit}</p>
                      </td>
                      <td className="py-3 pr-4"><span className="badge-category">{m.category}</span></td>
                      <td className="py-3 pr-4 text-right font-body text-green-600 font-semibold">{m.totalInward}</td>
                      <td className="py-3 pr-4 text-right font-body text-red-500 font-semibold">{m.totalConsumed}</td>
                      <td className={`py-3 pr-4 text-right font-display text-lg font-bold ${isLow ? 'text-red-600' : 'text-dark'}`}>{balance} {isLow && <FiAlertTriangle className="inline ml-1 text-red-500" size={14} />}</td>
                      <td className="py-3 pr-4 text-right font-body text-xs text-muted">{m.lowStockThreshold}</td>
                      <td className="py-3">
                        <button onClick={() => handleDeleteMaterial(m.id)} className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><FiTrash2 size={12} /></button>
                      </td>
                    </tr>
                  )
                })}
                {materials.length === 0 && <tr><td colSpan={7} className="py-8 text-center font-body text-muted text-sm">No materials yet. Click "Add Default Materials" or add manually below.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Add custom material */}
          <div className="admin-card">
            <h3 className="font-display text-lg text-dark font-bold mb-4">Add Material</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Material Name *</label><input value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="e.g. Cement 53 Grade" className="input-field" /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Unit *</label>
                <select value={newMaterial.unit} onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })} className="input-field">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Category</label>
                <select value={newMaterial.category} onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as MaterialCategory })} className="input-field">
                  {MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Low Stock Alert When Below</label><input type="number" value={newMaterial.lowStockThreshold} onChange={(e) => setNewMaterial({ ...newMaterial, lowStockThreshold: Number(e.target.value) })} className="input-field" /></div>
            </div>
            <button onClick={handleAddMaterial} className="btn-primary mt-4 gap-2"><FiPlus size={14} /> Add Material</button>
          </div>
        </div>
      )}

      {/* ─── LOG ENTRY ─── */}
      {activeTab === 'log-entry' && (
        <div className="admin-card max-w-lg">
          <h2 className="font-display text-lg text-dark font-bold mb-2">Log Material Entry</h2>
          <p className="font-body text-xs text-muted mb-5">Record materials received (inward) or used on site (consumed).</p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Material *</label>
              <select value={newEntry.materialId} onChange={(e) => setNewEntry({ ...newEntry, materialId: e.target.value })} className="input-field">
                <option value="">Select material...</option>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit}) — Balance: {m.totalInward - m.totalConsumed}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Type *</label>
              <div className="flex gap-3">
                <button onClick={() => setNewEntry({ ...newEntry, type: 'inward' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm font-medium border-2 transition-all ${newEntry.type === 'inward' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-dark hover:border-green-400'}`}>
                  <FiArrowDown size={16} /> Inward (Received)
                </button>
                <button onClick={() => setNewEntry({ ...newEntry, type: 'consumed' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm font-medium border-2 transition-all ${newEntry.type === 'consumed' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-dark hover:border-red-400'}`}>
                  <FiArrowUp size={16} /> Consumed (Used)
                </button>
              </div>
            </div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Quantity *</label><input type="number" min={0} value={newEntry.quantity} onChange={(e) => setNewEntry({ ...newEntry, quantity: Number(e.target.value) })} className="input-field" placeholder="e.g. 50" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Date *</label><input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Logged By</label><input value={newEntry.supervisorName} onChange={(e) => setNewEntry({ ...newEntry, supervisorName: e.target.value })} className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Notes (Optional)</label><textarea value={newEntry.notes} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })} rows={2} className="input-field resize-none" placeholder="Vehicle no., supplier name, challan no., etc." /></div>
            {id && newEntry.materialId && (
              <PhotoUpload
                projectId={id}
                materialName={materials.find((m) => m.id === newEntry.materialId)?.name ?? 'material'}
                onUploaded={(urls) => setNewEntry((prev) => ({ ...prev, photos: urls }))}
                maxPhotos={3}
              />
            )}
            <button onClick={handleLogEntry} className="btn-primary w-full justify-center gap-2 py-3.5">
              <FiCheckCircle size={16} /> Log Entry
            </button>
          </div>
          {newEntry.materialId && (
            <div className="mt-4 p-3 bg-slate rounded-xl border border-gray-100 font-body text-sm">
              {(() => { const m = materials.find((mt) => mt.id === newEntry.materialId); return m ? <span>Current balance: <strong>{m.totalInward - m.totalConsumed} {m.unit}</strong> · Alert when below: <strong>{m.lowStockThreshold}</strong></span> : null })()}
            </div>
          )}
        </div>
      )}

      {/* ─── TRANSACTIONS ─── */}
      {activeTab === 'transactions' && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-dark font-bold">Transaction History</h2>
            <div className="flex gap-4 font-body text-sm">
              <span className="text-green-600 font-semibold">{transactions.filter((t) => t.type === 'inward').length} Inward</span>
              <span className="text-red-500 font-semibold">{transactions.filter((t) => t.type === 'consumed').length} Consumed</span>
            </div>
          </div>
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 p-3 bg-slate rounded-xl border border-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === 'inward' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {t.type === 'inward' ? <FiArrowDown className="text-green-600" size={14} /> : <FiArrowUp className="text-red-500" size={14} />}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-dark">{t.materialName}</p>
                    <p className="font-body text-xs text-muted">{t.date} · {t.supervisorName}{t.notes ? ` · ${t.notes}` : ''}</p>
                    {t.photos && t.photos.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5">
                        {t.photos.map((url, pi) => (
                          <a key={pi} href={url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 hover:opacity-80 transition-opacity">
                            <img src={url} alt={`Proof ${pi + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`font-display text-lg font-bold ${t.type === 'inward' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'inward' ? '+' : '-'}{t.quantity} {t.unit}
                  </span>
                  <button onClick={() => handleDeleteTransaction(t)} className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><FiTrash2 size={12} /></button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-center font-body text-muted py-8 text-sm">No transactions yet. Use Log Entry to record material movements.</p>}
          </div>
        </div>
      )}

      {/* ─── DAILY REPORT ─── */}
      {activeTab === 'daily-report' && (
        <div className="space-y-5">
          <div className="admin-card max-w-xl">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Submit Daily Report</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Date *</label><input type="date" value={newReport.date} onChange={(e) => setNewReport({ ...newReport, date: e.target.value })} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Supervisor</label><input value={newReport.supervisorName} onChange={(e) => setNewReport({ ...newReport, supervisorName: e.target.value })} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Labour Count</label><input type="number" min={0} value={newReport.laborCount} onChange={(e) => setNewReport({ ...newReport, laborCount: Number(e.target.value) })} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Weather</label>
                  <select value={newReport.weatherCondition} onChange={(e) => setNewReport({ ...newReport, weatherCondition: e.target.value as WeatherCondition })} className="input-field">
                    {WEATHER_OPTIONS.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Work Done Today *</label><textarea value={newReport.workDone} onChange={(e) => setNewReport({ ...newReport, workDone: e.target.value })} rows={3} className="input-field resize-none" placeholder="e.g. Completed 2nd floor slab shuttering, started beam reinforcement..." /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Materials Used (Summary)</label><textarea value={newReport.materialsHighlight} onChange={(e) => setNewReport({ ...newReport, materialsHighlight: e.target.value })} rows={2} className="input-field resize-none" placeholder="e.g. Used 30 bags cement, 2 loads sand, 150kg steel..." /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Issues / Remarks</label><textarea value={newReport.issuesReported} onChange={(e) => setNewReport({ ...newReport, issuesReported: e.target.value })} rows={2} className="input-field resize-none" placeholder="Any delays, safety incidents, or site issues..." /></div>
              <button onClick={handleAddDailyReport} className="btn-primary w-full justify-center gap-2 py-3.5"><FiCheckCircle size={16} /> Save Report</button>
            </div>
          </div>

          {/* Past reports */}
          <div className="admin-card">
            <h3 className="font-display text-lg text-dark font-bold mb-4">Past Reports ({dailyReports.length})</h3>
            <div className="space-y-3">
              {dailyReports.map((r) => (
                <div key={r.id} className="p-4 bg-slate rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-body font-semibold text-dark text-sm">{r.date}</span>
                      <span className="font-body text-xs text-muted">{r.weatherCondition}</span>
                      <span className="font-body text-xs text-muted">{r.laborCount} workers</span>
                      <span className="font-body text-xs text-muted">by {r.supervisorName}</span>
                    </div>
                  </div>
                  <p className="font-body text-sm text-dark mb-1">{r.workDone}</p>
                  {r.materialsHighlight && <p className="font-body text-xs text-muted">{r.materialsHighlight}</p>}
                  {r.issuesReported && <p className="font-body text-xs text-red-500 mt-1">Issue: {r.issuesReported}</p>}
                </div>
              ))}
              {dailyReports.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No daily reports yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── TEAM ─── */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          <div className="admin-card">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Add Team Member</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Name *</label><input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="input-field" /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Role *</label><input value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} placeholder="Site Engineer, Mason, Foreman..." className="input-field" /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Phone</label><input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} className="input-field" /></div>
            </div>
            <button onClick={handleAddTeamMember} className="btn-primary mt-4 gap-2"><FiPlus size={14} /> Add Member</button>
          </div>
          <div className="admin-card">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Site Team ({team.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((m) => (
                <div key={m.id} className="p-4 bg-slate rounded-xl border border-gray-100 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-semibold text-dark text-sm">{m.name}</p>
                    <p className="font-body text-xs text-accent-dark font-medium">{m.role}</p>
                    {m.phone && <p className="font-body text-xs text-muted mt-0.5">{m.phone}</p>}
                  </div>
                  <button onClick={async () => { if (!id || !confirm('Remove?')) return; await deleteSiteTeamMember(id, m.id); setTeam((t) => t.filter((x) => x.id !== m.id)) }} className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"><FiTrash2 size={12} /></button>
                </div>
              ))}
              {team.length === 0 && <p className="col-span-full text-center font-body text-muted py-6 text-sm">No team members yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── MILESTONES ─── */}
      {activeTab === 'milestones' && (
        <div className="space-y-5">
          <div className="admin-card">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Add Milestone</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Title *</label><input value={newMilestone.title} onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })} placeholder="e.g. Foundation Complete" className="input-field" /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Percentage (%)</label><input type="number" min={0} max={100} value={newMilestone.percentage} onChange={(e) => setNewMilestone({ ...newMilestone, percentage: Number(e.target.value) })} className="input-field" /></div>
              <div className="md:col-span-2"><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Description</label><input value={newMilestone.description} onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })} className="input-field" /></div>
            </div>
            <button onClick={handleAddMilestone} className="btn-primary mt-4 gap-2"><FiPlus /> Add Milestone</button>
          </div>
          <div className="admin-card space-y-3">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Milestones ({milestones.length})</h2>
            {milestones.map((m) => (
              <div key={m.id} className="p-4 bg-slate rounded-xl border border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-body font-semibold text-dark text-sm">{m.title}</span>
                      <span className="font-body text-xs text-muted">{m.percentage}%</span>
                      <span className={`badge capitalize ${m.status === 'completed' ? 'badge-green' : m.status === 'in-progress' ? 'badge-accent' : 'badge-gray'}`}>{m.status}</span>
                    </div>
                    {m.completedAt && <p className="font-body text-xs text-green-600">Completed: {new Date(m.completedAt).toLocaleDateString('en-IN')}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {MILESTONE_STATUSES.map((s) => (
                        <button key={s} onClick={() => handleMilestoneStatus(m.id, s)}
                          className={`px-2.5 py-1 rounded-lg font-body text-xs capitalize transition-colors ${m.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={async () => { if (!id || !confirm('Delete?')) return; await deleteMilestone(id, m.id); setMilestones((ms) => ms.filter((x) => x.id !== m.id)) }} className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"><FiTrash2 size={14} /></button>
                </div>
                {/* Milestone Photos */}
                <div className="mt-2">
                  <ImageUpload
                    folder={`milestones/${id}/${m.id}`}
                    value={m.photos ?? []}
                    onChange={async (urls) => {
                      if (!id) return
                      await updateMilestone(id, m.id, { photos: urls })
                      setMilestones((prev) => prev.map((ms) => ms.id === m.id ? { ...ms, photos: urls } : ms))
                    }}
                    maxImages={6}
                    label="Site Photos"
                  />
                </div>
              </div>
            ))}
            {milestones.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No milestones yet.</p>}
          </div>
        </div>
      )}

      {/* ─── DOCUMENTS ─── */}
      {activeTab === 'documents' && (
        <div className="space-y-5">
          <div className="admin-card">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Upload Document</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Document Name *</label><input value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} className="input-field" /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Type</label><select value={newDoc.type} onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as DocumentType })} className="input-field">{DOC_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}</select></div>
              <div className="md:col-span-2"><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">File URL</label><input value={newDoc.url} onChange={(e) => setNewDoc({ ...newDoc, url: e.target.value })} placeholder="https://firebasestorage..." className="input-field" /></div>
              <div className="flex items-center gap-3"><input type="checkbox" checked={newDoc.isClientVisible} onChange={(e) => setNewDoc({ ...newDoc, isClientVisible: e.target.checked })} className="w-4 h-4 accent-primary" /><label className="font-body text-sm text-dark">Visible to client</label></div>
            </div>
            <button onClick={handleAddDocument} className="btn-primary mt-4 gap-2"><FiPlus /> Add Document</button>
          </div>
          <div className="admin-card space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                <div><p className="font-body text-sm font-semibold text-dark">{doc.name}</p><p className="font-body text-xs text-muted capitalize">{doc.type} · {doc.isClientVisible ? 'Visible to client' : 'Admin only'}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleDocVisibility(doc.id, doc.isClientVisible)} className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${doc.isClientVisible ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-muted'}`}>{doc.isClientVisible ? 'Visible' : 'Hidden'}</button>
                  <button onClick={async () => { if (!id || !confirm('Delete?')) return; await deleteDocument(id, doc.id); setDocuments((d) => d.filter((x) => x.id !== doc.id)) }} className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors"><FiTrash2 size={14} /></button>
                </div>
              </div>
            ))}
            {documents.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No documents yet.</p>}
          </div>
        </div>
      )}

      {/* ─── PAYMENTS ─── */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          <div className="admin-card">
            <h2 className="font-display text-lg text-dark font-bold mb-4">Create Payment Request</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Description *</label><input value={newPayment.description} onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })} placeholder="e.g. 2nd Floor Slab Payment" className="input-field" /></div>
              <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Amount (₹) *</label><input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })} className="input-field" /></div>
            </div>
            <button onClick={handleAddPayment} className="btn-primary mt-4 gap-2"><FiPlus /> Create Request</button>
          </div>
          <div className="admin-card space-y-3">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
                <div>
                  <p className="font-body text-sm font-semibold text-dark">{pay.description}</p>
                  <p className="font-body text-xs text-muted">{new Date(pay.createdAt).toLocaleDateString('en-IN')}</p>
                  {pay.status === 'paid' && pay.paidAt && <p className="font-body text-xs text-green-600">Paid on {new Date(pay.paidAt).toLocaleDateString('en-IN')}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="font-display text-lg font-bold text-dark">₹{Number(pay.amount).toLocaleString('en-IN')}</p>
                  {pay.status === 'pending' && (
                    <button onClick={() => handleMarkAsPaid(pay)} disabled={markingPayment === pay.id}
                      className="flex items-center gap-1.5 font-body text-sm font-semibold bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60">
                      <FiCheckCircle size={13} />{markingPayment === pay.id ? 'Saving...' : 'Mark as Paid'}
                    </button>
                  )}
                  {pay.status === 'paid' && (
                    <a href={buildPayWhatsApp(pay)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-body text-sm font-semibold bg-[#25D366] text-white px-3 py-2 rounded-lg hover:bg-[#1ebe59] transition-colors">
                      <FaWhatsapp size={14} /> Share Receipt
                    </a>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No payments yet.</p>}
          </div>
        </div>
      )}

      {/* ─── VENDORS ─── */}
      {activeTab === 'vendors' && (() => {
        const VENDOR_TYPES: VendorType[] = ['Material Supplier', 'Subcontractor', 'Labour Contractor', 'Equipment Rental', 'Other']
        const TYPE_COLORS: Record<VendorType, string> = {
          'Material Supplier': 'bg-blue-100 text-blue-700',
          'Subcontractor': 'bg-purple-100 text-purple-700',
          'Labour Contractor': 'bg-green-100 text-green-700',
          'Equipment Rental': 'bg-orange-100 text-orange-700',
          'Other': 'bg-gray-100 text-muted',
        }
        const totalPending = vendorOrders.filter((o) => o.status === 'pending').reduce((s, o) => s + o.amount, 0)
        const totalPaid = vendorOrders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount, 0)

        return (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="admin-card text-center">
                <p className="font-display text-xl text-dark font-bold">{vendors.length}</p>
                <p className="font-body text-xs text-muted">Vendors</p>
              </div>
              <div className={`admin-card text-center ${totalPending > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
                <p className={`font-display text-xl font-bold ${totalPending > 0 ? 'text-amber-600' : 'text-dark'}`}>₹{totalPending.toLocaleString('en-IN')}</p>
                <p className="font-body text-xs text-muted">Pending Payment</p>
              </div>
              <div className="admin-card text-center">
                <p className="font-display text-xl text-green-600 font-bold">₹{totalPaid.toLocaleString('en-IN')}</p>
                <p className="font-body text-xs text-muted">Paid to Vendors</p>
              </div>
            </div>

            {/* Add Vendor */}
            <div className="admin-card">
              <h3 className="font-display text-lg text-dark font-bold mb-4">Add Vendor / Supplier</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Name *</label><input value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} placeholder="e.g. Ramesh Steel Traders" className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Type</label>
                  <select value={newVendor.type} onChange={(e) => setNewVendor({ ...newVendor, type: e.target.value as VendorType })} className="input-field">
                    {VENDOR_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Phone</label><input value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} className="input-field" /></div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">GST Number</label><input value={newVendor.gstNumber} onChange={(e) => setNewVendor({ ...newVendor, gstNumber: e.target.value })} placeholder="27XXXXX" className="input-field" /></div>
              </div>
              <button onClick={handleAddVendor} className="btn-primary mt-4 gap-2"><FiPlus size={14} /> Add Vendor</button>
            </div>

            {/* Vendor list */}
            {vendors.length > 0 && (
              <div className="admin-card">
                <h3 className="font-display text-base text-dark font-bold mb-3">Vendors ({vendors.length})</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {vendors.map((v) => {
                    const vOrders = vendorOrders.filter((o) => o.vendorId === v.id)
                    const vPending = vOrders.filter((o) => o.status === 'pending').reduce((s, o) => s + o.amount, 0)
                    return (
                      <div key={v.id} className={`p-3 rounded-xl border ${vPending > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-slate'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-body font-semibold text-dark text-sm truncate">{v.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`font-body text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[v.type]}`}>{v.type}</span>
                              {v.phone && <span className="font-body text-xs text-muted">{v.phone}</span>}
                            </div>
                            {vPending > 0 && <p className="font-body text-xs text-amber-600 font-semibold mt-1">Due: ₹{vPending.toLocaleString('en-IN')}</p>}
                          </div>
                          <button onClick={async () => { if (!id || !confirm('Remove vendor?')) return; await deleteProjectVendor(id, v.id); setVendors((prev) => prev.filter((x) => x.id !== v.id)) }} className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 flex-shrink-0"><FiTrash2 size={12} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Place Order */}
            {vendors.length > 0 && (
              <div className="admin-card">
                <h3 className="font-display text-lg text-dark font-bold mb-2">Place Order / Log Bill</h3>
                <p className="font-body text-xs text-muted mb-4">Adding an order automatically deducts from the project profit.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Vendor *</label>
                    <select value={newOrder.vendorId} onChange={(e) => setNewOrder({ ...newOrder, vendorId: e.target.value })} className="input-field">
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                    </select>
                  </div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Description *</label><input value={newOrder.description} onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })} placeholder="e.g. 200 bags cement, 2 loads sand" className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Amount (₹) *</label><input type="number" min={0} value={newOrder.amount || ''} onChange={(e) => setNewOrder({ ...newOrder, amount: Number(e.target.value) })} placeholder="e.g. 76000" className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Date</label><input type="date" value={newOrder.date} onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })} className="input-field" /></div>
                  <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Invoice / Challan No.</label><input value={newOrder.invoiceNumber} onChange={(e) => setNewOrder({ ...newOrder, invoiceNumber: e.target.value })} placeholder="e.g. INV-2025-042" className="input-field" /></div>
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl font-body text-xs text-amber-700">
                  This order will be automatically added as a project expense — profit dashboard will update instantly.
                </div>
                <button onClick={handleAddOrder} className="btn-primary mt-4 gap-2"><FiPlus size={14} /> Log Order &amp; Deduct from Profit</button>
              </div>
            )}

            {/* Orders list */}
            <div className="admin-card space-y-2">
              <h3 className="font-display text-lg text-dark font-bold mb-4">All Orders ({vendorOrders.length})</h3>
              {vendorOrders.map((order) => (
                <div key={order.id} className={`p-3 rounded-xl border ${order.status === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-slate border-gray-50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-dark">{order.vendorName}</p>
                      <p className="font-body text-xs text-muted">{order.description}</p>
                      <p className="font-body text-xs text-muted">{order.date}{order.invoiceNumber ? ` · Inv: ${order.invoiceNumber}` : ''}</p>
                      {order.status === 'paid' && order.paidAt && <p className="font-body text-xs text-green-600">Paid: {new Date(order.paidAt).toLocaleDateString('en-IN')}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className="font-display text-base font-bold text-dark">₹{order.amount.toLocaleString('en-IN')}</p>
                      {order.status === 'pending' ? (
                        <button onClick={() => handleMarkOrderPaid(order)} className="font-body text-xs font-semibold bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1">
                          <FiCheckCircle size={11} /> Mark Paid
                        </button>
                      ) : (
                        <span className="font-body text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">Paid</span>
                      )}
                      <button onClick={async () => {
                        if (!id || !confirm('Delete order?')) return
                        await deleteVendorOrder(id, order.id)
                        // also remove linked expense
                        if (order.expenseId) { await (await import('@/lib/firestore')).deleteProjectExpense(id, order.expenseId); setExpenses((prev) => prev.filter((e) => e.id !== order.expenseId)) }
                        setVendorOrders((prev) => prev.filter((o) => o.id !== order.id))
                        showMsg('Order and linked expense deleted.')
                      }} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><FiTrash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {vendorOrders.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No orders yet. Add vendors above and place orders.</p>}
            </div>
          </div>
        )
      })()}

      {/* ─── EXPENSES ─── */}
      {activeTab === 'expenses' && (() => {
        const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Materials', 'Labour', 'Equipment', 'Subcontractor', 'Misc']
        const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
          Materials: 'bg-blue-100 text-blue-700',
          Labour: 'bg-purple-100 text-purple-700',
          Equipment: 'bg-orange-100 text-orange-700',
          Subcontractor: 'bg-teal-100 text-teal-700',
          Misc: 'bg-gray-100 text-muted',
        }
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
        const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
          cat,
          total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
        })).filter((c) => c.total > 0)
        const contractValue = project.totalValue ?? 0
        const margin = contractValue - totalExpenses
        const marginPct = contractValue > 0 ? Math.round((margin / contractValue) * 100) : 0

        return (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="admin-card text-center">
                <p className="font-display text-xl text-dark font-bold">₹{contractValue.toLocaleString('en-IN')}</p>
                <p className="font-body text-xs text-muted mt-0.5">Contract Value</p>
              </div>
              <div className="admin-card text-center">
                <p className="font-display text-xl text-red-500 font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
                <p className="font-body text-xs text-muted mt-0.5">Total Expenses</p>
              </div>
              <div className={`admin-card text-center ${margin < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <p className={`font-display text-xl font-bold ${margin < 0 ? 'text-red-600' : 'text-green-600'}`}>₹{Math.abs(margin).toLocaleString('en-IN')}</p>
                <p className="font-body text-xs text-muted mt-0.5">{margin < 0 ? 'Loss' : 'Gross Margin'}</p>
              </div>
              <div className={`admin-card text-center ${marginPct < 0 ? 'border-red-200 bg-red-50' : ''}`}>
                <p className={`font-display text-xl font-bold ${marginPct < 0 ? 'text-red-600' : marginPct < 15 ? 'text-amber-600' : 'text-green-600'}`}>{marginPct}%</p>
                <p className="font-body text-xs text-muted mt-0.5">Margin %</p>
              </div>
            </div>

            {/* Category breakdown */}
            {byCategory.length > 0 && (
              <div className="admin-card">
                <h3 className="font-display text-sm text-dark font-bold mb-3">Expense Breakdown</h3>
                <div className="space-y-2">
                  {byCategory.map(({ cat, total }) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full w-28 text-center flex-shrink-0 ${CATEGORY_COLORS[cat]}`}>{cat}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${totalExpenses > 0 ? (total / totalExpenses) * 100 : 0}%` }} />
                      </div>
                      <span className="font-body text-sm font-semibold text-dark flex-shrink-0">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add expense form */}
            <div className="admin-card">
              <h2 className="font-display text-lg text-dark font-bold mb-4">Log Expense</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Category *</label>
                  <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })} className="input-field">
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Description *</label>
                  <input value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="e.g. Cement 200 bags — Ramesh Suppliers" className="input-field" />
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Amount (₹) *</label>
                  <input type="number" min={0} value={newExpense.amount || ''} onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} className="input-field" placeholder="e.g. 76000" />
                </div>
                <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="input-field" />
                </div>
              </div>
              <button onClick={handleAddExpense} className="btn-primary mt-4 gap-2"><FiPlus size={14} /> Log Expense</button>
            </div>

            {/* Expense list */}
            <div className="admin-card space-y-2">
              <h3 className="font-display text-lg text-dark font-bold mb-4">All Expenses ({expenses.length})</h3>
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between gap-4 p-3 bg-slate rounded-xl border border-gray-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${CATEGORY_COLORS[exp.category]}`}>{exp.category}</span>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-dark truncate">{exp.description}</p>
                      <p className="font-body text-xs text-muted">{exp.date} · {exp.addedBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-display text-base font-bold text-dark">₹{exp.amount.toLocaleString('en-IN')}</p>
                    <button onClick={async () => { if (!id || !confirm('Delete?')) return; await deleteProjectExpense(id, exp.id); setExpenses((prev) => prev.filter((e) => e.id !== exp.id)) }} className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><FiTrash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && <p className="text-center font-body text-muted py-6 text-sm">No expenses logged yet.</p>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
