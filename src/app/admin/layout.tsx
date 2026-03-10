'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { FiGrid, FiFolder, FiUsers, FiCreditCard, FiTool, FiUserCheck, FiFileText, FiMessageSquare, FiSettings, FiLogOut, FiMenu, FiX, FiHardDrive, FiClipboard, FiMap } from 'react-icons/fi'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: FiGrid },
  { href: '/admin/projects', label: 'Projects', icon: FiFolder },
  { href: '/admin/inventory', label: 'Inventory', icon: FiMap },
  { href: '/admin/supervisors', label: 'Supervisors', icon: FiHardDrive },
  { href: '/admin/quotes', label: 'Quotes', icon: FiClipboard },
  { href: '/admin/clients', label: 'Clients', icon: FiUserCheck },
  { href: '/admin/payments', label: 'Payments', icon: FiCreditCard },
  { href: '/admin/services', label: 'Services', icon: FiTool },
  { href: '/admin/team', label: 'Team', icon: FiUsers },
  { href: '/admin/blog', label: 'Blog', icon: FiFileText },
  { href: '/admin/enquiries', label: 'Enquiries', icon: FiMessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') { setLoading(false); return }
    // Demo mode: skip auth if Firebase is not configured
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!projectId || projectId === 'demo-project') { setLoading(false); return }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/admin/login')
      else setLoading(false)
    })
    return () => unsub()
  }, [pathname, router])

  if (pathname === '/admin/login') return <>{children}</>
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-slate flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-primary flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <h2 className="font-display text-white font-bold text-lg">Admin Panel</h2>
          <p className="font-body text-white/50 text-xs mt-0.5">Premium CMS</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all ${pathname === href || (href !== '/admin' && pathname.startsWith(href)) ? 'bg-white/20 text-white font-semibold' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-2 rounded-xl font-body text-xs text-white/50 hover:text-white">View Site →</Link>
          <button onClick={() => { try { signOut(auth) } catch {} router.push('/admin/login') }} className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-white/60 hover:bg-white/10 hover:text-white w-full transition-all">
            <FiLogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-dark p-1">{sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}</button>
          <p className="font-body text-xs text-muted flex-1">{NAV.find((n) => n.href === pathname || (n.href !== '/admin' && pathname.startsWith(n.href)))?.label ?? 'Admin'}</p>
        </header>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  )
}
