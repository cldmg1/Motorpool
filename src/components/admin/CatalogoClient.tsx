'use client'

import { useState } from 'react'
import type { Part } from '@/lib/types'
import { createPart, updatePart, deletePart } from '@/actions/parts'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function CatalogoClient({ parts }: { parts: Part[] }) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    const result = await createPart(name)
    if (result.error) setError(result.error)
    else setNewName('')
    setAdding(false)
  }

  async function toggleActive(part: Part) {
    await updatePart(part.id, { is_active: !part.is_active })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-mp-blue">Catálogo de Piezas</h1>
          <p className="text-sm text-gray-400">{parts.length} piezas registradas</p>
        </div>
      </div>

      {/* Add new */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Añadir nueva pieza
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
            placeholder="Nombre de la pieza..."
          />
          <Button onClick={handleAdd} loading={adding} className="px-4">
            Añadir
          </Button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Parts list */}
      <div className="space-y-2">
        {parts.map(part => (
          <div
            key={part.id}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              part.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm text-gray-800">{part.name}</span>
              {!part.is_active && <Badge variant="gray">Inactiva</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(part)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  part.is_active
                    ? 'text-red-400 hover:text-red-500 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {part.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
