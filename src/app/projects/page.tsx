'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiMapPin, FiCalendar, FiArrowRight } from 'react-icons/fi'
import { getCompanyInfo, getVisibleProjects } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_PROJECTS } from '@/types'
import type { CompanyInfo, Project, ProjectCategory } from '@/types'

const FILTERS: (ProjectCategory | 'All')[] = ['All', 'Residential', 'Commercial', 'Renovation', 'Interior']
const STATUS_COLORS = { planning: 'badge-blue', ongoing: 'badge-accent', completed: 'badge-green', 'on-hold': 'badge-gray' }

export default function ProjectsPage() {
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS)
  const [filter, setFilter] = useState<ProjectCategory | 'All'>('All')

  useEffect(() => {
    Promise.all([getCompanyInfo(), getVisibleProjects()]).then(([c, p]) => {
      if (c) setCompany(c)
      if (p.length > 0) setProjects(p)
    })
  }, [])

  const filtered = filter === 'All' ? projects : projects.filter((p) => p.category === filter)

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        <section className="section-dark">
          <div className="container-custom text-center">
            <p className="font-body text-accent text-xs tracking-[4px] uppercase mb-3">Our Portfolio</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">Our Projects</h1>
            <p className="font-body text-white/60 text-lg">A showcase of completed and ongoing work across the region.</p>
          </div>
        </section>

        <section className="section bg-slate">
          <div className="container-custom">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-10 justify-center">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-white text-dark border border-gray-200 hover:border-primary hover:text-primary'}`}>
                  {f}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project, i) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={`/projects/${project.slug}`} className="admin-card group overflow-hidden block hover:-translate-y-1 transition-transform">
                    <div className="relative h-52 bg-primary-100 overflow-hidden -mx-6 -mt-6 mb-5">
                      {project.coverImage?.startsWith('http') ? (
                        <Image src={project.coverImage} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
                          <span className="text-white/20 font-display text-5xl font-bold">{project.category[0]}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="badge bg-accent text-dark">{project.category}</span>
                        <span className={`badge capitalize ${STATUS_COLORS[project.status] ?? 'badge-gray'}`}>{project.status}</span>
                      </div>
                    </div>
                    <h2 className="font-display text-base text-dark font-bold group-hover:text-primary transition-colors mb-2 line-clamp-1">{project.title}</h2>
                    <p className="font-body text-muted text-sm line-clamp-2 mb-3">{project.description}</p>
                    <div className="flex items-center justify-between text-xs font-body text-muted">
                      <span className="flex items-center gap-1"><FiMapPin size={11} />{project.location.split(',')[0]}</span>
                      <span className="flex items-center gap-1"><FiCalendar size={11} />{project.year}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {filtered.length === 0 && <p className="text-center font-body text-muted py-16">No projects in this category.</p>}
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
