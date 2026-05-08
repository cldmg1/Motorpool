'use client'

import type { DiagnosticFormData } from '@/lib/types'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Props = {
  data: DiagnosticFormData
  onChange: (updates: Partial<DiagnosticFormData>) => void
  onNext: () => void
}

const TIPO_INTERVENCION_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'revision', label: 'Revisión' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
]

export default function EquipmentForm({ data, onChange, onNext }: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.cliente.trim() || !data.modelo.trim()) return
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="p-6">
        <h2 className="text-base font-bold text-mp-blue mb-5 flex items-center gap-2">
          <span className="bg-mp-orange text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">1</span>
          Información del Equipo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cliente *"
            name="cliente"
            value={data.cliente}
            onChange={e => onChange({ cliente: e.target.value })}
            placeholder="Nombre completo"
            required
          />
          <Input
            label="Modelo *"
            name="modelo"
            value={data.modelo}
            onChange={e => onChange({ modelo: e.target.value })}
            placeholder="Ref. Equipo"
            required
          />
          <Input
            label="Filtro"
            name="filtro"
            value={data.filtro}
            onChange={e => onChange({ filtro: e.target.value })}
            placeholder="Tipo de filtro"
          />
          <Input
            label="Fuente Alim."
            name="fuente_alimentacion"
            value={data.fuente_alimentacion}
            onChange={e => onChange({ fuente_alimentacion: e.target.value })}
            placeholder="Modelo fuente"
          />
          <Input
            label="Horas Motor"
            name="horas_motor"
            type="number"
            value={data.horas_motor}
            onChange={e => onChange({ horas_motor: e.target.value })}
            placeholder="0"
            min="0"
          />
          <Input
            label="Horas Fuente"
            name="horas_fuente"
            type="number"
            value={data.horas_fuente}
            onChange={e => onChange({ horas_fuente: e.target.value })}
            placeholder="0"
            min="0"
          />
          <Input
            label="Número de Serie"
            name="numero_serie"
            value={data.numero_serie}
            onChange={e => onChange({ numero_serie: e.target.value })}
            placeholder="S/N del equipo"
          />

          {/* Prioridad */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Prioridad
            </label>
            <select
              value={data.prioridad}
              onChange={e => onChange({ prioridad: e.target.value as DiagnosticFormData['prioridad'] })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mp-blue"
            >
              <option value="normal">Normal</option>
              <option value="urgente">Urgente</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          {/* Tipo de intervención */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Tipo de intervención
            </label>
            <select
              value={data.tipo_intervencion}
              onChange={e => onChange({ tipo_intervencion: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mp-blue"
            >
              {TIPO_INTERVENCION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha de entrega */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Fecha de entrega estimada
            </label>
            <input
              type="date"
              value={data.fecha_entrega}
              onChange={e => onChange({ fecha_entrega: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-mp-blue"
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-20 md:bottom-4">
        <Button type="submit" variant="secondary" className="w-full py-4 text-base bg-mp-orange text-white hover:bg-mp-orange/90">
          Siguiente: Avería
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </form>
  )
}
