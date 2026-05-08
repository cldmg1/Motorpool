'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Lock } from 'lucide-react'
import { sileo } from 'sileo'
import type { DiagnosticWithItems, CompanySettings, QuoteWithItems } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { generatePDF } from '@/lib/pdf'
import { createClient } from '@/lib/supabase/client'
import { deleteDiagnostic, updateDiagnosticStatus } from '@/actions/diagnostics'
import { sendDiagnosticEmail } from '@/actions/email'

const TIPO_LABELS: Record<string, string> = {
  reparacion: 'Reparación',
  revision: 'Revisión',
  instalacion: 'Instalación',
  mantenimiento: 'Mantenimiento',
}

const PRIORIDAD_BADGE: Record<string, string> = {
  urgente: 'bg-red-100 text-red-600',
  normal: 'bg-gray-100 text-gray-500',
  baja: 'bg-blue-100 text-blue-600',
}

const QUOTE_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border border-amber-200',
  accepted: 'bg-green-50 text-green-600 border border-green-200',
  rejected: 'bg-red-50 text-red-500 border border-red-200',
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

function calcQuoteTotal(quote: QuoteWithItems) {
  const subtotal = quote.quote_items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const iva = quote.iva_included ? subtotal * (quote.iva_rate / 100) : 0
  return subtotal + iva
}

