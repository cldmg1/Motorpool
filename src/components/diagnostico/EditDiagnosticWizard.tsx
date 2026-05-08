'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sileo } from 'sileo'
import type { Part, DiagnosticFormData, ChecklistItem, DiagnosticWithItems } from '@/lib/types'
import { updateDiagnostic } from '@/actions/diagnostics'
import EquipmentForm from './EquipmentForm'
import FaultDescription from './FaultDescription'
import PartsChecklist from './PartsChecklist'
import DiagnosticSummary from './DiagnosticSummary'

const STEPS = ['Equipo', 'Avería', 'Repuestos', 'Resumen']

type Props = {
  diagnostic: DiagnosticWithItems
  parts: Part[]
}

export default function EditDiagnosticWizard({ diagnostic, parts }: Props) {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<DiagnosticFormData>({
    cliente: diagnostic.cliente,
    modelo: diagnostic.modelo,
    filtro: diagnostic.filtro ?? '',
    fuente_alimentacion: diagnostic.fuente_alimentacion ?? '',
    horas_motor: diagnostic.horas_motor != null ? String(diagnostic.horas_motor) : '',
    horas_fuente: diagnostic.horas_fuente != null ? String(diagnostic.horas_fuente) : '',
    descripcion_averia: diagnostic.descripcion_averia ?? '',
    numero_serie: diagnostic.numero_serie ?? '',
    prioridad: diagnostic.prioridad ?? 'normal',
    tipo_intervencion: diagnostic.tipo_intervencion ?? '',
    fecha_entrega: diagnostic.fecha_entrega ?? '',
    notas_internas: diagnostic.notas_internas ?? '',
  })

  const existingItemsMap = new Map(
    diagnostic.diagnostic_items.map(i => [i.part_id ?? `custom:${i.custom_name}`, i.quantity])
  )

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const catalogItems: ChecklistItem[] = parts.map(p => ({
      id: crypto.randomUUID(),
      part_id: p.id,
      name: p.name,
      checked: existingItemsMap.has(p.id),
      quantity: existingItemsMap.get(p.id) ?? 1,
      is_custom: false,
      category: p.category,
      subcategory: p.subcategory,
      brand_section: p.brand_section,
      brand_subsection: p.brand_subsection,
      brand_tags: p.brand_tags ?? [],
    }))

    // Custom items not in catalog
    const customItems: ChecklistItem[] = diagnostic.diagnostic_items
      .filter(i => i.part_id === null)
      .map(i => ({
        id: crypto.randomUUID(),
        part_id: null,
        name: i.custom_name ?? '',
        checked: true,
        quantity: i.quantity,
        is_custom: true,
        category: 'repuestos',
        subcategory: null,
        brand_section: null,
        brand_subsection: null,
        brand_tags: [],
      }))

    return [...catalogItems, ...customItems]
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateForm(updates: Partial<DiagnosticFormData>) {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await updateDiagnostic(diagnostic.id, formData, items)
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    setSaving(false)
    sileo.success({ title: 'Diagnóstico actualizado' })
    router.push(`/diagnostico/${diagnostic.id}`)
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 px-1 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i === step
                  ? 'bg-mp-orange text-white'
                  : i < step
                  ? 'bg-mp-blue text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${i === step ? 'text-mp-blue' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <EquipmentForm
          data={formData}
          onChange={updateForm}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <FaultDescription
          value={formData.descripcion_averia}
          onChange={v => updateForm({ descripcion_averia: v })}
          notasInternas={formData.notas_internas}
          onChangeNotas={v => updateForm({ notas_internas: v })}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <PartsChecklist
          items={items}
          onChange={setItems}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <DiagnosticSummary
          formData={formData}
          items={items}
          photos={[]}
          saving={saving}
          error={error}
          onBack={() => setStep(2)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
