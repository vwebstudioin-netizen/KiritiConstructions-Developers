import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import { FiHome, FiGrid, FiTool, FiLayers, FiAnchor, FiDroplet } from 'react-icons/fi'
import { getCompanyInfo, getAllServices } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_SERVICES } from '@/types'

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Explore the full range of construction and infrastructure services offered by Kiriti Constructions & Developers Pvt. Ltd.',
}
export const revalidate = 60

const ICON_MAP: Record<string, React.ElementType> = {
  FiHome, FiGrid, FiTool, FiLayers, FiAnchor, FiDroplet,
}

export default async function ServicesPage() {
  const [companyData, servicesData] = await Promise.all([getCompanyInfo(), getAllServices()])
  const company = companyData ?? DEFAULT_COMPANY
  const services = servicesData.filter((s) => s.isAvailable).length > 0
    ? servicesData.filter((s) => s.isAvailable)
    : DEFAULT_SERVICES

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        {/* Hero */}
        <section className="section-dark">
          <div className="container-custom text-center">
            <p className="font-body text-accent text-xs tracking-[4px] uppercase mb-3">What We Offer</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">Our Services</h1>
            <p className="font-body text-white/60 text-lg max-w-xl mx-auto">
              From residential villas to large commercial complexes — complete construction solutions under one roof.
            </p>
          </div>
        </section>

        {/* Services grid */}
        <section className="section bg-slate">
          <div className="container-custom">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                const Icon = ICON_MAP[service.icon] ?? FiHome
                return (
                  <div key={service.id} className="admin-card flex flex-col hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-5">
                      <Icon className="text-white" size={26} />
                    </div>
                    <span className="badge-primary mb-3">{service.category}</span>
                    <h2 className="font-display text-xl text-dark font-bold mb-3">{service.name}</h2>
                    <p className="font-body text-muted text-sm leading-relaxed mb-4 flex-1">{service.description}</p>
                    {service.features.length > 0 && (
                      <ul className="space-y-2 mb-5">
                        {service.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-2 font-body text-xs text-dark">
                            <FiCheckCircle className="text-accent mt-0.5 flex-shrink-0" size={13} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={`/services/${service.slug}`} className="flex items-center gap-2 font-body text-sm text-primary font-semibold hover:gap-3 transition-all mt-auto">
                      Learn More <FiArrowRight size={14} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-accent">
          <div className="container-custom text-center">
            <h2 className="font-display text-3xl text-dark font-bold mb-4">Ready to Start Your Project?</h2>
            <p className="font-body text-dark/70 text-lg mb-8">Get a free site visit and detailed estimate.</p>
            <Link href="/quote" className="btn-primary gap-2">Get Free Quote <FiArrowRight size={14} /></Link>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
