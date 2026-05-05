'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    router.push('/diagnostico')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="https://i.postimg.cc/bv1cQ0GM/Imagotipo-Vertical-con-Eslogan-PNG-COLOR.png"
            alt="MotorPool"
            width={160}
            height={80}
            className="mx-auto object-contain mb-4"
            priority
          />
          <p className="text-sm text-gray-500 font-medium">Acceso para Técnicos SAT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
              placeholder="tecnico@motorpool.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-mp-orange text-white font-bold text-sm transition-all hover:bg-mp-orange-dark disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Accediendo...' : 'Acceder al Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
