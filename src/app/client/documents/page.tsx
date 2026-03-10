'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getClientByUid, getDocuments, getProjectById } from '@/lib/firestore'
import type { ProjectDocument, Project } from '@/types'
import { FiDownload, FiSearch } from 'react-icons/fi'

const DOC_ICONS: Record<string, string> = { blueprint: '📐', estimate: '📋', invoice: '🧾', completion: '✅', other: '📄' }

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const client = await getClientByUid(user.uid)
      if (client && client.assignedProjects.length > 0) {
        const docsLists = await Promise.all(client.assignedProjects.map((pId) => getDocuments(pId, true)))
        const allDocs = docsLists.flat()
        setDocuments(allDocs)
        const projs = await Promise.all(client.assignedProjects.map((id) => getProjectById(id)))
        const projMap: Record<string, Project> = {}
        projs.forEach((p) => { if (p) projMap[p.id] = p })
        setProjects(projMap)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="font-display text-3xl text-dark font-bold mb-2">Documents</h1>
      <p className="font-body text-muted text-sm mb-6">All blueprints, estimates, invoices, and reports for your projects.</p>

      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="input-field pl-11" />
      </div>

      {filtered.length === 0 ? (
        <div className="portal-card text-center py-16">
          <p className="font-display text-dark font-bold text-lg mb-2">{search ? 'No results found' : 'No documents yet'}</p>
          <p className="font-body text-muted text-sm">Documents will appear here once uploaded by our team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <div key={doc.id} className="portal-card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{DOC_ICONS[doc.type] ?? '📄'}</span>
                <div>
                  <p className="font-body text-sm font-semibold text-dark">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 font-body text-xs text-muted">
                    <span className="capitalize">{doc.type}</span>
                    <span>·</span>
                    <span>{projects[doc.projectId]?.title ?? 'Project'}</span>
                    <span>·</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 font-body text-sm font-semibold text-primary hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors flex-shrink-0">
                <FiDownload size={15} /> Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
