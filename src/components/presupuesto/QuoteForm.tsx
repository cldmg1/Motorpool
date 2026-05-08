'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sileo } from 'sileo'
import { Trash2, Plus } from 'lucide-react'
import type { DiagnosticWithItems, QuoteWithItems, CompanySettings } from '@/lib/types'
import { createQuote } from '@/actions/quotes'

type FormItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
}

type Props = {
  diagnostic: DiagnosticWithItems
  companySettings?: CompanySettings | null
}

function formatEur(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export default function QuoteForm({ diagnostic, companySettings }: Props) {
  const router = useRouter()

  const [cliente, setCliente] = useState(diagnostic.cliente)
  const [modelo, setModelo] = useState(diagnostic.modelo)
  const [notas, setNotas] = useState('')
  const [firmaCliente, setFirmaCliente] = useState('')
  const [ivaIncluded, setIvaIncluded] = useState(true)
  const [ivaRate, setIvaRate] = useState(companySettings?.iva_default ?? 21)
  const [fechaValidez, setFechaValidez] = useState('')
  const [saving, setSaving] = useState(false)

  const [items, setItems] = useState<FormItem[]>(() => {
    const diagnosticRows: FormItem[] = (diagnostic.diagnostic_items ?? []).map(item => ({
      id: crypto.randomUUID(),
      description: item.parts_catalog?.name ?? item.custom_name ?? '',
      quantity: item.quantity,
      unit_price: 0,
    }))
    const laborRow: FormItem = {
      id: crypto.randomUUID(),
      description: 'Mano de obra',
      quantity: 1,
      unit_price: 0,
    }
    return [...diagnosticRows, laborRow]
  })

  function addItem() {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function updateItem(id: string, field: keyof Omit<FormItem, 'id'>, value: string | number) {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const ivaAmount = ivaIncluded ? subtotal * (ivaRate / 100) : 0
  const total = subtotal + ivaAmount

  async function handleSave() {
    if (!cliente.trim() || !modelo.trim()) {
      sileo.error({ title: 'Completa los datos del cliente y modelo' })
      return
    }
    setSaving(true)
    try {
      const result = await createQuote({
        diagnostic_id: diagnostic.id,
        cliente,
        modelo,
        notas: notas || undefined,
        iva_included: ivaIncluded,
        iva_rate: ivaRate,
        firma_cliente: firmaCliente || null,
        fecha_validez: fechaValidez || null,
        items: items.map((item, i) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          sort_order: i,
        })),
      })

      if ('error' in result) {
        sileo.error({ title: 'Error al guardar', description: result.error })
        setSaving(false)
        return
      }

      // Build QuoteWithItems from form state + returned id
      const now = new Date().toISOString()
      const quoteObj: QuoteWithItems = {
        id: result.id,
        user_id: '',
        diagnostic_id: diagnostic.id,
        cliente,
        modelo,
        notas: notas || null,
        iva_included: ivaIncluded,
        iva_rate: ivaRate,
        status: 'pending',
        firma_cliente: firmaCliente || null,
        fecha_validez: fechaValidez || null,
        created_at: now,
        quote_items: items.map((item, i) => ({
          id: crypto.randomUUID(),
          quote_id: result.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          sort_order: i,
        })),
      }

      const { generateQuotePDF } = await import('@/lib/quote-pdf')
      await generateQuotePDF(quoteObj, companySettings)

      sileo.success({ title: 'Presupuesto guardado y descargado' })
      router.push('/diagnostico/' + diagnostic.id)
    } catch (err) {
      sileo.error({ title: 'Error inesperado', description: String(err) })
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 font-medium flex items-center gap-1 hover:text-mp-blue"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card header */}
        <div className="bg-mp-blue px-6 py-5">
          <h1 className="text-white font-bold text-xl">Nuevo Presupuesto</h1>
          <p className="text-blue-200 text-sm mt-0.5">{diagnostic.cliente} — {diagnostic.modelo}</p>
        </div>

        <div className="p-6 space-y-8">

          {/* ── Datos ── */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-mp-orange uppercase tracking-widest">Datos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Cliente</label>
                <input
                  type="text"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mp-blue transition"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Modelo / Equipo</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mp-blue transition"
                  placeholder="Modelo del equipo"
                />
              </div>
            </div>
          </section>

          {/* ── Conceptos ── */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black text-mp-orange uppercase tracking-widest">Conceptos</h2>

            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_100px_36px] gap-2 px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Descripción</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Cant.</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-right">P. Unit. (€)</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-right">Subtotal</span>
              <span />
            </div>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_100px_100px_36px] gap-2 items-center">
                  {/* Description */}
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Descripción"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mp-blue transition"
                  />
                  {/* Delete (mobile: beside description) */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Eliminar línea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {/* Quantity */}
                  <input
                    type="number"
                    value={item.quantity}
                    min="0.01"
                    step="0.01"
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-center outline-none focus:ring-2 focus:ring-mp-blue transition"
                  />
                  {/* Unit price */}
                  <input
                    type="number"
                    value={item.unit_price}
                    min="0"
                    step="0.01"
                    onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-right outline-none focus:ring-2 focus:ring-mp-blue transition"
                  />
                  {/* Row subtotal */}
                  <div className="hidden sm:block text-sm font-semibold text-gray-700 text-right pr-1">
                    {formatEur(item.quantity * item.unit_price)}
                  </div>
                  {/* Delete (desktop) */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Eliminar línea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm font-bold text-mp-blue hover:text-mp-blue/80 transition mt-1"
            >
              <Plus className="w-4 h-4" />
              Añadir línea
            </button>
          </section>

          {/* ── IVA ── */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black text-mp-orange uppercase tracking-widest">IVA</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ivaIncluded}
                  onChange={e => setIvaIncluded(e.target.checked)}
                  className="w-4 h-4 rounded accent-mp-blue"
                />
                <span className="text-sm font-semibold text-gray-700">Aplicar IVA</span>
              </label>
              {ivaIncluded && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ivaRate}
                    min="0"
                    max="100"
                    step="1"
                    onChange={e => setIvaRate(parseFloat(e.target.value) || 0)}
                    className="w-20 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-center outline-none focus:ring-2 focus:ring-mp-blue transition"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Totales ── */}
          <section>
            <div className="flex flex-col items-end gap-1.5 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between w-52">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-semibold text-gray-800">{formatEur(subtotal)}</span>
              </div>
              {ivaIncluded && (
                <div className="flex items-center justify-between w-52">
                  <span className="text-sm text-gray-500">IVA ({ivaRate}%)</span>
                  <span className="text-sm font-semibold text-gray-800">{formatEur(ivaAmount)}</span>
                </div>
              )}
              <div className="w-52 border-t border-mp-blue pt-2 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-mp-blue">TOTAL</span>
                  <span className="text-base font-black text-mp-blue">{formatEur(total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Válido hasta ── */}
          <section className="space-y-1.5">
            <label className="text-[10px] font-black text-mp-orange uppercase tracking-widest">
              Válido hasta <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="date"
              value={fechaValidez}
              onChange={e => setFechaValidez(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mp-blue transition"
            />
          </section>

          {/* ── Notas ── */}
          <section className="space-y-1.5">
            <label className="text-[10px] font-black text-mp-orange uppercase tracking-widest">
              Notas <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Condiciones, observaciones, plazo de entrega…"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mp-blue resize-none transition"
            />
          </section>

          {/* ── Firma / Aprobado por ── */}
          <section className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Aprobado por (opcional)
            </label>
            <input
              type="text"
              value={firmaCliente}
              onChange={e => setFirmaCliente(e.target.value)}
              placeholder="Nombre del cliente o responsable"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
            />
            <p className="text-[10px] text-gray-400">Aparecerá en el PDF como confirmación del presupuesto.</p>
          </section>

          {/* ── Botones ── */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-mp-blue text-white font-bold text-sm hover:bg-mp-blue/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Guardando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Guardar y descargar PDF
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
