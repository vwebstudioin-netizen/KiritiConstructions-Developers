'use client'
import { useEffect, useState } from 'react'
import { getCompanyInfo, saveCompanyInfo } from '@/lib/firestore'
import type { CompanyInfo } from '@/types'
import { DEFAULT_COMPANY } from '@/types'
import { FiSave } from 'react-icons/fi'

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { getCompanyInfo().then((c) => { if (c) setCompany(c) }) }, [])

  const save = async () => {
    setSaving(true); await saveCompanyInfo(company); setSaving(false)
    setMessage('Saved!'); setTimeout(() => setMessage(''), 3000)
  }

  const up = (field: keyof CompanyInfo, value: unknown) => setCompany((prev) => ({ ...prev, [field]: value }))

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-6">Settings</h1>
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}
      <div className="space-y-6">
        <div className="admin-card">
          <h2 className="font-display text-lg text-dark font-bold mb-5">Company Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(['name', 'tagline', 'phone', 'whatsapp', 'email'] as const).map((k) => (
              <div key={k}><label className="block font-body text-sm font-medium text-dark mb-1.5 capitalize">{k}</label><input value={company[k] as string} onChange={(e) => up(k, e.target.value)} className="input-field" /></div>
            ))}
            <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Address</label><input value={company.address} onChange={(e) => up('address', e.target.value)} className="input-field" /></div>
            <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Description</label><textarea value={company.description} onChange={(e) => up('description', e.target.value)} rows={3} className="input-field resize-none" /></div>
            <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Google Maps Embed URL</label><input value={company.mapEmbed ?? ''} onChange={(e) => up('mapEmbed', e.target.value)} className="input-field" /></div>
          </div>
        </div>
        <div className="admin-card">
          <h2 className="font-display text-lg text-dark font-bold mb-5">Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['yearsExperience', 'projectsCompleted', 'happyClients', 'teamSize'] as const).map((k) => (
              <div key={k}><label className="block font-body text-sm font-medium text-dark mb-1.5 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label><input type="number" value={company[k] as number} onChange={(e) => up(k, Number(e.target.value))} className="input-field" /></div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <h2 className="font-display text-lg text-dark font-bold mb-5">Social Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(['instagram', 'facebook', 'youtube', 'linkedin'] as const).map((s) => (
              <div key={s}><label className="block font-body text-sm font-medium text-dark mb-1.5 capitalize">{s}</label><input value={company.socialLinks[s] ?? ''} onChange={(e) => up('socialLinks', { ...company.socialLinks, [s]: e.target.value })} className="input-field" /></div>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary gap-2 disabled:opacity-60"><FiSave /> {saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  )
}
