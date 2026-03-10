'use client'
import { useEffect, useState } from 'react'
import { getAllQuotes, addQuote, updateQuote, deleteQuote } from '@/lib/firestore'
import type { Quote, QuoteLineItem, QuoteStatus } from '@/types'
import { FiPlus, FiTrash2, FiDownload, FiEdit2, FiSend, FiCopy, FiX } from 'react-icons/fi'
import { generateQuotePDF } from '@/lib/generateQuotePDF'
import { DEFAULT_COMPANY } from '@/types'
import { getCompanyInfo } from '@/lib/firestore'
import type { CompanyInfo } from '@/types'

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'badge-gray', sent: 'badge-blue', accepted: 'badge-green', rejected: 'badge-red',
}

const EMPTY_ITEM: QuoteLineItem = { description: '', unit: 'sqft', quantity: 0, rate: 0, amount: 0 }

const UNITS = ['sqft', 'sqm', 'nos', 'RMT', 'cubic meters', 'bags', 'kg', 'tons', 'loads', 'lumpsum', 'months']

const DEFAULT_TERMS = `1. This quotation is valid for 30 days from the date of issue.
2. 30% advance payment required to commence work.
3. Balance payments as per milestones agreed.
4. All materials used will be ISI-marked / approved brands.
5. Any changes in scope will be quoted separately.
6. Disputes subject to Hyderabad jurisdiction.`

function calcItem(item: QuoteLineItem): QuoteLineItem {
  return { ...item, amount: parseFloat((item.quantity * item.rate).toFixed(2)) }
}

