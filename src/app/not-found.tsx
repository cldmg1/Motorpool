export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl font-black text-mp-blue mb-4">404</p>
        <p className="text-gray-500 mb-6">Página no encontrada</p>
        <Link
          href="/diagnostico"
          className="bg-mp-orange text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-mp-orange-dark transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
