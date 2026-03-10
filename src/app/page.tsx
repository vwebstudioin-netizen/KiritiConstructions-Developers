import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowRight, FiPhone, FiCheckCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { getCompanyInfo, getAvailableServices, getVisibleProjects, getVisibleTestimonials } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_SERVICES, DEFAULT_PROJECTS, DEFAULT_TESTIMONIALS } from '@/types'
import HeroSection from '@/components/home/HeroSection'
import ServicesOverview from '@/components/home/ServicesOverview'
import FeaturedProjects from '@/components/home/FeaturedProjects'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import ClientPortalCTA from '@/components/home/ClientPortalCTA'

export const revalidate = 60

export default async function Home() {
  const [companyData, servicesData, projectsData, testimonialsData] = await Promise.all([
    getCompanyInfo(), getAvailableServices(), getVisibleProjects(), getVisibleTestimonials(),
  ])
  const company = companyData ?? DEFAULT_COMPANY
  const services = servicesData.length > 0 ? servicesData : DEFAULT_SERVICES
  const projects = projectsData.length > 0 ? projectsData : DEFAULT_PROJECTS
  const testimonials = testimonialsData.length > 0 ? testimonialsData : DEFAULT_TESTIMONIALS

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main>
        <HeroSection company={company} />
        <ServicesOverview services={services} />
        <FeaturedProjects projects={projects} />
        <WhyChooseUs />
        <ClientPortalCTA />
        <TestimonialsSection testimonials={testimonials} />
        {/* CTA */}
        <section className="py-16 bg-accent">
          <div className="container-custom text-center">
            <h2 className="font-display text-3xl md:text-4xl text-dark font-bold mb-4">Ready to Start Your Project?</h2>
            <p className="font-body text-dark/70 text-lg mb-8 max-w-xl mx-auto">Get a free site visit and detailed estimate. No obligations, no hidden charges.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/quote" className="btn-primary gap-2">Get Free Quote <FiArrowRight size={16} /></Link>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dark text-dark rounded-xl font-body font-semibold text-sm hover:bg-dark hover:text-white transition-all">Contact Us</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
