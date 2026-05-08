'use client'

import type { Profile } from '@/lib/types'
import Badge from '@/components/ui/Badge'

export default function UsuariosClient({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-mp-blue">Usuarios</h1>
        <p className="text-sm text-gray-400">{profiles.length} usuarios registrados</p>
      </div>

      <div className="space-y-2">
        {profiles.map(profile => (
          <div key={profile.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
            <div>
              <p className="font-bold text-sm text-mp-blue">{profile.full_name}</p>
              <p className="text-xs text-gray-400">@{profile.email.split('@')[0]}</p>
            </div>
            <Badge variant={profile.role === 'admin' ? 'orange' : 'blue'}>
              {profile.role === 'admin' ? 'Admin' : 'Técnico'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
