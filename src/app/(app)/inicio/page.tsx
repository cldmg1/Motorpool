export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RealtimeClock from '@/components/inicio/RealtimeClock'
import { Plus, ClipboardList, User, Settings, TrendingUp, TrendingDown, Minus, Clock, CalendarDays, FileText, Timer } from 'lucide-react'

export default async function InicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Técnico'

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))

  const [
    { count: hoy },
    { count: ayer },
    { count: abiertos },
    { count: semana },
    { data: ultimoParteArr },
    { data: openDiagnostics },
    { count: presupuestosPendientes },
    { data: completedParts },
  ] = await Promise.all([
    supabase.from('diagnostics').select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', todayStart.toISOString()),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString()),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .in('status', ['draft', 'en_espera']),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', weekStart.toISOString()),
    supabase.from('diagnostics').select('id, cliente, modelo, created_at, status')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase.from('diagnostics').select('id, cliente, modelo, created_at')
      .eq('user_id', user!.id)
      .in('status', ['draft', 'en_espera'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('quotes').select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'pending'),
    supabase.from('diagnostics')
      .select('created_at, closed_at')
      .eq('user_id', user!.id)
      .eq('status', 'completed')
      .not('closed_at', 'is', null)
      .limit(50),
  ])

  const hoyNum = hoy ?? 0
  const ayerNum = ayer ?? 0
  const diff = hoyNum - ayerNum
  const ultimoParte = ultimoParteArr?.[0] ?? null

  // Calculate avg resolution time
  let tiempoMedio: number | null = null
  if (completedParts && completedParts.length > 0) {
    const totalMs = completedParts.reduce((acc, d) => {
      if (!d.closed_at) return acc
      return acc + (new Date(d.closed_at).getTime() - new Date(d.created_at).getTime())
    }, 0)
    tiempoMedio = Math.round((totalMs / completedParts.length / 86400000) * 10) / 10
  }

  function tiempoTranscurrido(fecha: string) {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000)
    if (diff < 60) return 'hace un momento'
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`
    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between !mb-8 mt-6">
        <div>
          <p className="text-[11px] font-bold text-mp-orange uppercase tracking-[0.18em] mb-0.5">
            {isAdmin ? 'Administrador' : 'Técnico SAT'}
          </p>
          <h1 className="text-2xl font-black text-mp-blue leading-none">
            Hola, {firstName}
          </h1>
        </div>
        <div className="pt-4"><RealtimeClock /></div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-mp-blue tabular-nums leading-none">{hoyNum}</span>
            <span className="text-sm font-medium text-gray-400 mb-1">
              {hoyNum === 1 ? 'parte hoy' : 'partes hoy'}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full ${
            diff > 0
              ? 'bg-green-50 text-green-600'
              : diff < 0
              ? 'bg-red-50 text-red-500'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {diff > 0
              ? <TrendingUp className="w-3.5 h-3.5" />
              : diff < 0
              ? <TrendingDown className="w-3.5 h-3.5" />
              : <Minus className="w-3.5 h-3.5" />
            }
            <span>{diff > 0 ? `+${diff}` : diff === 0 ? 'igual' : diff} vs ayer</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-green-50 rounded-lg p-1.5">
              <Clock className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-0.5">Abiertos</p>
              <p className="text-lg font-black text-green-500 leading-none">{abiertos ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bg-mp-blue/10 rounded-lg p-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-mp-blue" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-0.5">Esta semana</p>
              <p className="text-lg font-black text-mp-blue leading-none">{semana ?? 0}</p>
            </div>
          </div>

          {/* Presupuestos pendientes */}
          {(presupuestosPendientes ?? 0) > 0 && (
            <div className="flex items-center gap-2.5 col-span-1">
              <div className="bg-mp-orange/10 rounded-lg p-1.5">
                <FileText className="w-3.5 h-3.5 text-mp-orange" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-0.5">Presupuestos</p>
                <Link href="/presupuestos" className="text-lg font-black text-mp-orange leading-none hover:underline">
                  {presupuestosPendientes}
                </Link>
              </div>
            </div>
          )}

          {/* Tiempo medio */}
          {tiempoMedio !== null && (
            <div className="flex items-center gap-2.5 col-span-1">
              <div className="bg-purple-50 rounded-lg p-1.5">
                <Timer className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-0.5">T. medio</p>
                <p className="text-lg font-black text-purple-500 leading-none">{tiempoMedio}d</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA — Nuevo Parte */}
      <Link
        href="/diagnostico"
        className="flex items-center gap-3 w-full bg-mp-orange text-white rounded-2xl px-5 py-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform duration-150"
      >
        <div className="bg-white/20 rounded-xl p-2 shrink-0">
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Crear</p>
          <p className="text-base font-black leading-tight">Nuevo Parte</p>
        </div>
        <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* Historial */}
      <Link
        href="/historial"
        className="flex flex-col gap-3 bg-white rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform duration-150"
      >
        <ClipboardList className="w-5 h-5 text-mp-blue" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-0.5">Ver</p>
          <p className="text-lg font-black text-mp-blue">Historial</p>
        </div>

        {ultimoParte && (
          <div className="border-t border-gray-100 pt-2.5">
            <p className="text-[11px] truncate">
              <span className="text-gray-400 font-medium">Último parte:</span>
              {' '}<span className="font-black text-mp-blue">{ultimoParte.cliente}</span>
              {' '}<span className="font-black text-gray-900">#{ultimoParte.id.slice(0, 6).toUpperCase()}</span>
            </p>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
              {tiempoTranscurrido(ultimoParte.created_at)}
            </p>
          </div>
        )}
      </Link>

      {/* Presupuestos */}
      <Link
        href="/presupuestos"
        className="flex items-center gap-3 w-full bg-white rounded-2xl px-5 py-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform duration-150"
      >
        <FileText className="w-5 h-5 text-mp-blue shrink-0" />
        <div className="flex-1">
          <p className="text-base font-black text-mp-blue leading-tight">Presupuestos</p>
          {(presupuestosPendientes ?? 0) > 0 && (
            <p className="text-[11px] text-mp-orange font-bold mt-0.5">{presupuestosPendientes} pendiente{presupuestosPendientes === 1 ? '' : 's'} de respuesta</p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* Partes pendientes */}
      {(openDiagnostics ?? []).length > 0 && (
        <details className="bg-white rounded-2xl shadow-sm overflow-hidden group">
          <summary className="flex items-center justify-between px-4 py-4 cursor-pointer list-none select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-sm font-black text-gray-700">Partes pendientes</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                {(openDiagnostics ?? []).length}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 transition-transform duration-200 group-open:rotate-180"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="divide-y divide-gray-50 border-t border-gray-100">
            {(openDiagnostics ?? []).map(d => {
              const dias = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000)
              return (
                <Link key={d.id} href={`/diagnostico/${d.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors active:scale-[0.99]">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{d.cliente}</p>
                    <p className="text-[11px] text-gray-400">{d.modelo}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    dias >= 7 ? 'bg-red-50 text-red-500' : dias >= 3 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {dias === 0 ? 'Hoy' : `${dias}d`}
                  </span>
                </Link>
              )
            })}
          </div>
        </details>
      )}

      {/* Perfil */}
      <Link
        href="/perfil"
        className="flex items-center gap-3 w-full bg-white rounded-2xl px-5 py-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform duration-150"
      >
        <User className="w-5 h-5 text-mp-blue shrink-0" />
        <div className="flex-1">
          <p className="text-base font-black text-mp-blue leading-tight">Perfil</p>
        </div>
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <Link
        href="/ajustes"
        className="flex items-center gap-3 w-full bg-white rounded-2xl px-5 py-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform duration-150"
      >
        <Settings className="w-5 h-5 text-mp-blue shrink-0" />
        <div className="flex-1">
          <p className="text-base font-black text-mp-blue leading-tight">Ajustes</p>
        </div>
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
