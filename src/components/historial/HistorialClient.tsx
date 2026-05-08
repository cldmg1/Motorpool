'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { sileo } from 'sileo'
import type { DiagnosticWithItems, Profile } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import { deleteDiagnostic } from '@/actions/diagnostics'

type Props = {
  diagnostics: (DiagnosticWithItems & { profiles: Pick<Profile, 'full_name' | 'email'> | null })[]
  isAdmin: boolean
  technicians: { id: string; full_name: string }[]
}

type StatusFilter = 'all' | 'completed' | 'en_espera' | 'draft'
type SortOption = 'newest' | 'oldest' | 'cliente_az' | 'modelo_az'

export default function HistorialClient({ diagnostics, isAdmin, technicians }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [techFilter, setTechFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let result = diagnostics.filter(d => {
      if (q) {
        const matchesSearch =
          d.cliente.toLowerCase().includes(q) ||
          d.modelo.toLowerCase().includes(q) ||
          (d.numero_serie?.toLowerCase().includes(q) ?? false)
        if (!matchesSearch) return false
      }
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (isAdmin && techFilter && d.user_id !== techFilter) return false

      // Date range filter
      if (dateFrom) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        if (new Date(d.created_at) < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(d.created_at) > to) return false
      }

      return true
    })

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'cliente_az') return a.cliente.localeCompare(b.cliente)
      if (sortBy === 'modelo_az') return a.modelo.localeCompare(b.modelo)
      return 0
    })

    return result
  }, [diagnostics, search, statusFilter, techFilter, isAdmin, dateFrom, dateTo, sortBy])

  function handleDelete(id: string, cliente: string) {
    sileo.show({
      type: 'error',
      title: '¿Eliminar parte?',
      description: `${cliente} — Esta acción es irreversible. Si no tienes copia guardada no podrás recuperarlo. ¿Estás seguro?`,
      duration: 8000,
      button: {
        title: 'Eliminar',
        onClick: async () => {
          setDeletingId(id)
          const result = await deleteDiagnostic(id)
          setDeletingId(null)
          if (result.error) {
            sileo.error({ title: 'Error al eliminar', description: result.error })
          } else {
            sileo.success({ title: 'Parte eliminado' })
            router.refresh()
          }
        },
      },
    })
  }

  const statusPills: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Finalizados', value: 'completed' },
    { label: 'En espera', value: 'en_espera' },
    { label: 'Abiertos', value: 'draft' },
  ]

  const statusBadge = (status: string) => {
    if (status === 'completed') return <Badge variant="red">Finalizado</Badge>
    if (status === 'en_espera') return <Badge variant="amber">En espera</Badge>
    return <Badge variant="green">Abierto</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-mp-blue">Historial</h1>
          <p className="text-sm text-gray-400">{filtered.length} diagnósticos</p>
        </div>
        <Link
          href="/diagnostico"
          className="bg-mp-orange text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-mp-orange/90 transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, modelo o nº serie..."
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
        />
      </div>

      {/* Date range + sort */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-xs"
            title="Desde"
          />
          <span className="text-gray-400 text-xs shrink-0">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-xs"
            title="Hasta"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-xs font-bold text-gray-600"
        >
          <option value="newest">Más reciente</option>
          <option value="oldest">Más antiguo</option>
          <option value="cliente_az">Cliente A-Z</option>
          <option value="modelo_az">Modelo A-Z</option>
        </select>
      </div>

      {/* Filter pills + tech dropdown */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {statusPills.map(pill => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                statusFilter === pill.value
                  ? 'bg-mp-blue text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
        {isAdmin && technicians.length > 0 && (
          <select
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 border-none outline-none focus:ring-2 focus:ring-mp-blue cursor-pointer"
          >
            <option value="">Todos los técnicos</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">No hay diagnósticos</p>
          {(search || statusFilter !== 'all' || techFilter || dateFrom || dateTo) && (
            <p className="text-sm mt-1">Prueba con otros filtros</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <Link
              key={d.id}
              href={`/diagnostico/${d.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-mp-blue/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-mp-blue truncate">{d.cliente}</p>
                  <p className="text-sm text-gray-500 truncate">{d.modelo}</p>
                  {d.numero_serie && (
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">S/N: {d.numero_serie}</p>
                  )}
                  {isAdmin && d.profiles && (
                    <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-wider">
                      {d.profiles.full_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {statusBadge(d.status)}
                  <p className="text-[10px] text-gray-400">
                    {new Date(d.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </p>
                  <button
                    onClick={e => { e.preventDefault(); handleDelete(d.id, d.cliente) }}
                    disabled={deletingId === d.id}
                    className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                    aria-label="Eliminar parte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
