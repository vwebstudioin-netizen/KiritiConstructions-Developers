'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { FiGrid, FiFolder, FiCreditCard, FiFileText, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi'

const NAV = [
  { href: '/client/dashboard', label: 'Dashboard', icon: FiGrid },
  { href: '/client/projects', label: 'My Projects', icon: FiFolder },
  { href: '/client/payments', label: 'Payments', icon: FiCreditCard },
  { href: '/client/documents', label: 'Documents', icon: FiFileText },
  { href: '/client/profile', label: 'Profile', icon: FiUser },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAuthPage = pathname === '/client/login' || pathname === '/client/register'

  useEffect(() => {
    if (isAuthPage) { setLoading(false); return }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/client/login')
      else setLoading(false)
    })
    return () => unsub()
  }, [pathname, router, isAuthPage])

  if (isAuthPage) return <>{children}</>
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-30 shadow-sm transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="font-display text-primary font-bold text-lg">Kiriti Constructions & Developers</Link>
          <p className="font-body text-xs text-muted mt-0.5">Client Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all ${pathname === href || pathname.startsWith(href + '/') ? 'bg-primary text-white font-semibold' : 'text-dark hover:bg-primary-50 hover:text-primary'}`}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-3 px-4 py-2 font-body text-xs text-muted hover:text-primary mb-2">← Back to Website</Link>
          <button onClick={() => { signOut(auth); router.push('/client/login') }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-muted hover:bg-red-50 hover:text-red-600 w-full transition-all">
            <FiLogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-dark p-1">{sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}</button>
          <p className="font-body text-sm text-muted flex-1">{NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Client Portal'}</p>
        </header>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  )
}
