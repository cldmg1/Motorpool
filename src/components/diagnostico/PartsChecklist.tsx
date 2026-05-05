'use client'

import { useState } from 'react'
import type { ChecklistItem } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type Props = {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  onBack: () => void
  onNext: () => void
}

export default function PartsChecklist({ items, onChange, onBack, onNext }: Props) {
  const [newItemName, setNewItemName] = useState('')

  function toggleCheck(id: string) {
    onChange(items.map(item => {
      if (item.id !== id) return item
      const checked = !item.checked
      return { ...item, checked, quantity: checked ? 1 : 0 }
    }))
  }

  function updateQuantity(id: string, delta: number) {
    onChange(items.map(item => {
      if (item.id !== id) return item
      return { ...item, quantity: Math.max(1, item.quantity + delta) }
    }))
  }

  function addCustomItem() {
    const name = newItemName.trim()
    if (!name) return
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      part_id: null,
      name,
      checked: true,
      quantity: 1,
      is_custom: true,
    }
    onChange([...items, newItem])
    setNewItemName('')
  }

  const selectedCount = items.filter(i => i.checked).length

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-base font-bold text-mp-blue mb-5 flex items-center gap-2">
          <span className="bg-mp-orange text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">3</span>
          Repuestos y Servicios
        </h2>

        <div className="space-y-2 mb-6">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                item.checked
                  ? 'bg-blue-50/40 border border-blue-200 shadow-sm'
                  : 'bg-gray-50 border border-transparent'
              }`}
            >
              <div
                onClick={() => toggleCheck(item.id)}
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${
                    item.checked ? 'bg-mp-blue' : 'bg-white border border-gray-200'
                  }`}
                >
                  {item.checked && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-semibold truncate ${item.checked ? 'text-mp-blue' : 'text-gray-500'}`}>
                  {item.name}
                  {item.is_custom && <span className="ml-1 text-[10px] text-mp-orange font-bold">CUSTOM</span>}
                </span>
              </div>

              {item.checked && (
                <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-blue-100 flex-shrink-0 ml-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 font-bold transition-colors text-lg leading-none"
                  >
                    −
                  </button>
                  <span className="text-sm font-black text-mp-blue min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-mp-blue text-white font-bold text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add custom item */}
        <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Añadir repuesto no listado
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomItem()}
              className="flex-1 px-4 py-2 rounded-xl bg-white border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
              placeholder="Nombre de pieza..."
            />
            <button
              onClick={addCustomItem}
              className="bg-mp-orange hover:bg-mp-orange-dark text-white px-4 rounded-xl font-bold text-xs uppercase transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-20 md:bottom-4 flex gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-shrink-0 px-5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <Button variant="secondary" onClick={onNext} className="flex-1 py-4 text-base">
          Siguiente: Fotos
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{selectedCount}</span>
        </Button>
      </div>
    </div>
  )
}
