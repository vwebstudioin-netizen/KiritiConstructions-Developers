'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { Testimonial } from '@/types'

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0)
  if (testimonials.length === 0) return null
  const prev = () => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))
  const next = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1))
  const t = testimonials[index]
  return (
    <section className="section">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-12"><p className="section-label">Client Stories</p><h2 className="section-title">What Our Clients Say</h2></div>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
              className="card p-8 md:p-12 text-center">
              <div className="flex justify-center gap-1 mb-6">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={`text-xl ${i < t.rating ? 'text-accent' : 'text-gray-200'}`}>★</span>)}</div>
              <blockquote className="font-body text-dark text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">&ldquo;{t.comment}&rdquo;</blockquote>
              <div><p className="font-display text-dark font-bold">{t.clientName}</p><p className="font-body text-muted text-sm mt-1">{t.projectType} · {t.location}</p></div>
            </motion.div>
          </AnimatePresence>
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="w-10 h-10 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"><FiChevronLeft size={18} /></button>
              <div className="flex gap-2">{testimonials.map((_, i) => <button key={i} onClick={() => setIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-primary w-6' : 'bg-gray-300'}`} />)}</div>
              <button onClick={next} className="w-10 h-10 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"><FiChevronRight size={18} /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
