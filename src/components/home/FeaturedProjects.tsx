'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiArrowRight, FiMapPin, FiCalendar } from 'react-icons/fi'
import type { Project } from '@/types'

const STATUS_COLORS = { planning: 'badge-blue', ongoing: 'badge-accent', completed: 'badge-green', 'on-hold': 'badge-gray' }

export default function FeaturedProjects({ projects }: { projects: Project[] }) {
  const featured = projects.filter((p) => p.isFeatured).slice(0, 3)
  if (featured.length === 0) return null
  return (
    <section className="section">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div><p className="section-label">Our Work</p><h2 className="section-title">Featured Projects</h2></div>
          <Link href="/projects" className="btn-outline flex-shrink-0">All Projects <FiArrowRight size={14} /></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {featured.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link href={`/projects/${project.slug}`} className="card group overflow-hidden block">
                <div className="relative h-56 bg-primary-100 overflow-hidden">
                  {project.coverImage?.startsWith('http') ? (
                    <Image src={project.coverImage} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center">
                      <span className="text-white/30 font-display text-4xl font-bold">{project.category[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="badge bg-accent text-dark">{project.category}</span>
                    <span className={`badge ${STATUS_COLORS[project.status] ?? 'badge-gray'}`}>{project.status}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base text-dark font-bold group-hover:text-primary transition-colors mb-2 line-clamp-1">{project.title}</h3>
                  <p className="font-body text-muted text-sm line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between text-xs font-body text-muted">
                    <span className="flex items-center gap-1"><FiMapPin size={11} />{project.location.split(',')[0]}</span>
                    <span className="flex items-center gap-1"><FiCalendar size={11} />{project.year}</span>
                  </div>
                  {project.totalValue && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs font-body mb-1">
                        <span className="text-muted">Progress</span>
                        <span className="text-dark font-semibold">{Math.round((project.paidAmount ?? 0) / project.totalValue * 100)}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round((project.paidAmount ?? 0) / project.totalValue * 100)}%` }} /></div>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
