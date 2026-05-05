'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function Navbar({ profile }: { profile: Profile }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/diagnostico" className="flex items-center gap-3">
          <Image
            src="https://i.postimg.cc/bv1cQ0GM/Imagotipo-Vertical-con-Eslogan-PNG-COLOR.png"
            alt="MotorPool"
            width={90}
            height={36}
            className="object-contain"
          />
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-mp-blue leading-tight">{profile.full_name}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              {profile.role === 'admin' ? 'Administrador' : 'Técnico SAT'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
