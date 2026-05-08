'use client'

import { useState } from 'react'
import { sileo } from 'sileo'
import type { QuoteWithItems } from '@/lib/types'
import { updateQuoteStatus } from '@/actions/quotes'
import { sendQuoteEmail } from '@/actions/email'

type Props = {
  quotes: QuoteWithItems[]
}

function formatEur(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function calcTotal(quote: QuoteWithItems) {
  const subtotal = quote.quote_items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const iva = quote.iva_included ? subtotal * (quote.iva_rate / 100) : 0
  return subtotal + iva
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border border-amber-200',
  accepted: 'bg-green-50 text-green-600 border border-green-200',
  rejected: 'bg-red-50 text-red-500 border border-red-200',
}

const STATUS_BUTTONS: { value: 'pending' | 'accepted' | 'rejected'; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'accepted', label: 'Aceptado' },
  { value: 'rejected', label: 'Rechazado' },
]

export default function PresupuestosClient({ quotes }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [emailModal, setEmailModal] = useState<string | null>(null) // quote id
  const [emailTo, setEmailTo] = useState('')
  const [sending, setSending] = useState(false)

  async function handleStatusChange(id: string, status: 'pending' | 'accepted' | 'rejected') {
    setUpdatingId(id)
    const result = await updateQuoteStatus(id, status)
    setUpdatingId(null)
    if (result.error) {
      sileo.error({ title: 'Error al actualizar', description: result.error })
    } else {
      sileo.success({ title: 'Estado actualizado' })
    }
  }

  async function handleDownloadPDF(quote: QuoteWithItems) {
    try {
      const { generateQuotePDF } = await import('@/lib/quote-pdf')
      await generateQuotePDF(quote, null)
    } catch {
      sileo.error({ title: 'Error al generar PDF' })
    }
  }

  async function handleSendEmail(quote: QuoteWithItems) {
    if (!emailTo.trim()) return
    setSending(true)
    try {
      const { generateQuotePDFBase64 } = await import('@/lib/quote-pdf')
      const pdfBase64 = await generateQuotePDFBase64(quote, null)
      const result = await sendQuoteEmail(
        emailTo.trim(),
        pdfBase64,
        quote.cliente,
        quote.id.slice(0, 8).toUpperCase(),
      )
      if (result.error) {
        sileo.error({ title: 'Error al enviar', description: result.error })
      } else {
        sileo.success({ title: 'Email enviado' })
        setEmailModal(null)
        setEmailTo('')
      }
    } catch (err) {
      sileo.error({ title: 'Error inesperado', description: String(err) })
    }
    setSending(false)
  }

  const activeQuote = emailModal ? quotes.find(q => q.id === emailModal) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-mp-blue">Presupuestos</h1>
          <p className="text-sm text-gray-400">{quotes.length} presupuestos</p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-semibold">No hay presupuestos</p>
          <p className="text-sm mt-1">Crea un presupuesto desde el detalle de un diagnóstico</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map(q => {
            const currentStatus = q.status ?? 'pending'
            const isUpdating = updatingId === q.id

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Card header */}
                <div className="bg-mp-blue px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-bold">{q.cliente}</p>
                      <p className="text-blue-200 text-sm">{q.modelo}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[currentStatus]}`}>
                      {STATUS_LABELS[currentStatus]}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Date + total */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <p className="text-base font-black text-mp-blue">{formatEur(calcTotal(q))}</p>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-1.5">
                    {STATUS_BUTTONS.map(btn => (
                      <button
                        key={btn.value}
                        onClick={() => handleStatusChange(q.id, btn.value)}
                        disabled={isUpdating || currentStatus === btn.value}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all duration-150 disabled:cursor-not-allowed ${
                          currentStatus === btn.value
                            ? btn.value === 'pending'
                              ? 'bg-amber-500 text-white'
                              : btn.value === 'accepted'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } ${isUpdating ? 'opacity-60' : ''}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Download PDF */}
                  <button
                    onClick={() => handleDownloadPDF(q)}
                    className="w-full flex items-center justify-center gap-2 bg-orange-50 text-mp-orange font-bold text-sm py-3 rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar PDF
                  </button>

                  {/* Send by email */}
                  <button
                    onClick={() => { setEmailModal(q.id); setEmailTo('') }}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar por Email
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Email modal */}
      {emailModal && activeQuote && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setEmailModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-black text-mp-blue">Enviar presupuesto por email</h2>
            <p className="text-xs text-gray-500">
              Se adjuntará el PDF del presupuesto de <span className="font-semibold text-gray-700">{activeQuote.cliente}</span>.
            </p>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendEmail(activeQuote)}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEmailModal(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSendEmail(activeQuote)}
                disabled={sending || !emailTo.trim()}
                className="flex-1 py-3 rounded-xl bg-mp-blue text-white font-bold text-sm hover:bg-mp-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
