'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiMonitor, FiArrowRight } from 'react-icons/fi'

const FEATURES = [
  { icon: '📊', title: 'Live Progress Tracking', desc: 'View milestone-by-milestone updates with photos in real time.' },
  { icon: '📄', title: 'Document Access', desc: 'Download blueprints, estimates, and invoices anytime.' },
  { icon: '💰', title: 'Payment Tracking', desc: 'View all pending and completed payments for your project at a glance.' },
  { icon: '🔔', title: 'Instant Notifications', desc: 'Get email alerts on every milestone completion or update.' },
]

export default function ClientPortalCTA() {
  return (
    <section className="section bg-slate">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-label">Client Portal</p>
            <h2 className="section-title mb-6">Track Your Project Online</h2>
            <p className="section-subtitle mb-8">Every client gets a private portal to monitor their project progress, view documents, and make payments — all in one place.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="card p-4">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h4 className="font-display text-dark font-bold text-sm mb-1">{f.title}</h4>
                  <p className="font-body text-muted text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/client/login" className="btn-primary gap-2">
              <FiMonitor size={16} /> Access Client Portal <FiArrowRight size={14} />
            </Link>
          </div>

          {/* Mock portal preview */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between">
              <div><p className="text-white font-display font-bold text-sm">G+3 Apartment Block</p><p className="text-white/60 text-xs font-body">Project #RC-2024-003</p></div>
              <span className="badge bg-accent text-dark">Ongoing</span>
            </div>
            {/* Progress */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between mb-2"><span className="font-body text-sm text-dark font-semibold">Overall Progress</span><span className="font-body text-sm text-accent font-bold">60%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '60%' }} /></div>
            </div>
            {/* Milestones */}
            <div className="p-5">
              <p className="font-body text-xs text-muted uppercase tracking-wider mb-4">Milestones</p>
              {[
                { title: 'Foundation Complete', pct: 20, status: 'completed' },
                { title: 'Ground Floor Slab', pct: 35, status: 'completed' },
                { title: 'First Floor Structure', pct: 55, status: 'completed' },
                { title: 'Second Floor Structure', pct: 70, status: 'in-progress' },
                { title: 'Third Floor & Terrace', pct: 85, status: 'pending' },
                { title: 'Finishing & Handover', pct: 100, status: 'pending' },
              ].map((m) => (
                <div key={m.title} className="flex items-center gap-3 mb-3">
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${m.status === 'completed' ? 'bg-green-100 text-green-600' : m.status === 'in-progress' ? 'bg-accent/20 text-accent-dark' : 'bg-gray-100 text-muted'}`}>
                    {m.status === 'completed' ? '✓' : m.status === 'in-progress' ? '●' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-body text-xs text-dark truncate">{m.title}</span>
                      <span className="font-body text-xs text-muted flex-shrink-0">{m.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Payment CTA */}
            <div className="p-5 bg-accent/10 border-t border-accent/20 flex items-center justify-between gap-3">
              <div><p className="font-body text-xs text-dark font-semibold">Next Payment Due</p><p className="font-body text-xs text-muted">2nd Floor Completion — ₹2,00,000</p></div>
              <button className="btn-accent text-xs px-4 py-2">Pay Now</button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
