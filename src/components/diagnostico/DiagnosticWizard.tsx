'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sileo } from 'sileo'
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
  numero_serie: '',
  prioridad: 'normal',
  tipo_intervencion: '',
  fecha_entrega: '',
  notas_internas: '',
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
      category: p.category,
      subcategory: p.subcategory,
      brand_section: p.brand_section,
      brand_subsection: p.brand_subsection,
      brand_tags: p.brand_tags ?? [],
    }))
  )
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState('')

  const canSaveDraft = formData.cliente.trim().length > 0 && formData.modelo.trim().length > 0

  function updateForm(updates: Partial<DiagnosticFormData>) {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  async function handleSaveDraft() {
    if (!canSaveDraft) return
    setSavingDraft(true)
    const result = await createDiagnostic(formData, items)
    if ('error' in result) {
      sileo.error({ title: 'Error al guardar borrador', description: result.error })
      setSavingDraft(false)
      return
    }
    setSavedId(result.id)
    if (pendingPhotos.length > 0) {
      const { uploadPhotos } = await import('@/lib/storage')
      await uploadPhotos(result.id, pendingPhotos)
    }
    setSavingDraft(false)
    sileo.success({ title: 'Borrador guardado', description: 'Puedes retomarlo desde Historial' })
    router.push('/inicio')
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
    sileo.success({ title: 'Parte guardado', description: 'Puedes finalizarlo cuando esté listo' })
    router.push(`/diagnostico/${result.id}`)
  }

  return (
    <div>
      {/* Guardar borrador */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={!canSaveDraft || savingDraft || saving}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-mp-blue disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-xl hover:bg-mp-blue/5"
        >
          {savingDraft ? (
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          Guardar borrador
        </button>
      </div>

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
