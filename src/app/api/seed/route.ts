import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import {
  DEFAULT_COMPANY, DEFAULT_SERVICES, DEFAULT_PROJECTS,
  DEFAULT_TESTIMONIALS, DEFAULT_TEAM, DEFAULT_BLOG,
} from '@/types'

// Using Firebase Admin SDK — bypasses security rules for server-side seeding

async function clearCollection(col: string) {
  const snap = await adminDb.collection(col).get()
  const batch = adminDb.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  if (snap.size > 0) await batch.commit()
}

async function clearSubcollection(parentCol: string, parentId: string, subCol: string) {
  const snap = await adminDb.collection(parentCol).doc(parentId).collection(subCol).get()
  const batch = adminDb.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  if (snap.size > 0) await batch.commit()
}

// ─── Demo Payments ─────────────────────────────────────────────────────────
const DEMO_PAYMENTS = [
  // Project 1 — Villa (completed)
  { id: 'pay-1', projectId: '1', clientId: 'client-1', description: 'Foundation & Plinth Beam', amount: 1800000, status: 'paid', paidAt: '2024-03-15', createdAt: '2024-03-01' },
  { id: 'pay-2', projectId: '1', clientId: 'client-1', description: 'Ground Floor Slab', amount: 1800000, status: 'paid', paidAt: '2024-06-10', createdAt: '2024-06-01' },
  { id: 'pay-3', projectId: '1', clientId: 'client-1', description: 'Finishing & Handover', amount: 1440000, status: 'paid', paidAt: '2024-09-20', createdAt: '2024-09-01' },

  // Project 2 — Office Complex (completed)
  { id: 'pay-4', projectId: '2', clientId: '', description: 'Advance — 25%', amount: 6000000, status: 'paid', paidAt: '2023-01-10', createdAt: '2023-01-05' },
  { id: 'pay-5', projectId: '2', clientId: '', description: 'Ground + 1st Floor Slab', amount: 6000000, status: 'paid', paidAt: '2023-07-15', createdAt: '2023-07-01' },
  { id: 'pay-6', projectId: '2', clientId: '', description: 'Finishing & MEP', amount: 6000000, status: 'paid', paidAt: '2024-01-20', createdAt: '2024-01-01' },
  { id: 'pay-7', projectId: '2', clientId: '', description: 'Final Retention Payment', amount: 6000000, status: 'paid', paidAt: '2024-03-10', createdAt: '2024-03-01' },

  // Project 3 — Apartments (ongoing)
  { id: 'pay-8', projectId: '3', clientId: 'client-2', description: 'Advance — 20%', amount: 3000000, status: 'paid', paidAt: '2024-01-15', createdAt: '2024-01-10' },
  { id: 'pay-9', projectId: '3', clientId: 'client-2', description: 'Foundation & Ground Floor', amount: 3000000, status: 'paid', paidAt: '2024-05-20', createdAt: '2024-05-10' },
  { id: 'pay-10', projectId: '3', clientId: 'client-2', description: '1st & 2nd Floor Slab', amount: 3000000, status: 'paid', paidAt: '2024-09-15', createdAt: '2024-09-01' },
  { id: 'pay-11', projectId: '3', clientId: 'client-2', description: '3rd Floor & Terrace', amount: 3000000, status: 'pending', createdAt: '2025-01-10' },
  { id: 'pay-12', projectId: '3', clientId: 'client-2', description: 'Finishing — Doors, Windows, Plaster', amount: 3000000, status: 'pending', createdAt: '2025-03-01' },
]

