export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PerfilClient from '@/components/layout/PerfilClient'
import PerfilCharts from '@/components/perfil/PerfilCharts'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isAdmin = profile?.role === 'admin'

  // Últimos 7 días
  const since7 = new Date()
  since7.setDate(since7.getDate() - 6)
  since7.setHours(0, 0, 0, 0)

  // Fetch diagnósticos — RLS filtra por usuario para técnicos, admin ve todos
  const selectFields = isAdmin
    ? 'created_at, status, profiles(full_name)'
    : 'created_at, status'

  const [
    { data: diagnostics },
    { data: allDiagnostics },
    { data: allModels },
    { data: allQuotes },
    { data: completedParts },
    { data: diagnosticItems },
  ] = await Promise.all([
    supabase
      .from('diagnostics')
      .select(selectFields as 'created_at, status')
      .gte('created_at', since7.toISOString()),
    supabase
      .from('diagnostics')
      .select('status'),
    isAdmin
      ? supabase.from('diagnostics').select('modelo')
      : supabase.from('diagnostics').select('modelo').eq('user_id', user!.id),
    isAdmin
      ? supabase.from('quotes').select('status')
      : supabase.from('quotes').select('status').eq('user_id', user!.id),
    isAdmin
      ? supabase.from('diagnostics').select('created_at, closed_at').eq('status', 'completed').not('closed_at', 'is', null).limit(200)
      : supabase.from('diagnostics').select('created_at, closed_at').eq('user_id', user!.id).eq('status', 'completed').not('closed_at', 'is', null).limit(200),
    isAdmin
      ? supabase.from('diagnostic_items').select('custom_name, parts_catalog(name)')
      : supabase.from('diagnostic_items').select('custom_name, parts_catalog(name), diagnostics!inner(user_id)').eq('diagnostics.user_id', user!.id),
  ])

  // ── Partes por día (últimos 7 días) ──────────────────
  const days: { dia: string; partes: number }[] = []
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().slice(0, 10)
    const count = (diagnostics ?? []).filter(x => x.created_at.slice(0, 10) === dayStr).length
    days.push({ dia: dayLabels[d.getDay()], partes: count })
  }

  // ── Estado (total histórico) ──────────────────────────
  const finalizados = (allDiagnostics ?? []).filter(x => x.status === 'completed').length
  const abiertos = (allDiagnostics ?? []).filter(x => x.status === 'draft' || x.status === 'en_espera').length
  const porEstado = [
    { name: 'Finalizados', value: finalizados },
    { name: 'Abiertos', value: abiertos },
  ]

  // ── Por técnico (admin, últimos 7 días) ───────────────
  let porTecnico: { nombre: string; partes: number }[] | undefined
  if (isAdmin) {
    const techMap: Record<string, number> = {}
    for (const d of diagnostics ?? []) {
      const name = (d as any).profiles?.full_name ?? 'Desconocido'
      techMap[name] = (techMap[name] ?? 0) + 1
    }
    porTecnico = Object.entries(techMap)
      .map(([nombre, partes]) => ({ nombre, partes }))
      .sort((a, b) => b.partes - a.partes)
  }

  // ── Top modelos ───────────────────────────────────────
  const modeloMap: Record<string, number> = {}
  for (const d of allModels ?? []) {
    if (d.modelo) modeloMap[d.modelo] = (modeloMap[d.modelo] ?? 0) + 1
  }
  const topModelos = Object.entries(modeloMap)
    .map(([modelo, count]) => ({ modelo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── Tasa de conversión ────────────────────────────────
  const totalQuotes = (allQuotes ?? []).length
  const aceptados = (allQuotes ?? []).filter(q => q.status === 'accepted').length
  const tasaConversion = {
    total: totalQuotes,
    aceptados,
    pct: totalQuotes > 0 ? Math.round((aceptados / totalQuotes) * 100) : 0,
  }

  // ── Tiempo medio resolución ───────────────────────────
  let tiempoMedioResolucion: number | null = null
  if (completedParts && completedParts.length > 0) {
    const totalMs = completedParts.reduce((acc, d) => {
      if (!d.closed_at) return acc
      return acc + (new Date(d.closed_at).getTime() - new Date(d.created_at).getTime())
    }, 0)
    tiempoMedioResolucion = Math.round((totalMs / completedParts.length / 86400000) * 10) / 10
  }

  // ── Top repuestos ─────────────────────────────────────
  const partMap: Record<string, number> = {}
  for (const item of diagnosticItems ?? []) {
    const name = (item as any).parts_catalog?.name ?? item.custom_name
    if (name) partMap[name] = (partMap[name] ?? 0) + 1
  }
  const topRepuestos = Object.entries(partMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <PerfilClient profile={profile!} />
      <PerfilCharts
        porDia={days}
        porEstado={porEstado}
        porTecnico={porTecnico}
        isAdmin={isAdmin}
        topModelos={topModelos}
        topRepuestos={topRepuestos}
        tasaConversion={tasaConversion}
        tiempoMedioResolucion={tiempoMedioResolucion}
      />
    </div>
  )
}
