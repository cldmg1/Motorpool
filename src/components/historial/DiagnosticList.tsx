'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Diagnostic, Profile } from '@/lib/types'
import Badge from '@/components/ui/Badge'

type DiagnosticRow = Diagnostic & { profiles: Pick<Profile, 'full_name' | 'email'> | null }

type Props = {
  diagnostics: DiagnosticRow[]
  total: number
  page: number
  pageSize: number
  searchQuery: string
  isAdmin: boolean
}

export default function DiagnosticList({ diagnostics, total, page, pageSize, searchQuery, isAdmin }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(searchQuery)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', '1')
    router.push(`/historial?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  function goPage(p: number) {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    params.set('page', String(p))
    router.push(`/historial?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-mp-blue">Historial</h1>
          <p className="text-sm text-gray-400">{total} diagnósticos</p>
        </div>
        <Link
          href="/diagnostico"
          className="bg-mp-orange text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-mp-orange-dark transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
          placeholder="Buscar por cliente o modelo..."
        />
        <button
          type="submit"
          className="bg-mp-blue text-white px-4 rounded-xl font-bold text-sm hover:bg-mp-blue-dark transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* List */}
      {diagnostics.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">No hay diagnósticos</p>
          {searchQuery && <p className="text-sm mt-1">Prueba con otra búsqueda</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {diagnostics.map(d => (
            <Link
              key={d.id}
              href={`/diagnostico/${d.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-mp-blue/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-mp-blue truncate">{d.cliente}</p>
                  <p className="text-sm text-gray-500 truncate">{d.modelo}</p>
                  {isAdmin && d.profiles && (
                    <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-wider">
                      {d.profiles.full_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant="green">Completado</Badge>
                  <p className="text-[10px] text-gray-400">
                    {new Date(d.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-gray-500 font-medium px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
