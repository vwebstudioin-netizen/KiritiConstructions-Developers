'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi'

const REASONS = [
  { title: '15+ Years of Experience', desc: 'Proven track record across hundreds of residential and commercial projects.' },
  { title: 'Licensed & Insured', desc: 'All our work is backed by proper licences and comprehensive insurance cover.' },
  { title: 'Transparent Pricing', desc: 'Detailed BOQ with no hidden costs. You know exactly what you are paying for.' },
  { title: 'On-Time Delivery', desc: 'We commit to timelines and have an excellent track record of on-time handovers.' },
  { title: 'Client Portal Access', desc: 'Track your project progress in real-time from anywhere with your private client portal.' },
  { title: 'Post-Completion Support', desc: 'Our relationship does not end at handover — we are available for after-service.' },
]

export default function WhyChooseUs() {
  return (
    <section className="section bg-primary">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-body text-accent font-semibold text-sm tracking-widest uppercase mb-3">Why Us</p>
            <h2 className="font-display text-3xl md:text-4xl text-white font-bold leading-tight mb-6">What Makes Us Different</h2>
            <p className="font-body text-white/70 text-lg leading-relaxed mb-8">We combine years of expertise with a client-first approach — ensuring every project is delivered with quality, integrity, and craftsmanship.</p>
            <Link href="/about" className="btn-accent gap-2">Learn More About Us <FiArrowRight size={14} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {REASONS.map((r, i) => (
              <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white/10 rounded-2xl p-5 hover:bg-white/15 transition-colors">
                <FiCheckCircle className="text-accent mb-3" size={22} />
                <h4 className="font-display text-white font-bold text-sm mb-1.5">{r.title}</h4>
                <p className="font-body text-white/60 text-xs leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
