import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import { getCompanyInfo, getVisibleTeam } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_TEAM } from '@/types'

export const metadata: Metadata = { title: 'About Us' }
export const revalidate = 60

export default async function AboutPage() {
  const [companyData, teamData] = await Promise.all([getCompanyInfo(), getVisibleTeam()])
  const company = companyData ?? DEFAULT_COMPANY
  const team = teamData.length > 0 ? teamData : DEFAULT_TEAM

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        <section className="section bg-primary">
          <div className="container-custom max-w-3xl text-center">
            <p className="section-label text-accent">Who We Are</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-6">About {company.name}</h1>
            <p className="font-body text-white/70 text-lg leading-relaxed">{company.description}</p>
          </div>
        </section>
        <section className="py-12 bg-accent">
          <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[{ value: `${company.yearsExperience}+`, label: 'Years' }, { value: `${company.projectsCompleted}+`, label: 'Projects' }, { value: `${company.happyClients}+`, label: 'Clients' }, { value: `${company.teamSize}+`, label: 'Team' }].map((s) => (
              <div key={s.label}><p className="font-display text-4xl text-dark font-bold">{s.value}</p><p className="font-body text-dark/70 text-sm mt-1">{s.label}</p></div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="container-custom">
            <div className="text-center mb-12"><p className="section-label">The People</p><h2 className="section-title">Meet Our Team</h2></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((m) => (
                <div key={m.id} className="card p-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <span className="font-display text-3xl text-primary font-bold">{m.name[0]}</span>
                  </div>
                  <h3 className="font-display text-dark font-bold">{m.name}</h3>
                  <p className="font-body text-accent text-sm font-semibold mb-2">{m.role}</p>
                  <p className="font-body text-muted text-sm leading-relaxed">{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16 bg-primary">
          <div className="container-custom text-center">
            <h2 className="font-display text-3xl text-white font-bold mb-4">Let&apos;s Build Something Together</h2>
            <Link href="/quote" className="btn-accent gap-2">Get Free Quote <FiArrowRight size={14} /></Link>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
