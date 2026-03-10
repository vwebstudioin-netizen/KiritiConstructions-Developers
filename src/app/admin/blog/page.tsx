'use client'
import { useEffect, useState } from 'react'
import { getAllPosts, addPost, updatePost, deletePost } from '@/lib/firestore'
import type { BlogPost } from '@/types'
import { FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'

const EMPTY: Omit<BlogPost, 'id'> = { title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: [], author: '', publishedAt: new Date().toISOString().split('T')[0], isPublished: false, sortOrder: 0 }

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [form, setForm] = useState(EMPTY)
  const [tagInput, setTagInput] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { getAllPosts().then(setPosts) }, [])
  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async (publish: boolean) => {
    if (!form.title || !form.content) return
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const id = await addPost({ ...form, slug, isPublished: publish })
    setPosts((p) => [...p, { ...form, slug, id, isPublished: publish }])
    setForm(EMPTY); setTagInput(''); setShowForm(false); showMsg(publish ? 'Published!' : 'Draft saved!')
  }

  const addTag = () => { if (!tagInput.trim()) return; setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] })); setTagInput('') }
  const toggle = async (id: string, val: boolean) => { await updatePost(id, { isPublished: !val }); setPosts((p) => p.map((post) => post.id === id ? { ...post, isPublished: !val } : post)) }
  const remove = async (id: string) => { if (!confirm('Delete?')) return; await deletePost(id); setPosts((p) => p.filter((post) => post.id !== id)) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-dark font-bold">Blog</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2"><FiPlus /> New Post</button>
      </div>
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">{message}</div>}
      {showForm && (
        <div className="admin-card mb-6">
          <h2 className="font-display text-lg text-dark font-bold mb-4">Write Post</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" /></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Author</label><input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input-field" /></div>
            <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Excerpt</label><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="input-field resize-none" /></div>
            <div className="md:col-span-2"><label className="block font-body text-sm font-medium text-dark mb-1.5">Content (Markdown)</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className="input-field resize-none font-mono text-xs" /></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Tags</label><div className="flex gap-2 mb-2"><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} className="input-field flex-1" /><button onClick={addTag} className="btn-primary px-4"><FiPlus /></button></div><div className="flex flex-wrap gap-2">{form.tags.map((t, i) => <span key={i} className="badge-primary cursor-pointer hover:bg-red-100 hover:text-red-600" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}>{t} ×</span>)}</div></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-1.5">Date</label><input type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="input-field" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleAdd(true)} className="btn-primary gap-2"><FiEye /> Publish</button>
            <button onClick={() => handleAdd(false)} className="btn-outline">Save Draft</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}
      <div className="admin-card space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-4 p-4 bg-slate rounded-xl border border-gray-100">
            <div className="flex-1"><div className="flex items-center gap-2 flex-wrap mb-0.5"><span className="font-body font-semibold text-dark text-sm">{p.title}</span>{p.isPublished ? <span className="badge-green">Published</span> : <span className="badge-gray">Draft</span>}{p.tags.slice(0, 2).map((t) => <span key={t} className="badge-accent">{t}</span>)}</div><p className="font-body text-xs text-muted">{p.author} · {p.publishedAt}</p></div>
            <div className="flex gap-2"><button onClick={() => toggle(p.id, p.isPublished)} className={`p-2 rounded-xl transition-colors ${p.isPublished ? 'text-green-500 bg-green-50' : 'text-muted bg-gray-100'}`}>{p.isPublished ? <FiEye size={15} /> : <FiEyeOff size={15} />}</button><button onClick={() => remove(p.id)} className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors"><FiTrash2 size={15} /></button></div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center font-body text-muted py-8 text-sm">No posts yet.</p>}
      </div>
    </div>
  )
}
