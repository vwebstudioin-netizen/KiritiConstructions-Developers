'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getSupervisorByUid } from '@/lib/firestore'
import type { Supervisor } from '@/types'
import { FiGrid, FiFolder, FiLogOut, FiMenu, FiX } from 'react-icons/fi'

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAuthPage = pathname === '/supervisor/login'

  useEffect(() => {
    if (isAuthPage) { setLoading(false); return }
    if (!auth) { router.push('/supervisor/login'); return }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/supervisor/login'); return }
      const sup = await getSupervisorByUid(user.uid)
      if (!sup || !sup.isActive) { await signOut(auth!); router.push('/supervisor/login'); return }
      setSupervisor(sup)
      setLoading(false)
    })
    return () => unsub()
  }, [pathname, router, isAuthPage])

  if (isAuthPage) return <>{children}</>
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  const NAV = [
    { href: '/supervisor', label: 'My Sites', icon: FiGrid },
  ]

  return (
    <div className="min-h-screen bg-slate flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-60 bg-primary flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <h2 className="font-display text-white text-lg font-bold">Supervisor Portal</h2>
          <p className="font-body text-white/40 text-xs mt-0.5">{supervisor?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 font-body text-sm transition-all ${pathname === href ? 'bg-accent text-dark font-medium' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="font-body text-xs text-white/30 px-4 mb-2">{supervisor?.phone}</p>
          <button onClick={() => { if (auth) signOut(auth); router.push('/supervisor/login') }}
            className="flex items-center gap-3 px-4 py-3 font-body text-sm text-white/50 hover:bg-white/10 hover:text-white w-full transition-colors">
            <FiLogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-60 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-dark">{sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}</button>
          <p className="font-body text-sm text-muted flex-1">Welcome, {supervisor?.name}</p>
        </header>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  )
}
