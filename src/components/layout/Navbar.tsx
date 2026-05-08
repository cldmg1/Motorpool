'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import type { Profile } from '@/lib/types'
import Sidebar from '@/components/layout/Sidebar'

export default function Navbar({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <Link href="/inicio" className="flex items-center gap-3">
            <Image
              src="https://i.postimg.cc/bv1cQ0GM/Imagotipo-Vertical-con-Eslogan-PNG-COLOR.png"
              alt="MotorPool"
              width={90}
              height={36}
              className="object-contain"
            />
          </Link>

          <div className="flex items-center">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-mp-blue hover:bg-mp-blue/5 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <Sidebar open={open} onClose={() => setOpen(false)} role={profile.role} />
    </>
  )
}