// ─── Demo Site Teams ────────────────────────────────────────────────────────
const DEMO_SITE_TEAMS: Record<string, { name: string; role: string; phone: string }[]> = {
  '1': [
    { name: 'Ramu Yadav', role: 'Site Engineer', phone: '+91 98001 22334' },
    { name: 'Krishna Babu', role: 'Head Mason', phone: '+91 97001 55667' },
    { name: 'Suresh Nayak', role: 'Foreman', phone: '+91 93001 88990' },
  ],
  '3': [
    { name: 'Venkata Rao', role: 'Site Engineer', phone: '+91 98765 11223' },
    { name: 'Nagesh Reddy', role: 'Head Mason', phone: '+91 96001 44556' },
    { name: 'Prakash Goud', role: 'Foreman', phone: '+91 94001 77889' },
    { name: 'Ravi Kiran', role: 'Bar Bender Foreman', phone: '+91 92001 33445' },
  ],
}

// ─── Demo Materials for Project 3 (Ongoing) ────────────────────────────────
const DEMO_MATERIALS_P3 = [
  { name: 'Sand', unit: 'loads', category: 'Aggregate', lowStockThreshold: 5, totalInward: 42, totalConsumed: 38, sortOrder: 1 },
  { name: 'Cement (53 Grade)', unit: 'bags', category: 'Binding', lowStockThreshold: 50, totalInward: 840, totalConsumed: 810, sortOrder: 2 },
  { name: 'Coarse Aggregate (Jelly)', unit: 'cubic meters', category: 'Aggregate', lowStockThreshold: 10, totalInward: 95, totalConsumed: 88, sortOrder: 3 },
  { name: 'Steel Rods 10mm', unit: 'kg', category: 'Steel', lowStockThreshold: 500, totalInward: 12400, totalConsumed: 11200, sortOrder: 4 },
  { name: 'Steel Rods 12mm', unit: 'kg', category: 'Steel', lowStockThreshold: 500, totalInward: 8600, totalConsumed: 8100, sortOrder: 5 },
  { name: 'Binding Wire', unit: 'kg', category: 'Steel', lowStockThreshold: 20, totalInward: 180, totalConsumed: 168, sortOrder: 6 },
  { name: 'Bricks', unit: 'pieces', category: 'Masonry', lowStockThreshold: 2000, totalInward: 48000, totalConsumed: 44000, sortOrder: 7 },
  { name: 'Water', unit: 'tankers', category: 'Other', lowStockThreshold: 2, totalInward: 320, totalConsumed: 318, sortOrder: 8 },
]

// ─── Demo Daily Reports for Project 3 ─────────────────────────────────────
const DEMO_DAILY_REPORTS = [
  { date: '2025-03-07', supervisorName: 'Venkata Rao', supervisorId: 'demo-sup-1', workDone: 'Completed 3rd floor column casting for Grid A and B. Bar bending work started for roof slab.', laborCount: 28, weatherCondition: 'Sunny', materialsHighlight: 'Used 40 bags cement, 1 load sand, 480kg steel rods', issuesReported: '', createdAt: '2025-03-07T17:30:00.000Z' },
  { date: '2025-03-06', supervisorName: 'Venkata Rao', supervisorId: 'demo-sup-1', workDone: 'Shuttering work completed for all 3rd floor columns. Reinforcement inspection done and approved.', laborCount: 24, weatherCondition: 'Cloudy', materialsHighlight: 'Used 18 shuttering plates, 12kg binding wire', issuesReported: 'One worker absent — replaced from local labour', createdAt: '2025-03-06T17:30:00.000Z' },
  { date: '2025-03-05', supervisorName: 'Venkata Rao', supervisorId: 'demo-sup-1', workDone: 'Block masonry completed for 2nd floor staircase wall. Plastering work started on 1st floor.', laborCount: 22, weatherCondition: 'Sunny', materialsHighlight: 'Used 450 bricks, 22 bags cement, 0.5 loads sand', issuesReported: '', createdAt: '2025-03-05T17:30:00.000Z' },
]

