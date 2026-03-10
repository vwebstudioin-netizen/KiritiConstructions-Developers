'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowRight, FiHome, FiGrid, FiTool, FiLayers, FiAnchor, FiDroplet } from 'react-icons/fi'
import type { Service } from '@/types'

const ICON_MAP: Record<string, React.ElementType> = { FiHome, FiGrid, FiTool, FiLayers, FiAnchor, FiDroplet }

export default function ServicesOverview({ services }: { services: Service[] }) {
  return (
    <section className="section-alt">
      <div className="container-custom">
        <div className="text-center mb-14">
          <p className="section-label">What We Do</p>
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle mt-4 max-w-2xl mx-auto">From foundation to finishing — complete construction solutions under one roof.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.slice(0, 6).map((service, i) => {
            const Icon = ICON_MAP[service.icon] ?? FiHome
            return (
              <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Link href={`/services/${service.slug}`} className="card p-7 group flex flex-col h-full hover:-translate-y-1 transition-transform duration-200 block">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5 group-hover:bg-accent transition-colors duration-200">
                    <Icon className="text-white" size={22} />
                  </div>
                  <span className="badge-primary mb-3">{service.category}</span>
                  <h3 className="font-display text-lg text-dark font-bold mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                  <p className="font-body text-muted text-sm leading-relaxed flex-1">{service.description}</p>
                  <div className="flex items-center gap-1.5 text-primary font-body text-sm font-semibold mt-4 group-hover:gap-3 transition-all">Learn More <FiArrowRight size={14} /></div>
                </Link>
              </motion.div>
            )
          })}
        </div>
        <div className="text-center mt-10"><Link href="/services" className="btn-outline">View All Services</Link></div>
      </div>
    </section>
  )
}
