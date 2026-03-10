'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { DEFAULT_COMPANY } from '@/types'
import { FiSend, FiCheckCircle } from 'react-icons/fi'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email('Valid email required'),
  serviceType: z.string().min(1, 'Select a service'),
  projectLocation: z.string().min(2, 'Location required'),
  budget: z.string().min(1, 'Select budget range'),
  message: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const SERVICE_TYPES = ['Residential Construction', 'Commercial Construction', 'Home Renovation', 'Interior Design & Fit-out', 'Civil & Structural Work', 'Other']
const BUDGET_RANGES = ['Under ₹5 Lakhs', '₹5–10 Lakhs', '₹10–25 Lakhs', '₹25–50 Lakhs', '₹50 Lakhs – 1 Crore', 'Above ₹1 Crore']

export default function QuotePage() {
  const company = DEFAULT_COMPANY
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch { setError('Something went wrong. Please try again or call us directly.') }
    finally { setSubmitting(false) }
  }

  if (submitted) return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28 min-h-screen flex items-center justify-center bg-slate">
        <div className="text-center p-12 card max-w-md mx-auto m-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"><FiCheckCircle className="text-green-500" size={30} /></div>
          <h2 className="font-display text-2xl text-dark font-bold mb-3">Quote Request Received!</h2>
          <p className="font-body text-muted mb-6">We&apos;ll get back to you within 24 hours with a detailed estimate.</p>
          <a href="/" className="btn-primary">Back to Home</a>
        </div>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        <section className="section bg-primary">
          <div className="container-custom max-w-2xl text-center">
            <p className="section-label text-accent">Free Estimate</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">Get a Free Quote</h1>
            <p className="font-body text-white/70 text-lg">Fill in your project details and we&apos;ll respond within 24 hours.</p>
          </div>
        </section>
        <section className="section-alt">
          <div className="container-custom max-w-2xl">
            <div className="card p-8 md:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Full Name *</label><input {...register('name')} placeholder="Suresh Kumar" className={`input-field ${errors.name ? 'input-error' : ''}`} />{errors.name && <p className="error-msg">{errors.name.message}</p>}</div>
                  <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Phone *</label><input {...register('phone')} placeholder="+91 93866 55555" className={`input-field ${errors.phone ? 'input-error' : ''}`} />{errors.phone && <p className="error-msg">{errors.phone.message}</p>}</div>
                  <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Email *</label><input {...register('email')} type="email" className={`input-field ${errors.email ? 'input-error' : ''}`} />{errors.email && <p className="error-msg">{errors.email.message}</p>}</div>
                  <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Service Required *</label><select {...register('serviceType')} className={`input-field ${errors.serviceType ? 'input-error' : ''}`}><option value="">Select...</option>{SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}</select>{errors.serviceType && <p className="error-msg">{errors.serviceType.message}</p>}</div>
                  <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Project Location *</label><input {...register('projectLocation')} placeholder="e.g. Jubilee Hills, Hyderabad" className={`input-field ${errors.projectLocation ? 'input-error' : ''}`} />{errors.projectLocation && <p className="error-msg">{errors.projectLocation.message}</p>}</div>
                  <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Budget Range *</label><select {...register('budget')} className={`input-field ${errors.budget ? 'input-error' : ''}`}><option value="">Select...</option>{BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}</select>{errors.budget && <p className="error-msg">{errors.budget.message}</p>}</div>
                </div>
                <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Additional Details (Optional)</label><textarea {...register('message')} rows={4} className="input-field resize-none" /></div>
                {error && <p className="font-body text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center gap-2 py-4 text-base disabled:opacity-60">
                  <FiSend size={18} /> {submitting ? 'Submitting...' : 'Send Quote Request'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