export async function POST(req: NextRequest) {
  try {
    const { section } = await req.json()
    const results: Record<string, string> = {}

    // ─── Company Info ──────────────────────────────────────────────
    if (section === 'all' || section === 'company') {
      await adminDb.collection('company').doc('main').set(DEFAULT_COMPANY)
      results.company = 'Saved company info'
    }

    // ─── Services ─────────────────────────────────────────────────
    if (section === 'all' || section === 'services') {
      await clearCollection('services')
      for (const s of DEFAULT_SERVICES) {
        const { id, ...data } = s
        await adminDb.collection('services').doc(id).set(data)
      }
      results.services = `Seeded ${DEFAULT_SERVICES.length} services`
    }

    // ─── Projects ─────────────────────────────────────────────────
    if (section === 'all' || section === 'projects') {
      await clearCollection('projects')
      for (const p of DEFAULT_PROJECTS) {
        const { id, ...data } = p
        await adminDb.collection('projects').doc(id).set(data)
      }
      results.projects = `Seeded ${DEFAULT_PROJECTS.length} projects`
    }

    // ─── Payments ─────────────────────────────────────────────────
    if (section === 'all' || section === 'payments') {
      await clearCollection('payments')
      for (const p of DEMO_PAYMENTS) {
        const { id, ...data } = p
        await adminDb.collection('payments').doc(id).set(data)
      }
      results.payments = `Seeded ${DEMO_PAYMENTS.length} payments across 3 projects`
    }

    // ─── Site Teams ────────────────────────────────────────────────
    if (section === 'all' || section === 'siteTeams') {
      for (const [projectId, members] of Object.entries(DEMO_SITE_TEAMS)) {
        await clearSubcollection('projects', projectId, 'team')
        for (const m of members) {
          await adminDb.collection('projects').doc(projectId).collection('team').add({ ...m, createdAt: new Date().toISOString() })
        }
      }
      const total = Object.values(DEMO_SITE_TEAMS).reduce((s, m) => s + m.length, 0)
      results.siteTeams = `Seeded ${total} site team members across 2 projects`
    }

    // ─── Materials (Project 3 — ongoing) ──────────────────────────
    if (section === 'all' || section === 'materials') {
      await clearSubcollection('projects', '3', 'materials')
      for (const m of DEMO_MATERIALS_P3) {
        await adminDb.collection('projects').doc('3').collection('materials').add(m)
      }
      results.materials = `Seeded ${DEMO_MATERIALS_P3.length} materials for G+3 Apartment project`
    }

    // ─── Daily Reports (Project 3) ─────────────────────────────────
    if (section === 'all' || section === 'dailyReports') {
      await clearSubcollection('projects', '3', 'dailyReports')
      for (const r of DEMO_DAILY_REPORTS) {
        await adminDb.collection('projects').doc('3').collection('dailyReports').add({ ...r, projectId: '3' })
      }
      results.dailyReports = `Seeded ${DEMO_DAILY_REPORTS.length} daily reports for G+3 Apartment project`
    }

    // ─── Testimonials ─────────────────────────────────────────────
    if (section === 'all' || section === 'testimonials') {
      await clearCollection('testimonials')
      for (const t of DEFAULT_TESTIMONIALS) {
        const { id, ...data } = t
        await adminDb.collection('testimonials').doc(id).set(data)
      }
      results.testimonials = `Seeded ${DEFAULT_TESTIMONIALS.length} testimonials`
    }

    // ─── Team ─────────────────────────────────────────────────────
    if (section === 'all' || section === 'team') {
      await clearCollection('team')
      for (const m of DEFAULT_TEAM) {
        const { id, ...data } = m
        await adminDb.collection('team').doc(id).set(data)
      }
      results.team = `Seeded ${DEFAULT_TEAM.length} team members`
    }

    // ─── Blog ─────────────────────────────────────────────────────
    if (section === 'all' || section === 'blog') {
      await clearCollection('blog')
      for (const b of DEFAULT_BLOG) {
        const { id, ...data } = b
        await adminDb.collection('blog').doc(id).set(data)
      }
      results.blog = `Seeded ${DEFAULT_BLOG.length} blog posts`
    }

    return NextResponse.json({ success: true, results })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
