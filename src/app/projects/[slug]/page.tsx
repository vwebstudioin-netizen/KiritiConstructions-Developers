import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiArrowLeft, FiMapPin, FiCalendar, FiMaximize2, FiClock, FiArrowRight } from 'react-icons/fi'
import { getCompanyInfo, getProjectBySlug } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_PROJECTS } from '@/types'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug) ?? DEFAULT_PROJECTS.find((p) => p.slug === params.slug)
  return { title: project?.title ?? 'Project', description: project?.description }
}

const STATUS_COLORS: Record<string, string> = { planning: 'badge-blue', ongoing: 'badge-accent', completed: 'badge-green', 'on-hold': 'badge-gray' }

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const [companyData, projectData] = await Promise.all([
    getCompanyInfo(),
    getProjectBySlug(params.slug),
  ])
  const company = companyData ?? DEFAULT_COMPANY
  const project = projectData ?? DEFAULT_PROJECTS.find((p) => p.slug === params.slug)
  if (!project) notFound()

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        {/* Hero */}
        <section className="section-dark">
          <div className="container-custom">
            <Link href="/projects" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-body text-sm mb-6 transition-colors">
              <FiArrowLeft size={14} /> All Projects
            </Link>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="badge bg-accent text-dark">{project.category}</span>
              <span className={`badge capitalize ${STATUS_COLORS[project.status] ?? 'badge-gray'}`}>{project.status}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">{project.title}</h1>
            <div className="flex flex-wrap gap-6 font-body text-white/50 text-sm">
              <span className="flex items-center gap-1.5"><FiMapPin size={13} />{project.location}</span>
              <span className="flex items-center gap-1.5"><FiCalendar size={13} />{project.year}</span>
              {project.area && <span className="flex items-center gap-1.5"><FiMaximize2 size={13} />{project.area}</span>}
              {project.duration && <span className="flex items-center gap-1.5"><FiClock size={13} />{project.duration}</span>}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="section bg-slate">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                {/* Main image */}
                <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-6 bg-primary-100">
                  {project.coverImage?.startsWith('http') ? (
                    <Image src={project.coverImage} alt={project.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
                      <span className="text-white/20 font-display text-6xl font-bold">{project.category[0]}</span>
                    </div>
                  )}
                </div>
                <h2 className="font-display text-2xl text-dark font-bold mb-4">Project Overview</h2>
                <p className="font-body text-muted text-base leading-relaxed">{project.description}</p>
              </div>

              <div className="space-y-5">
                <div className="admin-card">
                  <h3 className="font-display text-dark font-bold mb-4">Project Details</h3>
                  <div className="space-y-3">
                    {[
                      { icon: FiMapPin, label: 'Location', value: project.location },
                      { icon: FiCalendar, label: 'Year', value: String(project.year) },
                      ...(project.area ? [{ icon: FiMaximize2, label: 'Area', value: project.area }] : []),
                      ...(project.duration ? [{ icon: FiClock, label: 'Duration', value: project.duration }] : []),
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex gap-3">
                        <Icon className="text-accent mt-0.5 flex-shrink-0" size={14} />
                        <div>
                          <p className="font-body text-xs text-muted">{label}</p>
                          <p className="font-body text-sm text-dark font-medium">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-card bg-primary text-white">
                  <h3 className="font-display font-bold mb-2">Start a Similar Project?</h3>
                  <p className="font-body text-white/70 text-sm mb-4">Get a free quote for your project today.</p>
                  <Link href="/quote" className="btn-accent w-full justify-center gap-2">
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
