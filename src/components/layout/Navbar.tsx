'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiMenu, FiX, FiPhone, FiUser } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Plots', href: '/plots' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar({ companyName, phone, whatsapp }: { companyName: string; phone: string; whatsapp: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-primary'}`}>
      <div className={`hidden md:block border-b transition-colors ${scrolled ? 'bg-slate border-gray-100' : 'bg-primary-700 border-primary-600'}`}>
        <div className="container-custom flex items-center justify-between py-1.5">
          <p className={`font-body text-xs ${scrolled ? 'text-muted' : 'text-white/60'}`}>📍 {phone}</p>
          <div className="flex items-center gap-4">
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 font-body text-xs transition-colors ${scrolled ? 'text-green-600' : 'text-white/70 hover:text-white'}`}><FaWhatsapp size={12} />WhatsApp</a>
            <Link href="/client/login" className={`flex items-center gap-1.5 font-body text-xs transition-colors ${scrolled ? 'text-primary hover:underline' : 'text-white/70 hover:text-white'}`}><FiUser size={12} />Client Portal</Link>
          </div>
        </div>
      </div>
      <nav className="container-custom flex items-center justify-between py-4">
        <Link href="/" className={`font-display font-bold text-xl ${scrolled ? 'text-primary' : 'text-white'}`}>{companyName}</Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`font-body text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${pathname === link.href ? (scrolled ? 'bg-primary text-white' : 'bg-white/20 text-white') : (scrolled ? 'text-dark hover:bg-primary-50 hover:text-primary' : 'text-white/80 hover:bg-white/10 hover:text-white')}`}>{link.label}</Link>
          ))}
          <Link href="/quote" className="ml-2 btn-accent text-sm px-5 py-2.5">Get a Quote</Link>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-dark' : 'text-white'}`}>{menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}</button>
      </nav>
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="container-custom py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`font-body text-sm font-medium px-4 py-3 rounded-xl ${pathname === link.href ? 'bg-primary text-white' : 'text-dark hover:bg-primary-50'}`}>{link.label}</Link>
            ))}
            <Link href="/client/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 font-body text-sm text-primary font-semibold"><FiUser size={15} />Client Portal</Link>
            <Link href="/quote" onClick={() => setMenuOpen(false)} className="btn-accent justify-center mt-2">Get a Quote</Link>
          </div>
        </div>
      )}
    </header>
  )
}