function nextQuoteNumber(existing: Quote[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .map((q) => parseInt(q.quoteNumber.split('/').pop() ?? '0'))
    .filter((n) => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `KCD/${year}/${String(next).padStart(3, '0')}`
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const emptyForm = (): Omit<Quote, 'id'> => ({
    quoteNumber: nextQuoteNumber(quotes),
    projectTitle: '', siteAddress: '', clientName: '', clientPhone: '', clientEmail: '',
    items: [{ ...EMPTY_ITEM }],
    subtotal: 0, gstPercent: 18, gstAmount: 0, totalAmount: 0,
    validityDays: 30, notes: '', terms: DEFAULT_TERMS,
    status: 'draft', createdAt: new Date().toISOString(),
  })

  const [form, setForm] = useState<Omit<Quote, 'id'>>(emptyForm())

  useEffect(() => {
    Promise.all([getAllQuotes(), getCompanyInfo()]).then(([q, c]) => {
      setQuotes(q); if (c) setCompany(c)
    })
  }, [])

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  const recalc = (items: QuoteLineItem[], gstPercent: number) => {
    const subtotal = items.reduce((s, i) => s + i.amount, 0)
    const gstAmount = parseFloat(((subtotal * gstPercent) / 100).toFixed(2))
    return { subtotal, gstAmount, totalAmount: parseFloat((subtotal + gstAmount).toFixed(2)) }
  }

  const setItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
    const updated = form.items.map((item, i) => {
      if (i !== index) return item
      const newItem = { ...item, [field]: value }
      return calcItem(newItem)
    })
    const totals = recalc(updated, form.gstPercent)
    setForm((f) => ({ ...f, items: updated, ...totals }))
  }

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))

  const removeItem = (i: number) => {
    const updated = form.items.filter((_, idx) => idx !== i)
    const totals = recalc(updated, form.gstPercent)
    setForm((f) => ({ ...f, items: updated, ...totals }))
  }

  const setGst = (pct: number) => {
    const totals = recalc(form.items, pct)
    setForm((f) => ({ ...f, gstPercent: pct, ...totals }))
  }

  const handleSave = async () => {
    if (!form.clientName || !form.projectTitle) return
    setSaving(true)
    try {
      if (editingId) {
        await updateQuote(editingId, form)
        setQuotes((q) => q.map((x) => x.id === editingId ? { ...form, id: editingId } : x))
        showMsg('Quote updated!')
      } else {
        const id = await addQuote(form)
        setQuotes((q) => [{ ...form, id }, ...q])
        showMsg('Quote saved!')
      }
      setShowForm(false); setEditingId(null)
    } catch { showMsg('Error saving quote.') }
    finally { setSaving(false) }
  }

  const handleEdit = (q: Quote) => {
    const { id, ...rest } = q; setForm(rest); setEditingId(id); setShowForm(true)
  }

  const handleDownload = (q: Quote) => generateQuotePDF(q, company)

  const handleStatusChange = async (q: Quote, status: QuoteStatus) => {
    await updateQuote(q.id, { status, ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}) })
    setQuotes((qs) => qs.map((x) => x.id === q.id ? { ...x, status } : x))
  }

  const handleDuplicate = (q: Quote) => {
    const { id, quoteNumber, createdAt, ...rest } = q
    setForm({ ...rest, quoteNumber: nextQuoteNumber(quotes), status: 'draft', createdAt: new Date().toISOString() })
    setEditingId(null); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote?')) return
    await deleteQuote(id); setQuotes((q) => q.filter((x) => x.id !== id)); showMsg('Deleted.')
  }

  const openNew = () => {
    setForm(emptyForm()); setEditingId(null); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-dark font-bold">Quotes</h1>
          <p className="font-body text-muted text-sm mt-0.5">Create and manage client quotations. Download as PDF.</p>
        </div>
        <button onClick={openNew} className="btn-primary gap-2"><FiPlus /> New Quote</button>
      </div>

      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}

      {/* ─── QUOTE FORM ─── */}
      {showForm && (
        <div className="admin-card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-dark font-bold">{editingId ? 'Edit Quote' : 'New Quote'} — {form.quoteNumber}</h2>
            <button onClick={() => setShowForm(false)} className="p-2 text-muted hover:text-dark rounded-lg"><FiX size={18} /></button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-5">
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Quote Number</label><input value={form.quoteNumber} onChange={(e) => setForm((f) => ({ ...f, quoteNumber: e.target.value }))} className="input-field font-mono" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Project / Work Title *</label><input value={form.projectTitle} onChange={(e) => setForm((f) => ({ ...f, projectTitle: e.target.value }))} placeholder="e.g. Ground Floor Construction" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Site Address</label><input value={form.siteAddress} onChange={(e) => setForm((f) => ({ ...f, siteAddress: e.target.value }))} placeholder="Plot No., Area, City" className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Client Name *</label><input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Client Phone</label><input value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} className="input-field" /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Client Email</label><input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} className="input-field" /></div>
          </div>

          {/* Line Items */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <label className="font-body text-xs text-muted uppercase tracking-wider">Work Items / Bill of Quantities</label>
              <button onClick={addItem} className="flex items-center gap-1.5 font-body text-xs font-semibold text-primary hover:text-primary-light transition-colors"><FiPlus size={13} /> Add Item</button>
            </div>

            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-3 mb-1 font-body text-xs text-muted uppercase tracking-wider">
              <span className="col-span-5">Description</span>
              <span className="col-span-2">Unit</span>
              <span className="col-span-1 text-right">Qty</span>
              <span className="col-span-2 text-right">Rate (₹)</span>
              <span className="col-span-1 text-right">Amount</span>
              <span className="col-span-1"></span>
            </div>

            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3 bg-slate rounded-xl border border-gray-100 items-start">
                  <div className="col-span-12 md:col-span-5">
                    <input value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder={`e.g. RCC Foundation Work`} className="input-field text-sm" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <select value={item.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} className="input-field text-sm">
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3 md:col-span-1">
                    <input type="number" min={0} value={item.quantity || ''} onChange={(e) => setItem(i, 'quantity', parseFloat(e.target.value) || 0)} placeholder="Qty" className="input-field text-sm text-right" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input type="number" min={0} value={item.rate || ''} onChange={(e) => setItem(i, 'rate', parseFloat(e.target.value) || 0)} placeholder="Rate" className="input-field text-sm text-right" />
                  </div>
                  <div className="col-span-4 md:col-span-1 flex items-center justify-end">
                    <span className="font-body text-sm font-semibold text-dark">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 ml-auto max-w-xs space-y-2">
              <div className="flex justify-between font-body text-sm"><span className="text-muted">Subtotal</span><span className="font-semibold text-dark">₹{form.subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex items-center justify-between font-body text-sm gap-3">
                <span className="text-muted">GST</span>
                <div className="flex items-center gap-2">
                  <select value={form.gstPercent} onChange={(e) => setGst(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2 py-1 font-body text-xs">
                    {[0, 5, 12, 18, 28].map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                  <span className="font-semibold text-dark">₹{form.gstAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between font-body text-base font-bold border-t border-gray-200 pt-2"><span>Total</span><span className="text-primary">₹{form.totalAmount.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Notes (shown on PDF)</label><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="input-field resize-none text-sm" placeholder="Any special notes for the client..." /></div>
            <div><label className="block font-body text-xs text-muted uppercase tracking-wider mb-1.5">Terms & Conditions</label><textarea value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} rows={3} className="input-field resize-none text-sm" /></div>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Update Quote' : 'Save Quote'}</button>
            <button onClick={() => { if (form.clientName) handleDownload({ ...form, id: editingId ?? 'preview' }) }} className="btn-outline gap-2"><FiDownload size={14} /> Preview PDF</button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-ghost">Cancel</button>
            <div className="ml-auto flex items-center gap-2">
              <label className="font-body text-xs text-muted">Valid for</label>
              <select value={form.validityDays} onChange={(e) => setForm((f) => ({ ...f, validityDays: Number(e.target.value) }))} className="border border-gray-200 rounded-lg px-3 py-2 font-body text-xs">
                {[15, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── QUOTES LIST ─── */}
      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="admin-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-body font-mono text-xs text-muted">{q.quoteNumber}</span>
                <span className={`badge capitalize ${STATUS_COLORS[q.status]}`}>{q.status}</span>
              </div>
              <p className="font-display text-dark font-bold text-sm">{q.projectTitle}</p>
              <p className="font-body text-xs text-muted">{q.clientName} · {q.clientPhone}</p>
              <p className="font-body text-xs text-muted">{q.siteAddress}</p>
              <p className="font-body text-xs text-muted mt-0.5">{new Date(q.createdAt).toLocaleDateString('en-IN')} · {q.items.length} items</p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <p className="font-display text-xl font-bold text-primary">₹{q.totalAmount.toLocaleString('en-IN')}</p>
              <div className="flex gap-1.5 flex-wrap justify-end">
                <button onClick={() => handleDownload(q)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg font-body text-xs font-semibold hover:bg-primary-600 transition-colors"><FiDownload size={12} /> PDF</button>
                <button onClick={() => handleEdit(q)} className="p-2 border border-gray-200 text-dark hover:border-primary hover:text-primary rounded-lg transition-colors"><FiEdit2 size={13} /></button>
                <button onClick={() => handleDuplicate(q)} title="Duplicate" className="p-2 border border-gray-200 text-dark hover:border-primary hover:text-primary rounded-lg transition-colors"><FiCopy size={13} /></button>
                <select value={q.status} onChange={(e) => handleStatusChange(q, e.target.value as QuoteStatus)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 font-body text-xs capitalize text-dark hover:border-primary">
                  {(['draft', 'sent', 'accepted', 'rejected'] as QuoteStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handleDelete(q.id)} className="p-2 text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><FiTrash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {quotes.length === 0 && !showForm && (
          <div className="text-center py-12 admin-card">
            <p className="font-display text-dark font-bold text-lg mb-2">No quotes yet</p>
            <p className="font-body text-muted text-sm mb-4">Create your first quotation for a client.</p>
            <button onClick={openNew} className="btn-primary gap-2"><FiPlus /> Create First Quote</button>
          </div>
        )}
      </div>
    </div>
  )
}
