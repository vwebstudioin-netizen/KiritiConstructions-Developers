import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import Image from 'next/image'
import { FiMapPin, FiArrowRight, FiGrid } from 'react-icons/fi'
import { getCompanyInfo, getVisibleInventoryProjects, getInventoryUnits } from '@/lib/firestore'
import { DEFAULT_COMPANY } from '@/types'

export const metadata: Metadata = {
  title: 'Plots & Inventory',
  description: 'Browse available plots, apartments, and villas from Kiriti Constructions & Developers. Real-time availability — enquire about a specific unit today.',
}
export const revalidate = 60

const TYPE_LABEL: Record<string, string> = { plots: 'Plotted Layout', apartments: 'Apartment Block', villas: 'Villa Project', floors: 'Floor-wise' }

export default async function PlotsPage() {
  const [companyData, projects] = await Promise.all([getCompanyInfo(), getVisibleInventoryProjects()])
  const company = companyData ?? DEFAULT_COMPANY

  // Load unit availability for each project
  const projectsWithCounts = await Promise.all(
    projects.map(async (p) => {
      const units = await getInventoryUnits(p.id)
      return {
        ...p,
        available: units.filter((u) => u.status === 'available').length,
        total: units.length,
      }
    })
  )

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        {/* Hero */}
        <section className="section-dark">
          <div className="container-custom text-center">
            <p className="font-body text-accent text-xs tracking-[4px] uppercase mb-3">Real Estate</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">Plots & Inventory</h1>
            <p className="font-body text-white/60 text-lg max-w-xl mx-auto">
              Browse available plots, apartments, and villas. Real-time availability — pick your unit and enquire directly.
            </p>
          </div>
        </section>

        {/* Projects grid */}
        <section className="section bg-slate">
          <div className="container-custom">
            {projectsWithCounts.length === 0 ? (
              <div className="text-center py-20">
                <FiGrid className="text-muted mx-auto mb-4" size={40} />
                <p className="font-display text-dark font-bold text-xl mb-2">No inventory listed yet</p>
                <p className="font-body text-muted">Check back soon for upcoming projects.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projectsWithCounts.map((p) => (
                  <Link key={p.id} href={`/plots/${p.slug}`} className="admin-card group hover:-translate-y-1 transition-transform block overflow-hidden">
                    {/* Image */}
                    <div className="relative h-52 bg-primary-100 overflow-hidden -mx-6 -mt-6 mb-5">
                      {p.coverImage ? (
                        <Image src={p.coverImage} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
                          <FiGrid className="text-white/20" size={48} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="badge bg-accent text-dark capitalize">{TYPE_LABEL[p.type] ?? p.type}</span>
                        {p.available > 0 && <span className="badge bg-green-500 text-white">{p.available} Available</span>}
                        {p.available === 0 && <span className="badge bg-red-500 text-white">Fully Booked</span>}
                      </div>
                    </div>

                    <h2 className="font-display text-lg text-dark font-bold group-hover:text-primary transition-colors mb-1">{p.title}</h2>
                    <p className="font-body text-xs text-muted flex items-center gap-1 mb-3"><FiMapPin size={11} />{p.location}</p>

                    {/* Price */}
                    <p className="font-display text-xl text-primary font-bold mb-3">
                      ₹{(p.priceFrom / 100000).toFixed(1)}L
                      {p.priceTo && p.priceTo > p.priceFrom && ` – ₹${(p.priceTo / 100000).toFixed(1)}L`}
                    </p>

                    {/* Amenities */}
                    {p.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {p.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="font-body text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-lg">{a}</span>
                        ))}
                        {p.amenities.length > 3 && <span className="font-body text-xs text-muted">+{p.amenities.length - 3} more</span>}
                      </div>
                    )}

                    {/* Unit count */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex gap-4 font-body text-xs">
                        <span className="text-green-600 font-semibold">{p.available} Available</span>
                        <span className="text-muted">{p.total} Total</span>
                      </div>
                      <span className="flex items-center gap-1 font-body text-xs text-primary font-semibold group-hover:gap-2 transition-all">
                        View Units <FiArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
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
