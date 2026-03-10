'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { await signInWithEmailAndPassword(auth, email, password); router.push('/admin') }
    catch { setError('Invalid email or password.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-white font-display font-bold text-xl">RC</span></div>
          <h1 className="font-display text-3xl text-dark font-bold">Admin Login</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div><label className="block font-body text-sm font-medium text-dark mb-2">Email</label><div className="relative"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" required /></div></div>
            <div><label className="block font-body text-sm font-medium text-dark mb-2">Password</label><div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 pr-11" required /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">{showPw ? <FiEyeOff /> : <FiEye />}</button></div></div>
            {error && <p className="font-body text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary justify-center disabled:opacity-60">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
