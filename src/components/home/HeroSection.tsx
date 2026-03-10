'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowRight, FiPhone } from 'react-icons/fi'
import type { CompanyInfo } from '@/types'

export default function HeroSection({ company }: { company: CompanyInfo }) {
  return (
    <section className="relative min-h-screen flex items-center bg-primary overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-700" />
      <div className="relative container-custom pt-32 pb-24">
        <div className="max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-body text-accent font-semibold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <span className="w-8 h-px bg-accent" /> Trusted Builders Since {new Date().getFullYear() - company.yearsExperience}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-bold leading-tight mb-6">
            {company.tagline}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-body text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
            {company.description.slice(0, 160)}...
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4">
            <Link href="/quote" className="btn-accent text-base px-8 py-4 gap-2">Get Free Quote <FiArrowRight /></Link>
            <Link href="/projects" className="btn-outline border-white text-white hover:bg-white hover:text-primary text-base px-8 py-4">View Projects</Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/10">
            {[
              { value: `${company.yearsExperience}+`, label: 'Years Experience' },
              { value: `${company.projectsCompleted}+`, label: 'Projects Done' },
              { value: `${company.happyClients}+`, label: 'Happy Clients' },
              { value: `${company.teamSize}+`, label: 'Team Members' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl md:text-4xl text-accent font-bold">{s.value}</p>
                <p className="font-body text-white/60 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-accent py-4">
        <div className="container-custom flex items-center justify-between gap-4 flex-wrap">
          <p className="font-body font-semibold text-dark text-sm">📞 Free Site Visit & Consultation Available</p>
          <a href={`tel:${company.phone}`} className="flex items-center gap-2 bg-dark text-white font-body font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary transition-colors">
            <FiPhone size={16} /> Call Now: {company.phone}
          </a>
        </div>
      </div>
    </section>
  )
}
