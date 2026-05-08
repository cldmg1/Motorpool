'use client'

import { useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type Props = {
  files: File[]
  onChange: (files: File[]) => void
  onBack: () => void
  onNext: () => void
}

export default function PhotoUploader({ files, onChange, onBack, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return

    const { default: imageCompression } = await import('browser-image-compression')
    const compressed = await Promise.all(
      Array.from(selected).map(file =>
        imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
      )
    )

    onChange([...files, ...compressed])
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-base font-bold text-mp-blue mb-5 flex items-center gap-2">
          <span className="bg-mp-orange text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">4</span>
          Fotos del Equipo
          <span className="text-xs font-normal text-gray-400">(opcional)</span>
        </h2>

        {/* Upload button */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-mp-blue hover:bg-blue-50/20 transition-all"
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500">Toca para añadir fotos</p>
            <p className="text-xs text-gray-400">Cámara o galería — max 5 fotos</p>
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        {/* Thumbnails */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {files.map((file, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="sticky bottom-20 md:bottom-4 flex gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-shrink-0 px-5 bg-orange-50 text-mp-orange hover:bg-orange-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <Button variant="secondary" onClick={onNext} className="flex-1 py-4 text-base bg-mp-orange text-white hover:bg-mp-orange/90">
          {files.length > 0 ? `Siguiente: Resumen (${files.length} fotos)` : 'Siguiente: Resumen'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
