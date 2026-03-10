import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, setDoc, addDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import {
  DEFAULT_COMPANY, DEFAULT_SERVICES, DEFAULT_PROJECTS,
  DEFAULT_TESTIMONIALS, DEFAULT_TEAM, DEFAULT_BLOG,
} from '@/types'

async function clearCollection(col: string) {
  const snap = await getDocs(collection(db, col))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

export async function POST(req: NextRequest) {
  try {
    const { section } = await req.json()
    const results: Record<string, string> = {}

    // ─── Company Info ──────────────────────────────────────────────
    if (section === 'all' || section === 'company') {
      await setDoc(doc(db, 'company', 'main'), DEFAULT_COMPANY)
      results.company = 'Saved company info'
    }

    // ─── Services ─────────────────────────────────────────────────
    if (section === 'all' || section === 'services') {
      await clearCollection('services')
      for (const s of DEFAULT_SERVICES) {
        const { id, ...data } = s
        await setDoc(doc(db, 'services', id), data)
      }
      results.services = `Seeded ${DEFAULT_SERVICES.length} services`
    }

    // ─── Projects ─────────────────────────────────────────────────
    if (section === 'all' || section === 'projects') {
      await clearCollection('projects')
      for (const p of DEFAULT_PROJECTS) {
        const { id, ...data } = p
        await setDoc(doc(db, 'projects', id), data)
      }
      results.projects = `Seeded ${DEFAULT_PROJECTS.length} projects`
    }

    // ─── Testimonials ─────────────────────────────────────────────
    if (section === 'all' || section === 'testimonials') {
      await clearCollection('testimonials')
      for (const t of DEFAULT_TESTIMONIALS) {
        const { id, ...data } = t
        await setDoc(doc(db, 'testimonials', id), data)
      }
      results.testimonials = `Seeded ${DEFAULT_TESTIMONIALS.length} testimonials`
    }

    // ─── Team ─────────────────────────────────────────────────────
    if (section === 'all' || section === 'team') {
      await clearCollection('team')
      for (const m of DEFAULT_TEAM) {
        const { id, ...data } = m
        await setDoc(doc(db, 'team', id), data)
      }
      results.team = `Seeded ${DEFAULT_TEAM.length} team members`
    }

    // ─── Blog ─────────────────────────────────────────────────────
    if (section === 'all' || section === 'blog') {
      await clearCollection('blog')
      for (const b of DEFAULT_BLOG) {
        const { id, ...data } = b
        await setDoc(doc(db, 'blog', id), data)
      }
      results.blog = `Seeded ${DEFAULT_BLOG.length} blog posts`
    }

    return NextResponse.json({ success: true, results })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
