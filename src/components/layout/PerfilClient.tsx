'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function PerfilClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Mínimo 6 caracteres')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setError(error.message)
    } else {
      setMsg('Contraseña actualizada correctamente.')
      setNewPassword('')
    }
    setSaving(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-mp-blue">Mi Perfil</h1>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-mp-blue flex items-center justify-center text-white font-bold text-xl">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-mp-blue text-lg">{profile.full_name}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            <div className="mt-1">
              <Badge variant={profile.role === 'admin' ? 'orange' : 'blue'}>
                {profile.role === 'admin' ? 'Administrador' : 'Técnico SAT'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-bold text-mp-blue mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={6}
              required
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          {msg && <p className="text-green-600 text-xs bg-green-50 px-3 py-2 rounded-xl">{msg}</p>}
          <Button type="submit" loading={saving} className="w-full">
            Actualizar Contraseña
          </Button>
        </form>
      </Card>

      <button
        onClick={handleLogout}
        className="w-full text-red-400 font-bold text-sm py-3 hover:text-red-500 transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}
