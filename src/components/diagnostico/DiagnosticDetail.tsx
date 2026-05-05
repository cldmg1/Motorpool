'use client'

import Link from 'next/link'
import type { DiagnosticWithItems } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { generatePDF } from '@/lib/pdf'
import { createClient } from '@/lib/supabase/client'

export default function DiagnosticDetail({ diagnostic }: { diagnostic: DiagnosticWithItems }) {
  const items = diagnostic.diagnostic_items ?? []
  const photos = diagnostic.diagnostic_photos ?? []

  async function handleDownloadPDF() {
    await generatePDF(diagnostic)
  }

  async function handleSendEmail() {
    const supabase = createClient()
    const lines = [
      `REPORTE DE DIAGNÓSTICO - MOTORPOOL`,
      `====================================`,
      ``,
      `DATOS DEL EQUIPO`,
      `Cliente: ${diagnostic.cliente}`,
      `Modelo: ${diagnostic.modelo}`,
      `Filtro: ${diagnostic.filtro ?? '-'}`,
      `Fuente: ${diagnostic.fuente_alimentacion ?? '-'}`,
      `Horas Motor: ${diagnostic.horas_motor ?? '-'} hrs`,
      `Horas Fuente: ${diagnostic.horas_fuente ?? '-'} hrs`,
      ``,
      `AVERÍA`,
      diagnostic.descripcion_averia ?? 'Sin descripción.',
      ``,
      `REPUESTOS`,
      ...items.map(i => `- ${i.quantity}x ${i.parts_catalog?.name ?? i.custom_name}`),
    ]
    const body = encodeURIComponent(lines.join('\n'))
    const subject = encodeURIComponent(`Diagnóstico MotorPool - ${diagnostic.cliente}`)
    window.location.href = `mailto:infomotorpoolsat@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/historial" className="text-sm text-gray-500 font-medium flex items-center gap-1 hover:text-mp-blue">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Historial
        </Link>
        <Badge variant="green">Completado</Badge>
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
                { label: 'Técnico', value: diagnostic.profiles?.full_name },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="font-semibold text-sm">{value ?? '—'}</p>
                </div>
              ))}
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

          {/* Actions */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <Button variant="primary" onClick={handleDownloadPDF} className="w-full py-4 text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PDF
            </Button>
            <Button variant="ghost" onClick={handleSendEmail} className="w-full py-4 text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar por Email
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PhotoThumb({ path, name }: { path: string; name: string }) {
  const supabase = createClient()
  const { data } = supabase.storage.from('diagnostic-photos').getPublicUrl(path)

  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
      <img src={data.publicUrl} alt={name} className="w-full h-full object-cover" />
    </div>
  )
}
