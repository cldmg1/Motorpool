'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type Props = {
  value: string
  onChange: (v: string) => void
  notasInternas: string
  onChangeNotas: (v: string) => void
  onBack: () => void
  onNext: () => void
}

export default function FaultDescription({ value, onChange, notasInternas, onChangeNotas, onBack, onNext }: Props) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-base font-bold text-mp-blue mb-5 flex items-center gap-2">
          <span className="bg-mp-orange text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">2</span>
          Descripción de Avería
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Fallos detectados
            </label>
            <textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-mp-blue text-sm resize-none"
              placeholder="Describe los síntomas, fallos y observaciones del equipo..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              Notas internas
              <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md normal-case tracking-normal">
                no aparecen en PDF
              </span>
            </label>
            <textarea
              value={notasInternas}
              onChange={e => onChangeNotas(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-mp-blue text-sm resize-none"
              placeholder="Observaciones para el equipo, estado de piezas pedidas..."
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-20 md:bottom-4 flex gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-shrink-0 px-5 bg-orange-50 text-mp-orange hover:bg-orange-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <Button variant="secondary" onClick={onNext} className="flex-1 py-4 text-base bg-mp-orange text-white hover:bg-mp-orange/90">
          Siguiente: Repuestos
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
