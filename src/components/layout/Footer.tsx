import Link from 'next/link'
import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi'
import { FaInstagram, FaFacebook, FaYoutube, FaLinkedin, FaWhatsapp } from 'react-icons/fa'
import type { CompanyInfo } from '@/types'

export default function Footer({ company }: { company: CompanyInfo }) {
  return (
    <footer className="bg-dark text-white/80">
      <div className="container-custom py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="font-display text-2xl text-white font-bold mb-3">{company.name}</h3>
            <p className="font-body text-sm text-white/60 mb-5">{company.tagline}</p>
            <div className="flex gap-3 flex-wrap">
              {[
                { href: company.socialLinks.facebook, Icon: FaFacebook, color: 'hover:bg-blue-600' },
                { href: company.socialLinks.instagram, Icon: FaInstagram, color: 'hover:bg-pink-600' },
                { href: company.socialLinks.youtube, Icon: FaYoutube, color: 'hover:bg-red-600' },
                { href: company.socialLinks.linkedin, Icon: FaLinkedin, color: 'hover:bg-blue-700' },
                { href: `https://wa.me/${company.whatsapp}`, Icon: FaWhatsapp, color: 'hover:bg-green-500' },
              ].filter((s) => s.href).map(({ href, Icon, color }) => (
                <a key={href} href={href!} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center ${color} transition-all`}><Icon size={16} /></a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold text-white uppercase tracking-wider mb-4">Services</h4>
            <ul className="space-y-2.5">
              {[['Residential Construction', '/services/residential-construction'], ['Commercial Construction', '/services/commercial-construction'], ['Home Renovation', '/services/home-renovation'], ['Interior Design', '/services/interior-design'], ['Civil Work', '/services/civil-work']].map(([label, href]) => (
                <li key={href}><Link href={href} className="font-body text-sm text-white/60 hover:text-accent transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[['About Us', '/about'], ['Our Projects', '/projects'], ['Blog', '/blog'], ['Get a Quote', '/quote'], ['Client Portal', '/client/login']].map(([label, href]) => (
                <li key={href}><Link href={href} className="font-body text-sm text-white/60 hover:text-accent transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex gap-3"><FiMapPin className="text-accent mt-0.5 flex-shrink-0" size={14} /><p className="font-body text-sm text-white/60">{company.address}</p></div>
              <a href={`tel:${company.phone}`} className="flex gap-3"><FiPhone className="text-accent mt-0.5 flex-shrink-0" size={14} /><span className="font-body text-sm text-white/60">{company.phone}</span></a>
              <a href={`mailto:${company.email}`} className="flex gap-3"><FiMail className="text-accent mt-0.5 flex-shrink-0" size={14} /><span className="font-body text-sm text-white/60">{company.email}</span></a>
              <div className="flex gap-3"><FiClock className="text-accent mt-0.5 flex-shrink-0" size={14} /><div className="font-body text-sm text-white/60"><p>{company.workingHours.weekdays}</p><p>{company.workingHours.saturday}</p></div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-custom py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-white/40">© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <p className="font-body text-xs text-white/40">Designed & Developed by <span className="text-accent">VwebStudio</span></p>
        </div>
      </div>
    </footer>
  )
}
