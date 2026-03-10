'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getClientByUid } from '@/lib/firestore'
import type { Client } from '@/types'
import { FiUser, FiPhone, FiMail, FiMapPin, FiFolder } from 'react-icons/fi'

export default function ClientProfilePage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const c = await getClientByUid(user.uid)
      setClient(c)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!client) return <div className="text-center py-16"><p className="font-body text-muted">Profile not found. Contact your project manager.</p></div>

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl text-dark font-bold mb-2">My Profile</h1>
      <p className="font-body text-muted text-sm mb-6">Your account details on the Kiriti Constructions client portal.</p>

      <div className="portal-card space-y-5">
        {[
          { icon: FiUser, label: 'Full Name', value: client.name },
          { icon: FiPhone, label: 'Phone', value: client.phone },
          { icon: FiMail, label: 'Email', value: client.email },
          { icon: FiMapPin, label: 'Address', value: client.address || '—' },
          { icon: FiFolder, label: 'Projects', value: `${client.assignedProjects.length} project${client.assignedProjects.length !== 1 ? 's' : ''} assigned` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="text-primary" size={16} />
            </div>
            <div>
              <p className="font-body text-xs text-muted mb-0.5">{label}</p>
              <p className="font-body text-dark font-medium text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="font-body text-xs text-muted mt-5 p-4 bg-slate rounded-xl border border-gray-100">
        To update your profile details, please contact your project manager at <strong>+91 93866 55555</strong>.
      </p>
    </div>
  )
}
