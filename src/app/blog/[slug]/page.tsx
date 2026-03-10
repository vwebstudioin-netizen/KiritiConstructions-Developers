import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { FiArrowLeft, FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi'
import { getCompanyInfo, getPostBySlug } from '@/lib/firestore'
import { DEFAULT_COMPANY } from '@/types'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  return { title: post?.title ?? 'Article', description: post?.excerpt }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const [companyData, postData] = await Promise.all([getCompanyInfo(), getPostBySlug(params.slug)])
  const company = companyData ?? DEFAULT_COMPANY
  const post = postData
  if (!post) notFound()

  return (
    <>
      <Navbar companyName={company.name} phone={company.phone} whatsapp={company.whatsapp} />
      <main className="pt-28">
        <section className="section-dark">
          <div className="container-custom max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-body text-sm mb-8 transition-colors">
              <FiArrowLeft size={14} /> Back to Blog
            </Link>
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => <span key={tag} className="badge bg-accent text-dark">{tag}</span>)}
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-white font-bold mb-5 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-6 font-body text-white/50 text-sm">
              <span className="flex items-center gap-1.5"><FiUser size={13} />{post.author}</span>
              <span className="flex items-center gap-1.5"><FiCalendar size={13} />{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </section>

        <section className="section bg-slate">
          <div className="container-custom max-w-3xl">
            <div className="space-y-4">
              {post.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="font-display text-2xl text-dark font-bold mt-10 mb-4">{line.replace('## ', '')}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="font-display text-xl text-dark font-bold mt-8 mb-3">{line.replace('### ', '')}</h3>
                if (line.trim() === '') return null
                return <p key={i} className="font-body text-muted text-base leading-relaxed">{line}</p>
              })}
            </div>

            <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <Link href="/blog" className="inline-flex items-center gap-2 font-body text-sm text-dark/50 hover:text-primary transition-colors">
                <FiArrowLeft size={13} /> Back to Blog
              </Link>
              <Link href="/quote" className="btn-accent gap-2">
                Get Free Quote <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer company={company} />
      <WhatsAppButton whatsapp={company.whatsapp} />
    </>
  )
}
