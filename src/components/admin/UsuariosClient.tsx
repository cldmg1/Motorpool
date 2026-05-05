'use client'

import { useState } from 'react'
import type { Profile, UserRole } from '@/lib/types'
import { createUser, updateUserRole } from '@/actions/users'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function UsuariosClient({ profiles }: { profiles: Profile[] }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'technician' as UserRole })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await createUser(form.email, form.password, form.full_name, form.role)
    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      setForm({ email: '', password: '', full_name: '', role: 'technician' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-mp-blue">Usuarios</h1>
          <p className="text-sm text-gray-400">{profiles.length} usuarios registrados</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'primary'}>
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <h2 className="text-sm font-bold text-mp-blue mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre completo</label>
                <input
                  required
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
                  placeholder="Juan García"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
                  placeholder="tecnico@motorpool.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
                >
                  <option value="technician">Técnico SAT</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <Button type="submit" loading={saving} className="w-full">
              Crear Usuario
            </Button>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="space-y-2">
        {profiles.map(profile => (
          <div key={profile.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
            <div>
              <p className="font-bold text-sm text-mp-blue">{profile.full_name}</p>
              <p className="text-xs text-gray-400">{profile.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={profile.role === 'admin' ? 'orange' : 'blue'}>
                {profile.role === 'admin' ? 'Admin' : 'Técnico'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
