import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi'
import { getCompanyInfo, getPublishedPosts } from '@/lib/firestore'
import { DEFAULT_COMPANY, DEFAULT_BLOG } from '@/types'

export const metadata: Metadata = {
  title: 'Blog & News',
  description: 'Construction tips, project updates, and industry news from Kiriti Constructions & Developers.',
}
export const revalidate = 60

export default async function BlogPage() {
  const [companyData, postsData] = await Promise.all([getCompanyInfo(), getPublishedPosts()])
  const company = companyData ?? DEFAULT_COMPANY
  const posts = postsData.length > 0 ? postsData : DEFAULT_BLOG

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        <section className="section-dark">
          <div className="container-custom text-center">
            <p className="font-body text-accent text-xs tracking-[4px] uppercase mb-3">Knowledge Hub</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">Blog & News</h1>
            <p className="font-body text-white/60 text-lg">Construction tips, project updates, and industry insights.</p>
          </div>
        </section>

        <section className="section bg-slate">
          <div className="container-custom">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-display text-dark font-bold text-xl mb-2">No posts yet</p>
                <p className="font-body text-muted text-sm">Check back soon for updates and news.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="admin-card group hover:-translate-y-1 transition-transform block">
                    <div className="relative h-48 bg-primary-100 overflow-hidden -mx-6 -mt-6 mb-5 rounded-t-2xl">
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center group-hover:from-primary-700 transition-all">
                        <span className="text-white/20 font-display text-5xl font-bold">{post.title[0]}</span>
                      </div>
                      {post.tags.length > 0 && (
                        <span className="absolute top-3 left-3 badge bg-accent text-dark">{post.tags[0]}</span>
                      )}
                    </div>
                    <h2 className="font-display text-lg text-dark font-bold group-hover:text-primary transition-colors mb-2 line-clamp-2">{post.title}</h2>
                    <p className="font-body text-muted text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs font-body text-muted">
                      <span className="flex items-center gap-1"><FiUser size={11} />{post.author}</span>
                      <span className="flex items-center gap-1"><FiCalendar size={11} />{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
