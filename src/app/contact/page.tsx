import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiPhone, FiMail, FiMapPin, FiClock, FiArrowRight } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa'
import { getCompanyInfo } from '@/lib/firestore'
import { DEFAULT_COMPANY } from '@/types'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Kiriti Constructions & Developers Pvt. Ltd. for a free site visit and consultation.',
}
export const revalidate = 60

export default async function ContactPage() {
  const companyData = await getCompanyInfo()
  const company = companyData ?? DEFAULT_COMPANY

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        <section className="section-dark">
          <div className="container-custom text-center">
            <p className="font-body text-accent text-xs tracking-[4px] uppercase mb-3">Get In Touch</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">Contact Us</h1>
            <p className="font-body text-white/60 text-lg">We&apos;re here to help. Reach out for a free consultation and site visit.</p>
          </div>
        </section>

        <section className="section bg-slate">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact info */}
              <div>
                <h2 className="font-display text-2xl text-dark font-bold mb-8">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    { icon: FiPhone, label: 'Phone', value: company.phone, href: `tel:${company.phone}` },
                    { icon: FiMail, label: 'Email', value: company.email, href: `mailto:${company.email}` },
                    { icon: FiMapPin, label: 'Address', value: company.address, href: '#' },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <a key={label} href={href} className="flex gap-4 group">
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                        <Icon className="text-primary group-hover:text-white transition-colors" size={18} />
                      </div>
                      <div>
                        <p className="font-body text-xs text-muted mb-0.5">{label}</p>
                        <p className="font-body text-dark font-medium text-sm">{value}</p>
                      </div>
                    </a>
                  ))}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiClock className="text-primary" size={18} />
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted mb-0.5">Working Hours</p>
                      <p className="font-body text-dark font-medium text-sm">{company.workingHours.weekdays}</p>
                      <p className="font-body text-dark font-medium text-sm">{company.workingHours.saturday}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 flex-wrap">
                  <a href={`tel:${company.phone}`} className="btn-primary gap-2">
                    <FiPhone size={16} /> Call Now
                  </a>
                  <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl font-body font-semibold text-sm hover:bg-green-600 transition-colors">
                    <FaWhatsapp size={16} /> WhatsApp
                  </a>
                </div>

                <div className="flex gap-3 mt-6">
                  {company.socialLinks.instagram && <a href={company.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-200 flex items-center justify-center text-muted hover:border-primary hover:text-primary transition-all rounded-xl"><FaInstagram size={16} /></a>}
                  {company.socialLinks.facebook && <a href={company.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-200 flex items-center justify-center text-muted hover:border-primary hover:text-primary transition-all rounded-xl"><FaFacebook size={16} /></a>}
                </div>
              </div>

              {/* Map + CTA */}
              <div className="space-y-5">
                <div className="w-full h-72 bg-slate overflow-hidden rounded-2xl border border-gray-100">
                  {company.mapEmbed ? (
                    <iframe src={company.mapEmbed} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Location" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary-50">
                      <FiMapPin className="text-primary mb-3" size={36} />
                      <p className="font-body text-muted text-sm text-center px-6">{company.address}</p>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`} target="_blank" rel="noopener noreferrer" className="mt-4 font-body text-xs text-primary underline">Open in Google Maps</a>
                    </div>
                  )}
                </div>

                <div className="admin-card bg-accent text-dark">
                  <h3 className="font-display font-bold text-lg mb-2">Need a Quote?</h3>
                  <p className="font-body text-dark/70 text-sm mb-4">Fill our quote form and we&apos;ll get back within 24 hours.</p>
                  <Link href="/quote" className="btn-primary gap-2">
                    Get Free Quote <FiArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
