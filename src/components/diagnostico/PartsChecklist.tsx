'use client'

import { useState } from 'react'
import type { ChecklistItem } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ChevronDown } from 'lucide-react'

type Props = {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  onBack: () => void
  onNext: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  repuestos: 'Repuestos',
  averias: 'Averías',
  marcas: 'Marcas',
}
const CATEGORY_ORDER = ['repuestos', 'averias', 'marcas']

function ItemRow({ item, onToggle, onQty }: {
  item: ChecklistItem
  onToggle: () => void
  onQty: (delta: number) => void
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 transition-all ${item.checked ? 'bg-blue-50/40' : 'bg-white'}`}>
      <div onClick={onToggle} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
        <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${item.checked ? 'bg-mp-blue' : 'bg-white border border-gray-200'}`}>
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
          <button onClick={() => onQty(-1)} className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 font-bold transition-colors text-lg leading-none">−</button>
          <span className="text-sm font-black text-mp-blue min-w-[20px] text-center">{item.quantity}</span>
          <button onClick={() => onQty(1)} className="w-7 h-7 rounded-lg bg-mp-blue text-white font-bold text-lg leading-none">+</button>
        </div>
      )}
    </div>
  )
}

export default function PartsChecklist({ items, onChange, onBack, onNext }: Props) {
  const [newItemName, setNewItemName] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  function toggle(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
    onChange([...items, {
      id: crypto.randomUUID(),
      part_id: null,
      name,
      checked: true,
      quantity: 1,
      is_custom: true,
      category: 'repuestos',
      subcategory: null,
      brand_section: null,
      brand_subsection: null,
      brand_tags: [],
    }])
    setNewItemName('')
  }

  const allCats = [
    ...CATEGORY_ORDER,
    ...Array.from(new Set(items.map(i => i.category ?? 'repuestos'))).filter(c => !CATEGORY_ORDER.includes(c)),
  ]
  const grouped = allCats
    .map(cat => ({
      cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      items: items.filter(i => (i.category ?? 'repuestos') === cat),
    }))
    .filter(g => CATEGORY_ORDER.includes(g.cat) || g.items.length > 0)

  const selectedCount = items.filter(i => i.checked).length

  function sortWithOthersLast(arr: string[]) {
    return arr.sort((a, b) => a === 'Otros' ? 1 : b === 'Otros' ? -1 : a.localeCompare(b))
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-base font-bold text-mp-blue mb-5 flex items-center gap-2">
          <span className="bg-mp-orange text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">3</span>
          Repuestos y Servicios
        </h2>

        <div className="space-y-3">
          {grouped.map(({ cat, label, items: groupItems }) => {
            const isOpen = !!openSections[cat]
            const selectedInGroup = groupItems.filter(i => i.checked).length

            return (
              <div key={cat} className="rounded-2xl border border-gray-100 overflow-hidden">
                {/* Level 1: Category header */}
                <button
                  type="button"
                  onClick={() => toggle(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-mp-blue">{label}</span>
                    {selectedInGroup > 0 && (
                      <span className="bg-mp-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedInGroup}</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-50">
                    {/* ── REPUESTOS / AVERIAS: subcategory sub-blocks ── */}
                    {(cat === 'repuestos' || cat === 'averias') && (() => {
                      const subs = sortWithOthersLast(Array.from(new Set(groupItems.map(i => i.subcategory ?? 'Otros'))))
                      return subs.map(sub => {
                        const subKey = `${cat}::${sub}`
                        const isSubOpen = !!openSections[subKey]
                        const subItems = groupItems.filter(i => (i.subcategory ?? 'Otros') === sub)
                        const selectedInSub = subItems.filter(i => i.checked).length
                        return (
                          <div key={sub}>
                            <button type="button" onClick={() => toggle(subKey)}
                              className="w-full flex items-center justify-between px-5 py-2.5 bg-white hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-600">{sub}</span>
                                {selectedInSub > 0 && (
                                  <span className="bg-mp-blue/10 text-mp-blue text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedInSub}</span>
                                )}
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-300 transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSubOpen && (
                              <div className="border-t border-gray-50">
                                {subItems.map(item => (
                                  <ItemRow key={item.id} item={item}
                                    onToggle={() => toggleCheck(item.id)}
                                    onQty={d => updateQuantity(item.id, d)} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}

                    {/* ── MARCAS: brand → section → subsection → items ── */}
                    {cat === 'marcas' && (() => {
                      if (groupItems.length === 0) {
                        return <p className="px-4 py-3 text-xs text-gray-400 italic">Sin marcas añadidas</p>
                      }

                      // All subcategories available in global catalog
                      const globalRepuestosSubs = Array.from(new Set(
                        items.filter(i => i.category === 'repuestos' && i.subcategory).map(i => i.subcategory!)
                      )).sort((a, b) => a.localeCompare(b))
                      const globalAveriasSubs = Array.from(new Set(
                        items.filter(i => i.category === 'averias' && i.subcategory).map(i => i.subcategory!)
                      )).sort((a, b) => a.localeCompare(b))

                      const brands = groupItems.map(i => i.name).sort((a, b) => a.localeCompare(b))
                      return brands.map(brand => {
                        const brandKey = `marcas::${brand}`
                        const isBrandOpen = !!openSections[brandKey]
                        const selectedInBrand = items.filter(i => (i.category === 'repuestos' || i.category === 'averias') && i.brand_tags.includes(brand) && i.checked).length

                        const sections = ['repuestos', 'averias'].filter(s =>
                          items.some(i => i.category === s && i.brand_tags.includes(brand))
                        )

                        return (
                          <div key={brand}>
                            {/* Level 2: Brand */}
                            <button type="button" onClick={() => toggle(brandKey)}
                              className="w-full flex items-center justify-between px-5 py-2.5 bg-white hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-mp-blue">{brand}</span>
                                {selectedInBrand > 0 && (
                                  <span className="bg-mp-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedInBrand}</span>
                                )}
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isBrandOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isBrandOpen && (
                              <div className="border-t border-gray-50 divide-y divide-gray-50 bg-gray-50/30">
                                {sections.map(section => {
                                  const sectionKey = `marcas::${brand}::${section}`
                                  const isSectionOpen = !!openSections[sectionKey]
                                  const sectionLabel = section === 'repuestos' ? 'Repuestos' : 'Averías'
                                  // Global items for this section assigned to this brand
                                  const globalSectionItems = items.filter(i => i.category === section && i.brand_tags.includes(brand))
                                  // Only subsections that have at least one assigned item
                                  const subsections = Array.from(new Set(globalSectionItems.map(i => i.subcategory ?? 'Otros'))).sort((a, b) => a.localeCompare(b))
                                  const selectedInSection = globalSectionItems.filter(i => i.checked).length

                                  return (
                                    <div key={section}>
                                      {/* Level 3: Section (repuestos/averias within brand) */}
                                      <button type="button" onClick={() => toggle(sectionKey)}
                                        className="w-full flex items-center justify-between pl-8 pr-5 py-2 bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[11px] font-bold text-gray-500">{sectionLabel}</span>
                                          {selectedInSection > 0 && (
                                            <span className="bg-mp-blue/10 text-mp-blue text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedInSection}</span>
                                          )}
                                        </div>
                                        <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform duration-200 ${isSectionOpen ? 'rotate-180' : ''}`} />
                                      </button>

                                      {isSectionOpen && (
                                        <div className="divide-y divide-gray-50">
                                          {subsections.map(sub => {
                                            const subKey = `marcas::${brand}::${section}::${sub}`
                                            const isSubOpen = !!openSections[subKey]
                                            const subItems = globalSectionItems.filter(i => (i.subcategory ?? 'Otros') === sub)
                                            const selectedInSub = subItems.filter(i => i.checked).length

                                            return (
                                              <div key={sub}>
                                                {/* Level 4: Sub-subcategory */}
                                                <button type="button" onClick={() => toggle(subKey)}
                                                  className="w-full flex items-center justify-between pl-10 pr-5 py-2 bg-white hover:bg-gray-50 transition-colors">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{sub}</span>
                                                    {selectedInSub > 0 && (
                                                      <span className="bg-mp-blue/10 text-mp-blue text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedInSub}</span>
                                                    )}
                                                  </div>
                                                  <ChevronDown className={`w-3 h-3 text-gray-200 transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isSubOpen && (
                                                  <div className="border-t border-gray-50">
                                                    {subItems.map(item => (
                                                      <ItemRow key={item.id} item={item}
                                                        onToggle={() => toggleCheck(item.id)}
                                                        onQty={d => updateQuantity(item.id, d)} />
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add custom item */}
        <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
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
            <button onClick={addCustomItem}
              className="bg-mp-orange hover:bg-mp-orange/90 text-white px-4 rounded-xl font-bold text-xs uppercase transition-colors">
              Añadir
            </button>
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
          Siguiente: Fotos
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{selectedCount}</span>
        </Button>
      </div>
    </div>
  )
}
