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
        </div>
      </Card>

      <div className="sticky bottom-20 md:bottom-4">
        <Button type="submit" variant="secondary" className="w-full py-4 text-base">
          Siguiente: Avería
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </form>
  )
}
