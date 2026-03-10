import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiArrowLeft, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import { getCompanyInfo, getServiceBySlug, getAllServices } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_SERVICES } from '@/types'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug) ?? DEFAULT_SERVICES.find((s) => s.slug === params.slug)
  return { title: service?.name ?? 'Service', description: service?.description }
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const [companyData, serviceData, allServicesData] = await Promise.all([
    getCompanyInfo(),
    getServiceBySlug(params.slug),
    getAllServices(),
  ])
  const company = companyData ?? DEFAULT_COMPANY
  const service = serviceData ?? DEFAULT_SERVICES.find((s) => s.slug === params.slug)
  const allServices = allServicesData.filter((s) => s.isAvailable).length > 0
    ? allServicesData.filter((s) => s.isAvailable)
    : DEFAULT_SERVICES

  if (!service) notFound()

  const related = allServices.filter((s) => s.id !== service.id && s.category === service.category).slice(0, 3)

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        {/* Hero */}
        <section className="section-dark">
          <div className="container-custom">
            <Link href="/services" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-body text-sm mb-6 transition-colors">
              <FiArrowLeft size={14} /> All Services
            </Link>
            <span className="badge-primary mb-4 block w-fit">{service.category}</span>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">{service.name}</h1>
            <p className="font-body text-white/60 text-lg max-w-2xl">{service.description}</p>
          </div>
        </section>

        {/* Content */}
        <section className="section bg-slate">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="font-display text-2xl text-dark font-bold mb-5">About This Service</h2>
                <p className="font-body text-muted text-base leading-relaxed">
                  {service.longDescription || service.description}
                </p>
              </div>
              <div className="space-y-5">
                {service.features.length > 0 && (
                  <div className="admin-card">
                    <h3 className="font-display text-dark font-bold mb-4">What&apos;s Included</h3>
                    <ul className="space-y-3">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 font-body text-sm text-dark">
                          <FiCheckCircle className="text-accent mt-0.5 flex-shrink-0" size={15} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="admin-card bg-primary text-white">
                  <h3 className="font-display font-bold mb-2">Get a Free Quote</h3>
                  <p className="font-body text-white/70 text-sm mb-4">Free site visit, no obligation.</p>
                  <Link href="/quote" className="btn-accent w-full justify-center gap-2">
                    Request Quote <FiArrowRight size={14} />
                  </Link>
                  <a href={`tel:${company.phone}`} className="block text-center font-body text-white/50 text-sm mt-3 hover:text-white">
                    or call {company.phone}
                  </a>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-16 pt-10 border-t border-gray-100">
                <h2 className="font-display text-xl text-dark font-bold mb-6">Related Services</h2>
                <div className="grid sm:grid-cols-3 gap-5">
                  {related.map((s) => (
                    <Link key={s.id} href={`/services/${s.slug}`} className="admin-card hover:-translate-y-1 transition-transform block">
                      <span className="badge-primary mb-2 block w-fit">{s.category}</span>
                      <h3 className="font-display text-dark font-bold text-sm mb-1.5">{s.name}</h3>
                      <p className="font-body text-muted text-xs line-clamp-2">{s.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
