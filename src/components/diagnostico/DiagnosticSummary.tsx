'use client'

import type { DiagnosticFormData, ChecklistItem } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type Props = {
  formData: DiagnosticFormData
  items: ChecklistItem[]
  photos: File[]
  saving: boolean
  error: string
  onBack: () => void
  onSave: () => void
}

export default function DiagnosticSummary({
  formData,
  items,
  photos,
  saving,
  error,
  onBack,
  onSave,
}: Props) {
  const selectedItems = items.filter(i => i.checked)

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-mp-blue p-6 text-white">
          <h2 className="text-xl font-bold">Resumen del Diagnóstico</h2>
          <p className="text-blue-200 text-sm mt-0.5 opacity-80">Revisa antes de guardar</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Equipment info */}
          <section>
            <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-3">
              Información del Equipo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Cliente', value: formData.cliente },
                { label: 'Modelo', value: formData.modelo },
                { label: 'Filtro', value: formData.filtro || '—' },
                { label: 'Fuente Alim.', value: formData.fuente_alimentacion || '—' },
                { label: 'Horas Motor', value: formData.horas_motor ? `${formData.horas_motor} h` : '—' },
                { label: 'Horas Fuente', value: formData.horas_fuente ? `${formData.horas_fuente} h` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="font-semibold text-sm text-gray-800">{value || '—'}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Avería */}
          {formData.descripcion_averia && (
            <section className="bg-gray-50 p-4 rounded-2xl">
              <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-2">
                Avería Detectada
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed italic">
                &ldquo;{formData.descripcion_averia}&rdquo;
              </p>
            </section>
          )}

          {/* Parts */}
          <section>
            <h3 className="text-[10px] font-black text-mp-orange uppercase tracking-widest mb-3">
              Repuestos y Servicios ({selectedItems.length})
            </h3>
            {selectedItems.length === 0 ? (
              <p className="text-gray-400 text-sm">No se han seleccionado repuestos.</p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-gray-800 font-medium text-sm">{item.name}</span>
                    <span className="bg-mp-blue text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">
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
              <div className="flex gap-2 flex-wrap">
                {photos.map((f, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </Card>

      {error && (
        <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="sticky bottom-20 md:bottom-4 flex gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-shrink-0 px-5" disabled={saving}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          loading={saving}
          className="flex-1 py-4 text-base"
        >
          {saving ? 'Guardando...' : 'Guardar Diagnóstico'}
        </Button>
      </div>
    </div>
  )
}