function formatEur(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export default function DiagnosticDetail({
  diagnostic,
  companySettings,
  quotes = [],
}: {
  diagnostic: DiagnosticWithItems
  companySettings?: CompanySettings | null
  quotes?: QuoteWithItems[]
}) {
  const router = useRouter()
  const items = diagnostic.diagnostic_items ?? []
  const photos = diagnostic.diagnostic_photos ?? []

  const [emailModal, setEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [sending, setSending] = useState(false)

  function handleDelete() {
    sileo.show({
      type: 'error',
      title: '¿Eliminar parte?',
      description: `${diagnostic.cliente} — Esta acción es irreversible. Si no tienes copia guardada no podrás recuperarlo. ¿Estás seguro?`,
      duration: 8000,
      button: {
        title: 'Eliminar',
        onClick: async () => {
          const result = await deleteDiagnostic(diagnostic.id)
          if (result.error) {
            sileo.error({ title: 'Error al eliminar', description: result.error })
          } else {
            sileo.success({ title: 'Parte eliminado' })
            router.push('/historial')
          }
        },
      },
    })
  }

  async function handleDownloadPDF() {
    await generatePDF(diagnostic, companySettings)
  }

  async function handleFinalizePart() {
    const result = await updateDiagnosticStatus(diagnostic.id, 'completed')
    if (result.error) {
      sileo.error({ title: 'Error', description: result.error })
    } else {
      sileo.success({ title: 'Parte finalizado' })
      router.refresh()
    }
  }

  async function handleEnEspera() {
    const result = await updateDiagnosticStatus(diagnostic.id, 'en_espera')
    if (result.error) {
      sileo.error({ title: 'Error', description: result.error })
    } else {
      sileo.success({ title: 'Parte en espera de piezas' })
      router.refresh()
    }
  }

  async function handleReopenPart() {
    const result = await updateDiagnosticStatus(diagnostic.id, 'draft')
    if (result.error) {
      sileo.error({ title: 'Error', description: result.error })
    } else {
      sileo.success({ title: 'Parte reabierto' })
      router.refresh()
    }
  }

  async function handleShareWhatsApp() {
    try {
      const { generatePDFBase64 } = await import('@/lib/pdf')
      const pdfBase64 = await generatePDFBase64(diagnostic, companySettings)
      const byteChars = atob(pdfBase64)
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const filename = `Diagnostico_${diagnostic.cliente.replace(/\s+/g, '_')}.pdf`
      const file = new File([blob], filename, { type: 'application/pdf' })

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Diagnóstico ${diagnostic.cliente}`,
          text: `Informe de diagnóstico — ${diagnostic.cliente} (${diagnostic.modelo})`,
        })
      } else {
        const text = `Informe de diagnóstico MotorPool SAT\nCliente: ${diagnostic.cliente}\nModelo: ${diagnostic.modelo}\nRef: #${diagnostic.id.slice(0, 8).toUpperCase()}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        sileo.show({ type: 'info', title: 'WhatsApp abierto', description: 'Descarga el PDF y adjúntalo en la conversación', duration: 5000 })
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        sileo.error({ title: 'Error al compartir' })
      }
    }
  }

  async function handleSendEmail() {
    if (!emailTo.trim()) return
    setSending(true)
    const { generatePDFBase64 } = await import('@/lib/pdf')
    const pdfBase64 = await generatePDFBase64(diagnostic, companySettings)
    const result = await sendDiagnosticEmail(
      emailTo.trim(),
      pdfBase64,
      diagnostic.cliente,
      diagnostic.id.slice(0, 8).toUpperCase(),
      companySettings?.email_body ?? null,
    )
    setSending(false)
    if (result.error) {
      sileo.error({ title: 'Error al enviar', description: result.error })
    } else {
      sileo.success({ title: 'Email enviado' })
      setEmailModal(false)
      setEmailTo('')
    }
  }

  const resolutionTime = diagnostic.closed_at
    ? (() => {
        const ms = new Date(diagnostic.closed_at).getTime() - new Date(diagnostic.created_at).getTime()
        const days = Math.floor(ms / 86400000)
        const hours = Math.floor((ms % 86400000) / 3600000)
        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h`
        return 'Menos de 1h'
      })()
    : null

  const statusBadge = () => {
    if (diagnostic.status === 'completed') return <Badge variant="red">Finalizado</Badge>
    if (diagnostic.status === 'en_espera') return <Badge variant="amber">En espera</Badge>
    return <Badge variant="green">Abierto</Badge>
  }

  return (
    <>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/historial" className="text-sm text-gray-500 font-medium flex items-center gap-1 hover:text-mp-blue">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Historial
        </Link>
        {statusBadge()}
      </div>

      <Card className="overflow-hidden">
        <div className="bg-mp-blue p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">{diagnostic.cliente}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{diagnostic.modelo}</p>
            </div>
            <p className="text-blue-200 text-xs">
              {new Date(diagnostic.created_at).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Equipment */}
          <section>
            <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-3">
              Información del Equipo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Filtro', value: diagnostic.filtro },
                { label: 'Fuente Alim.', value: diagnostic.fuente_alimentacion },
                { label: 'Horas Motor', value: diagnostic.horas_motor ? `${diagnostic.horas_motor} h` : null },
                { label: 'Horas Fuente', value: diagnostic.horas_fuente ? `${diagnostic.horas_fuente} h` : null },
                { label: 'Nº Serie', value: diagnostic.numero_serie },
                { label: 'Técnico', value: diagnostic.profiles?.full_name },
                { label: 'Resolución', value: resolutionTime },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="font-semibold text-sm">{value ?? '—'}</p>
                </div>
              ))}

              {/* Prioridad */}
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Prioridad</p>
                <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${PRIORIDAD_BADGE[diagnostic.prioridad ?? 'normal'] ?? PRIORIDAD_BADGE.normal}`}>
                  {(diagnostic.prioridad ?? 'normal').charAt(0).toUpperCase() + (diagnostic.prioridad ?? 'normal').slice(1)}
                </span>
              </div>

              {/* Tipo de intervención */}
              {diagnostic.tipo_intervencion && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tipo</p>
                  <p className="font-semibold text-sm">{TIPO_LABELS[diagnostic.tipo_intervencion] ?? diagnostic.tipo_intervencion}</p>
                </div>
              )}

              {/* Fecha de entrega */}
              {diagnostic.fecha_entrega && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fecha entrega</p>
                  <p className="font-semibold text-sm">
                    {new Date(diagnostic.fecha_entrega).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Avería */}
          {diagnostic.descripcion_averia && (
            <section className="bg-gray-50 p-4 rounded-2xl">
              <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-2">
                Avería Detectada
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {diagnostic.descripcion_averia}
              </p>
            </section>
          )}

          {/* Notas internas */}
          {diagnostic.notas_internas && (
            <section className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl">
              <h3 className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Notas internas
                <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md normal-case tracking-normal">
                  solo equipo técnico
                </span>
              </h3>
              <p className="text-yellow-800 text-sm leading-relaxed">
                {diagnostic.notas_internas}
              </p>
            </section>
          )}

          {/* Parts */}
          <section>
            <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-3">
              Repuestos y Servicios
            </h3>
            {items.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin repuestos.</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-800 font-medium text-sm">
                      {item.parts_catalog?.name ?? item.custom_name}
                    </span>
                    <span className="bg-mp-blue text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {item.quantity} ud
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Photos */}
          {photos.length > 0 && (
            <section>
              <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-3">
                Fotos ({photos.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <PhotoThumb key={photo.id} path={photo.storage_path} name={photo.file_name} />
                ))}
              </div>
            </section>
          )}

          {/* Presupuestos vinculados */}
          {quotes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-3">
                Presupuestos vinculados ({quotes.length})
              </h3>
              <div className="space-y-2">
                {quotes.map(q => (
                  <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${QUOTE_STATUS_BADGE[q.status ?? 'pending']}`}>
                        {QUOTE_STATUS_LABELS[q.status ?? 'pending']}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(q.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-mp-blue">{formatEur(calcQuoteTotal(q))}</span>
                      <button
                        onClick={async () => {
                          const { generateQuotePDF } = await import('@/lib/quote-pdf')
                          await generateQuotePDF(q, companySettings)
                        }}
                        className="text-[10px] font-bold text-mp-orange hover:text-mp-orange/80 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {/* En espera button for draft */}
            {diagnostic.status === 'draft' && (
              <button
                onClick={handleEnEspera}
                className="w-full flex items-center justify-center gap-2.5 bg-amber-500 text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-amber-600 active:scale-[0.98] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                En espera de piezas
              </button>
            )}

            {/* Finalizar para draft y en_espera */}
            {(diagnostic.status === 'draft' || diagnostic.status === 'en_espera') && (
              <button
                onClick={handleFinalizePart}
                className="w-full flex items-center justify-center gap-2.5 bg-green-500 text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-green-600 active:scale-[0.98] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finalizar parte
              </button>
            )}

            {/* Editar (only for draft/en_espera) */}
            {(diagnostic.status === 'draft' || diagnostic.status === 'en_espera') && (
              <Link
                href={`/diagnostico/${diagnostic.id}/editar`}
                className="w-full flex items-center justify-center gap-2.5 bg-blue-50 text-mp-blue font-bold text-sm py-3.5 rounded-xl hover:bg-blue-100 active:scale-[0.98] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar parte
              </Link>
            )}

            {diagnostic.status === 'completed' && (
              <Link
                href={`/presupuesto/nuevo?diagnosticId=${diagnostic.id}`}
                className="w-full flex items-center justify-center gap-2.5 bg-orange-50 text-mp-orange font-bold text-sm py-3.5 rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Crear presupuesto
              </Link>
            )}
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2.5 bg-orange-50 text-mp-orange font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-orange-100 active:scale-[0.98] transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PDF
            </button>
            <button
              onClick={() => setEmailModal(true)}
              className="w-full flex items-center justify-center gap-2.5 bg-gray-100 text-gray-700 font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar por Email
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 bg-green-50 text-green-600 font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-green-100 active:scale-[0.98] transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar por WhatsApp
            </button>
            {(diagnostic.status === 'completed' || diagnostic.status === 'en_espera') && (
              <button
                onClick={handleReopenPart}
                className="w-full flex items-center justify-center gap-2.5 bg-gray-100 text-gray-500 font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reabrir parte
              </button>
            )}
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2.5 bg-red-50 text-red-500 font-bold text-sm py-3.5 rounded-xl cursor-pointer hover:bg-red-100 active:scale-[0.98] transition-all duration-150"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar parte
            </button>
          </div>
        </div>
      </Card>
    </div>

    {/* Email modal */}
    {emailModal && (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setEmailModal(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-base font-black text-mp-blue">Enviar informe por email</h2>
          <p className="text-xs text-gray-500">
            Se adjuntará el PDF del diagnóstico de <span className="font-semibold text-gray-700">{diagnostic.cliente}</span>.
          </p>
          <input
            type="email"
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
            placeholder="correo@ejemplo.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEmailModal(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sending || !emailTo.trim()}
              className="flex-1 py-3 rounded-xl bg-mp-blue text-white font-bold text-sm hover:bg-mp-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function PhotoThumb({ path, name }: { path: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.storage
      .from('diagnostic-photos')
      .createSignedUrl(path, 3600)
      .then(({ data }) => { if (data) setUrl(data.signedUrl) })
  }, [path])

  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full animate-pulse bg-gray-200" />
      }
    </div>
  )
}
