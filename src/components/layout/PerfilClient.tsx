'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Profile } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function PerfilClient({ profile }: { profile: Profile & { has_changed_password: boolean } }) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!profile.has_changed_password) setShowBanner(true)
  }, [profile.has_changed_password])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-mp-blue">Mi Perfil</h1>

      {showBanner && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">Cambia tu contraseña</p>
            <p className="text-xs text-amber-700 mt-0.5">Estás usando la contraseña predeterminada. Cámbiala por una segura desde ajustes.</p>
            <Link href="/ajustes" className="inline-block mt-1.5 text-xs font-bold text-amber-800 underline underline-offset-2">
              Ir a Ajustes →
            </Link>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-mp-blue flex items-center justify-center text-white font-bold text-xl">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-mp-blue text-lg">{profile.full_name}</p>
            <p className="text-sm text-gray-400">@{profile.email.split('@')[0]}</p>
            <div className="mt-1">
              <Badge variant={profile.role === 'admin' ? 'orange' : 'blue'}>
                {profile.role === 'admin' ? 'Administrador' : 'Técnico SAT'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
