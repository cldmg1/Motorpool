'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Plus, ClipboardList, User, Settings, LogOut, X, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

const techItems = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/diagnostico', label: 'Nuevo Parte', icon: Plus },
  { href: '/historial', label: 'Historial', icon: ClipboardList },
  { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

const adminItems = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/diagnostico', label: 'Nuevo Parte', icon: Plus },
  { href: '/historial', label: 'Historial', icon: ClipboardList },
  { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

type Props = {
  open: boolean
  onClose: () => void
  role: UserRole
}

export default function Sidebar({ open, onClose, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const items = role === 'admin' ? adminItems : techItems

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="font-black text-mp-blue text-sm uppercase tracking-widest">Menú</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-mp-blue hover:bg-mp-blue/5 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== '/diagnostico' && href !== '/inicio' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${
                  href === '/diagnostico'
                    ? isActive
                      ? 'bg-mp-orange text-white'
                      : 'bg-orange-50 text-mp-orange hover:bg-orange-100'
                    : isActive
                    ? 'bg-mp-blue text-white'
                    : 'text-gray-500 hover:text-mp-blue hover:bg-mp-blue/5'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
