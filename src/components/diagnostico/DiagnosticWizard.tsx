'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Part, DiagnosticFormData, ChecklistItem } from '@/lib/types'
import { createDiagnostic } from '@/actions/diagnostics'
import EquipmentForm from './EquipmentForm'
import FaultDescription from './FaultDescription'
import PartsChecklist from './PartsChecklist'
import DiagnosticSummary from './DiagnosticSummary'
import PhotoUploader from './PhotoUploader'

const STEPS = ['Equipo', 'Avería', 'Repuestos', 'Fotos', 'Resumen']

type Props = {
  parts: Part[]
}

const emptyForm: DiagnosticFormData = {
  cliente: '',
  modelo: '',
  filtro: '',
  fuente_alimentacion: '',
  horas_motor: '',
  horas_fuente: '',
  descripcion_averia: '',
}

export default function DiagnosticWizard({ parts }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<DiagnosticFormData>(emptyForm)
  const [items, setItems] = useState<ChecklistItem[]>(
    parts.map(p => ({
      id: crypto.randomUUID(),
      part_id: p.id,
      name: p.name,
      checked: false,
      quantity: 0,
      is_custom: false,
    }))
  )
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateForm(updates: Partial<DiagnosticFormData>) {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const result = await createDiagnostic(formData, items)

    if ('error' in result) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSavedId(result.id)

    // Upload pending photos
    if (pendingPhotos.length > 0) {
      const { uploadPhotos } = await import('@/lib/storage')
      await uploadPhotos(result.id, pendingPhotos)
    }

    setSaving(false)
    router.push(`/diagnostico/${result.id}`)
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

      {/* Step content */}
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
        <PhotoUploader
          files={pendingPhotos}
          onChange={setPendingPhotos}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <DiagnosticSummary
          formData={formData}
          items={items}
          photos={pendingPhotos}
          saving={saving}
          error={error}
          onBack={() => setStep(3)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
