'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, ClipboardList, User, FileText } from 'lucide-react'
import type { UserRole } from '@/lib/types'

const techNavItems = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/diagnostico', label: 'Nuevo', icon: Plus },
  { href: '/historial', label: 'Historial', icon: ClipboardList },
  { href: '/presupuestos', label: 'Presupuesto', icon: FileText },
  { href: '/perfil', label: 'Perfil', icon: User },
]

const adminNavItems = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/diagnostico', label: 'Nuevo', icon: Plus },
  { href: '/historial', label: 'Historial', icon: ClipboardList },
  { href: '/presupuestos', label: 'Presupuesto', icon: FileText },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export default function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname()

  if (pathname === '/inicio') return null

  const navItems = role === 'admin' ? adminNavItems : techNavItems

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-mp-blue rounded-t-2xl shadow-xl flex items-end px-3 pt-8 pb-safe-4 gap-1 overflow-visible" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/diagnostico' && href !== '/inicio' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className={`transition-all duration-300 ease-out ${
                  isActive ? '-translate-y-5' : 'translate-y-0'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-mp-orange shadow-lg shadow-mp-orange/40 scale-110'
                      : 'bg-transparent scale-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-white/40'
                    }`}
                  />
                </div>
              </div>

              <span
                className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-white/30'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
