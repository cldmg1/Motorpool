'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sileo } from 'sileo'
import { createPart, updatePart, hardDeletePart } from '@/actions/parts'
import { resetUserPassword, createUser, deleteUser } from '@/actions/users'
import { updateCompanySettings } from '@/actions/settings'
import { updateProfile, markPasswordChanged } from '@/actions/profile'
import { getAllDiagnosticsForExport, purgeAllDiagnostics } from '@/actions/purge'
import type { Part, Profile, CompanySettings, AuditEntry } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

function Block({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
      >
        <span className="font-black text-sm text-mp-blue">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function checkStrength(pw: string) {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

function SegurityBlock() {
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const checks = checkStrength(newPassword)
  const isStrong = Object.values(checks).every(Boolean)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!isStrong) {
      sileo.error({ title: 'Contraseña no cumple los requisitos' })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      sileo.error({ title: 'Error', description: error.message })
    } else {
      await markPasswordChanged()
      sileo.success({ title: 'Contraseña actualizada' })
      setNewPassword('')
    }
    setSaving(false)
  }

  const requirements = [
    { key: 'length', label: 'Mínimo 8 caracteres' },
    { key: 'uppercase', label: 'Una letra mayúscula' },
    { key: 'number', label: 'Un número' },
    { key: 'special', label: 'Un carácter especial (!@#$...)' },
  ] as const

  return (
    <form onSubmit={handlePasswordChange} className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Nueva Contraseña
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
          placeholder="Nueva contraseña"
        />
      </div>
      {newPassword.length > 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
          {requirements.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${checks[key] ? 'bg-green-500' : 'bg-gray-200'}`}>
                {checks[key] && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-xs transition-colors ${checks[key] ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      )}
      <Button type="submit" loading={saving} disabled={newPassword.length > 0 && !isStrong} className="w-full">
        Actualizar Contraseña
      </Button>
    </form>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  repuestos: 'Repuestos',
  averias: 'Averías',
  marcas: 'Marcas',
}
const CATEGORY_ORDER = ['repuestos', 'averias', 'marcas']

const SUBCATEGORY_CATS = ['repuestos', 'averias']

function CatalogoBlock({ parts: initialParts }: { parts: Part[]; isAdmin: boolean }) {
  const [parts, setParts] = useState(initialParts)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('repuestos')
  const [newSubcategory, setNewSubcategory] = useState('')   // subcategory (repuestos/averias) OR brand name (marcas)
  const [newBrandSection, setNewBrandSection] = useState('repuestos')
  const [newBrandSubsection, setNewBrandSubsection] = useState('')
  const [adding, setAdding] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)

    const isMarca = newCategory === 'marcas'
    const sub = newSubcategory.trim() || undefined
    const bs = isMarca ? (newBrandSection || undefined) : undefined
    const bss = isMarca ? (newBrandSubsection.trim() || undefined) : undefined

    const result = await createPart(name, newCategory, sub, bs, bss)
    if (result.error) {
      sileo.error({ title: 'Error al añadir', description: result.error })
    } else {
      setNewName('')
      sileo.success({ title: newCategory === 'marcas' ? 'Marca añadida' : 'Pieza añadida' })
      setParts(prev => [...prev, {
        id: crypto.randomUUID(),
        name,
        category: newCategory,
        subcategory: sub ?? null,
        brand_section: bs ?? null,
        brand_subsection: bss ?? null,
        brand_tags: [],
        is_active: true,
        sort_order: prev.length,
        created_at: new Date().toISOString(),
      }])
    }
    setAdding(false)
  }

  async function toggleActive(part: Part) {
    const result = await updatePart(part.id, { is_active: !part.is_active })
    if (result?.error) {
      sileo.error({ title: 'Error', description: result.error })
    } else {
      setParts(prev => prev.map(p => p.id === part.id ? { ...p, is_active: !p.is_active } : p))
      sileo.success({ title: part.is_active ? 'Pieza desactivada' : 'Pieza activada' })
    }
  }

  const allCats = [
    ...CATEGORY_ORDER,
    ...Array.from(new Set(parts.map(p => p.category ?? 'repuestos'))).filter(c => !CATEGORY_ORDER.includes(c)),
  ]
  const grouped = allCats.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: parts.filter(p => (p.category ?? 'repuestos') === cat),
  }))

  const useSubgroups = SUBCATEGORY_CATS.includes(newCategory)

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 space-y-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Añadir nuevo</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-2.5 bg-white rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
            placeholder="Nombre..."
          />
          <Button onClick={handleAdd} loading={adding} className="px-4 bg-mp-orange text-white hover:bg-mp-orange/90">
            Añadir
          </Button>
        </div>
        <select
          value={newCategory}
          onChange={e => { setNewCategory(e.target.value); setNewSubcategory(''); setNewBrandSection('repuestos'); setNewBrandSubsection('') }}
          className="w-full px-4 py-2.5 bg-white rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm text-gray-700"
        >
          {CATEGORY_ORDER.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>

        {/* Repuestos / Averías: subcategoría como select */}
        {SUBCATEGORY_CATS.includes(newCategory) && (() => {
          const existingSubs = Array.from(new Set(
            parts.filter(p => p.category === newCategory && p.subcategory).map(p => p.subcategory!)
          )).sort((a, b) => a.localeCompare(b))

          return (
            <select
              value={newSubcategory}
              onChange={e => setNewSubcategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm text-gray-700"
            >
              <option value="">— Subcategoría —</option>
              {existingSubs.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )
        })()}

        {/* Marcas: solo nombre de marca */}
        {newCategory === 'marcas' && (
          <p className="text-[10px] text-gray-400">El nombre será el identificador de la marca.</p>
        )}
      </div>

      {/* Grouped list */}
      <div className="space-y-3">
        {grouped.map(({ cat, label, items }) => {
          const isOpen = !!openSections[cat]
          const activeCount = items.filter(p => p.is_active).length
          const withSubs = SUBCATEGORY_CATS.includes(cat)
          const subgroups = withSubs
            ? Array.from(new Set(items.map(p => p.subcategory ?? 'Otros'))).sort((a, b) => a === 'Otros' ? 1 : b === 'Otros' ? -1 : a.localeCompare(b))
            : null

          return (
            <div key={cat} className="rounded-2xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(cat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-mp-blue">{label}</span>
                  <span className="text-[10px] font-bold text-gray-400">{activeCount} activas</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div>
                  {/* ── REPUESTOS / AVERIAS: sub-blocks ── */}
                  {withSubs && subgroups ? (
                    <div className="divide-y divide-gray-50">
                      {subgroups.map(sub => {
                        const subKey = `${cat}::${sub}`
                        const isSubOpen = !!openSections[subKey]
                        const subItems = items.filter(p => (p.subcategory ?? 'Otros') === sub)
                        return (
                          <div key={sub}>
                            <button type="button" onClick={() => toggleSection(subKey)}
                              className="w-full flex items-center justify-between px-5 py-2.5 bg-white hover:bg-gray-50 transition-colors">
                              <span className="text-xs font-bold text-gray-600">{sub}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-300 transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSubOpen && (
                              <div className="border-t border-gray-50">
                                {subItems.length === 0 ? (
                                  <p className="px-5 py-3 text-xs text-gray-400 italic">Sin items</p>
                                ) : subItems.map(part => (
                                  <div key={part.id}
                                    className={`flex items-center justify-between px-5 py-3 transition-all ${part.is_active ? 'bg-white' : 'bg-gray-50 opacity-50'}`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="font-semibold text-sm text-gray-800">{part.name}</span>
                                      {!part.is_active && <Badge variant="gray">Inactiva</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => toggleActive(part)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${part.is_active ? 'text-orange-400 hover:text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}>
                                        {part.is_active ? 'Desactivar' : 'Activar'}
                                      </button>
                                      <button onClick={() => sileo.show({
                                        type: 'error',
                                        title: `¿Eliminar "${part.name}"?`,
                                        description: 'Esta acción no se puede deshacer.',
                                        duration: 8000,
                                        button: { title: 'Eliminar', onClick: async () => {
                                          const result = await hardDeletePart(part.id)
                                          if (result.error) sileo.error({ title: 'Error', description: result.error })
                                          else { setParts(prev => prev.filter(p => p.id !== part.id)); sileo.success({ title: 'Pieza eliminada' }) }
                                        }},
                                      })}
                                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                  ) : cat === 'marcas' ? (
                    /* ── MARCAS: brand assignment tree ── */
                    (() => {
                      const brands = items.filter(p => p.category === 'marcas')
                      const globalRepuestos = parts.filter(p => p.category === 'repuestos' && p.is_active)
                      const globalAverias = parts.filter(p => p.category === 'averias' && p.is_active)

                      if (brands.length === 0) {
                        return <p className="px-4 py-3 text-xs text-gray-400 italic">Sin marcas añadidas</p>
                      }

                      return (
                        <div className="divide-y divide-gray-50">
                          {brands.map(brand => {
                            const brandKey = `brand::${brand.id}`
                            const isBrandOpen = !!openSections[brandKey]
                            const assignedCount = [...globalRepuestos, ...globalAverias].filter(p => (p.brand_tags ?? []).includes(brand.name)).length

                            return (
                              <div key={brand.id}>
                                {/* Brand header */}
                                <div className="flex items-center px-5 py-3 bg-white gap-2">
                                  <button type="button" onClick={() => toggleSection(brandKey)}
                                    className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-sm font-black text-mp-blue">{brand.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400">{assignedCount} asignados</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ml-auto ${isBrandOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sileo.show({
                                        type: 'error',
                                        title: `¿Eliminar ${brand.name}?`,
                                        description: 'Se eliminará la marca y sus asignaciones se perderán.',
                                        duration: 8000,
                                        button: {
                                          title: 'Eliminar',
                                          onClick: async () => {
                                            const result = await hardDeletePart(brand.id)
                                            if (result.error) {
                                              sileo.error({ title: 'Error', description: result.error })
                                            } else {
                                              setParts(prev => prev.filter(p => p.id !== brand.id))
                                              sileo.success({ title: 'Marca eliminada' })
                                            }
                                          },
                                        },
                                      })
                                    }}
                                    className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>

                                {isBrandOpen && (
                                  <div className="border-t border-gray-100 bg-gray-50/30 divide-y divide-gray-50">
                                    {[
                                      { sectionKey: 'repuestos', label: 'Repuestos', globalItems: globalRepuestos },
                                      { sectionKey: 'averias', label: 'Averías', globalItems: globalAverias },
                                    ].map(({ sectionKey: sk, label: slabel, globalItems }) => {
                                      const sKey = `brand::${brand.id}::${sk}`
                                      const isSOpen = !!openSections[sKey]
                                      const subs = Array.from(new Set(globalItems.map(p => p.subcategory ?? 'Otros')))
                                        .sort((a, b) => a === 'Otros' ? 1 : b === 'Otros' ? -1 : a.localeCompare(b))

                                      return (
                                        <div key={sk}>
                                          <button type="button" onClick={() => toggleSection(sKey)}
                                            className="w-full flex items-center justify-between pl-8 pr-5 py-2.5 bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-xs font-bold text-gray-500">{slabel}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform duration-200 ${isSOpen ? 'rotate-180' : ''}`} />
                                          </button>

                                          {isSOpen && (
                                            <div className="divide-y divide-gray-50">
                                              {subs.map(sub => {
                                                const ssKey = `brand::${brand.id}::${sk}::${sub}`
                                                const isSsOpen = !!openSections[ssKey]
                                                const subItems = globalItems.filter(p => (p.subcategory ?? 'Otros') === sub)

                                                return (
                                                  <div key={sub}>
                                                    <button type="button" onClick={() => toggleSection(ssKey)}
                                                      className="w-full flex items-center justify-between pl-10 pr-5 py-2 bg-white hover:bg-gray-50 transition-colors">
                                                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{sub}</span>
                                                      <ChevronDown className={`w-3 h-3 text-gray-200 transition-transform duration-200 ${isSsOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {isSsOpen && (
                                                      <div className="border-t border-gray-50">
                                                        {subItems.map(part => {
                                                          const assigned = (part.brand_tags ?? []).includes(brand.name)
                                                          return (
                                                            <div key={part.id}
                                                              className="flex items-center justify-between pl-12 pr-5 py-2.5 bg-white hover:bg-gray-50 transition-colors">
                                                              <span className="text-sm text-gray-700 font-medium">{part.name}</span>
                                                              <button
                                                                onClick={async () => {
                                                                  const newTags = assigned
                                                                    ? (part.brand_tags ?? []).filter(t => t !== brand.name)
                                                                    : [...(part.brand_tags ?? []), brand.name]
                                                                  const result = await updatePart(part.id, { brand_tags: newTags })
                                                                  if (result?.error) {
                                                                    sileo.error({ title: 'Error', description: result.error })
                                                                  } else {
                                                                    setParts(prev => prev.map(p => p.id === part.id ? { ...p, brand_tags: newTags } : p))
                                                                  }
                                                                }}
                                                                className={`w-8 h-5 rounded-full transition-colors flex-shrink-0 relative ${assigned ? 'bg-mp-blue' : 'bg-gray-200'}`}
                                                              >
                                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${assigned ? 'left-3.5' : 'left-0.5'}`} />
                                                              </button>
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
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()

                  ) : (
                    /* ── Flat list (fallback) ── */
                    <div className="divide-y divide-gray-50">
                      {items.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-gray-400 italic">Sin items en esta categoría</p>
                      ) : items.map(part => (
                        <div key={part.id}
                          className={`flex items-center justify-between px-4 py-3 transition-all ${part.is_active ? 'bg-white' : 'bg-gray-50 opacity-50'}`}>
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-sm text-gray-800">{part.name}</span>
                            {!part.is_active && <Badge variant="gray">Inactiva</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => toggleActive(part)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${part.is_active ? 'text-orange-400 hover:text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}>
                              {part.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button onClick={() => sileo.show({
                              type: 'error',
                              title: `¿Eliminar "${part.name}"?`,
                              description: 'Esta acción no se puede deshacer.',
                              duration: 8000,
                              button: { title: 'Eliminar', onClick: async () => {
                                const result = await hardDeletePart(part.id)
                                if (result.error) sileo.error({ title: 'Error', description: result.error })
                                else { setParts(prev => prev.filter(p => p.id !== part.id)); sileo.success({ title: 'Pieza eliminada' }) }
                              }},
                            })}
                              className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PerfilBlock({ profile }: { profile: Pick<Profile, 'id' | 'full_name' | 'email'> }) {
  const [name, setName] = useState(profile.full_name)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const result = await updateProfile(name)
    setSaving(false)
    if (result.error) sileo.error({ title: 'Error', description: result.error })
    else sileo.success({ title: 'Perfil actualizado' })
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
        <p className="text-sm text-gray-500 px-4 py-3 bg-gray-50 rounded-xl">{profile.email}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre completo</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
          placeholder="Tu nombre"
          required
        />
      </div>
      <Button type="submit" loading={saving} className="w-full">Guardar cambios</Button>
    </form>
  )
}

function EmpresaBlock({ settings: initial }: { settings: CompanySettings | null }) {
  const [form, setForm] = useState({
    name: initial?.name ?? 'MotorPool SAT',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    iva_default: initial?.iva_default ?? 21,
    email_body: initial?.email_body ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await updateCompanySettings({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      iva_default: form.iva_default,
      email_body: form.email_body || null,
    })
    setSaving(false)
    if (result.error) sileo.error({ title: 'Error', description: result.error })
    else sileo.success({ title: 'Datos actualizados' })
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      {[
        { label: 'Nombre empresa', key: 'name', type: 'text', placeholder: 'MotorPool SAT' },
        { label: 'Email de contacto', key: 'email', type: 'email', placeholder: 'info@empresa.com' },
        { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+34 600 000 000' },
        { label: 'Dirección', key: 'address', type: 'text', placeholder: 'Calle...' },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
          <input
            type={type}
            value={form[key as keyof typeof form] as string}
            onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
            placeholder={placeholder}
          />
        </div>
      ))}

      {/* IVA por defecto */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IVA por defecto (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={form.iva_default}
          onChange={e => setForm(prev => ({ ...prev, iva_default: parseFloat(e.target.value) || 0 }))}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
          placeholder="21"
        />
      </div>

      {/* Cuerpo del email */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Cuerpo del email <span className="normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          value={form.email_body}
          onChange={e => setForm(prev => ({ ...prev, email_body: e.target.value }))}
          rows={4}
          placeholder={"Estimado cliente,\n\nAdjunto encontrará..."}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm resize-none"
        />
      </div>

      <Button type="submit" loading={saving} className="w-full">Guardar datos</Button>
    </form>
  )
}

function GestionUsuariosBlock({ users: initialUsers }: { users: (Pick<Profile, 'id' | 'full_name' | 'email'> & { role: string })[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [form, setForm] = useState({ username: '', fullName: '', role: 'technician' })
  const [adding, setAdding] = useState(false)

  const DOMAIN = '@motorpool.com'
  const FACTORY_PASSWORD = 'Motorpool2025'

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || !form.fullName.trim()) return
    const email = form.username.trim().toLowerCase() + DOMAIN
    setAdding(true)
    const result = await createUser(email, form.fullName, FACTORY_PASSWORD, form.role as 'technician' | 'admin')
    setAdding(false)
    if (result.error) {
      sileo.error({ title: 'Error al crear', description: result.error })
    } else {
      sileo.success({ title: 'Usuario creado', description: `${email} — contraseña: ${FACTORY_PASSWORD}` })
      setForm({ username: '', fullName: '', role: 'technician' })
      setUsers(prev => [...prev, { id: crypto.randomUUID(), email, full_name: form.fullName, role: form.role }])
    }
  }

  function handleDelete(user: typeof users[0]) {
    sileo.show({
      type: 'error',
      title: `¿Eliminar a ${user.full_name}?`,
      description: 'Se eliminará la cuenta. Sus partes se conservarán.',
      duration: 8000,
      button: {
        title: 'Eliminar',
        onClick: async () => {
          const result = await deleteUser(user.id)
          if (result.error) sileo.error({ title: 'Error', description: result.error })
          else { setUsers(prev => prev.filter(u => u.id !== user.id)); sileo.success({ title: 'Usuario eliminado' }) }
        },
      },
    })
  }

  return (
    <div className="space-y-5">
      {/* User list */}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">{u.full_name || '(sin nombre)'}</p>
              <p className="text-[11px] text-gray-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-mp-orange/10 text-mp-orange' : 'bg-mp-blue/10 text-mp-blue'}`}>
                {u.role === 'admin' ? 'Admin' : 'Técnico'}
              </span>
              <button
                onClick={() => handleDelete(u)}
                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nuevo usuario</p>
        <form onSubmit={handleCreate} className="space-y-2.5">
          <input type="text" placeholder="Nombre completo" value={form.fullName}
            onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm" required />
          <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-mp-blue">
            <input
              type="text"
              placeholder="usuario"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.replace(/\s+/g, '').toLowerCase() }))}
              className="flex-1 px-4 py-3 bg-transparent border-0 outline-none text-sm"
              required
            />
            <span className="pr-4 text-sm text-gray-400 font-medium select-none">{DOMAIN}</span>
          </div>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm text-gray-700">
            <option value="technician">Técnico</option>
            <option value="admin">Administrador</option>
          </select>
          <p className="text-[10px] text-gray-400">Contraseña inicial: <span className="font-bold text-gray-500">{FACTORY_PASSWORD}</span></p>
          <Button type="submit" loading={adding} className="w-full bg-mp-blue text-white hover:bg-mp-blue/90">
            Crear usuario
          </Button>
        </form>
      </div>
    </div>
  )
}

function ExportarBlock() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('diagnostics')
      .select('*, diagnostic_items(*, parts_catalog(name)), profiles(full_name)')
      .order('created_at', { ascending: false })

    if (error || !data) {
      sileo.error({ title: 'Error al exportar' })
      setExporting(false)
      return
    }

    const rows = [
      ['Ref', 'Cliente', 'Modelo', 'Filtro', 'Fuente', 'Horas Motor', 'Horas Fuente', 'Avería', 'Repuestos', 'Técnico', 'Estado', 'Fecha'],
      ...data.map(d => [
        d.id.slice(0, 8).toUpperCase(),
        d.cliente,
        d.modelo,
        d.filtro ?? '',
        d.fuente_alimentacion ?? '',
        d.horas_motor ?? '',
        d.horas_fuente ?? '',
        (d.descripcion_averia ?? '').replace(/"/g, '""'),
        (d.diagnostic_items ?? []).map((i: any) => `${i.quantity}x ${i.parts_catalog?.name ?? i.custom_name}`).join('; '),
        (d.profiles as any)?.full_name ?? '',
        d.status === 'completed' ? 'Finalizado' : 'Abierto',
        new Date(d.created_at).toLocaleDateString('es-ES'),
      ])
    ]

    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MotorPool_Historial_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
    sileo.success({ title: 'CSV exportado' })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Exporta todo el historial de diagnósticos en formato CSV (compatible con Excel).</p>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2.5 bg-mp-blue text-white font-bold text-sm py-3.5 rounded-xl hover:bg-mp-blue/90 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {exporting ? 'Exportando...' : 'Descargar CSV'}
      </button>
    </div>
  )
}

function VaciarBlock() {
  const [step, setStep] = useState<'idle' | 'generating' | 'confirm' | 'purging'>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  async function handleGenerate() {
    setStep('generating')
    const { data, error } = await getAllDiagnosticsForExport()
    if (error || !data) {
      sileo.error({ title: 'Error al obtener datos', description: error })
      setStep('idle')
      return
    }
    if (data.length === 0) {
      sileo.error({ title: 'No hay diagnósticos para exportar' })
      setStep('idle')
      return
    }

    const JSZip = (await import('jszip')).default
    const { generatePDFBase64 } = await import('@/lib/pdf')
    const zip = new JSZip()

    setProgress({ current: 0, total: data.length })

    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      const pdf = await generatePDFBase64(d)
      const filename = `${d.id.slice(0, 8).toUpperCase()}_${d.cliente.replace(/\s+/g, '_')}_${d.created_at.slice(0, 10)}.pdf`
      zip.file(filename, pdf, { base64: true })
      setProgress({ current: i + 1, total: data.length })
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MotorPool_Backup_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)

    setStep('confirm')
  }

  async function handlePurge() {
    setStep('purging')
    const result = await purgeAllDiagnostics()
    if (result.error) {
      sileo.error({ title: 'Error al limpiar', description: result.error })
      setStep('confirm')
      return
    }
    sileo.success({ title: 'Base de datos limpiada', description: 'Todos los partes y fotos han sido eliminados.' })
    setStep('idle')
    setProgress({ current: 0, total: 0 })
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-bold text-mp-blue">¿Para qué sirve esto?</p>
        <p className="text-xs text-blue-700">La app usa almacenamiento limitado. Limpiar periódicamente descarga un ZIP con todos los PDFs y libera espacio para seguir trabajando sin interrupciones. El catálogo de recambios y los usuarios no se ven afectados.</p>
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-bold text-amber-700">Recomendación</p>
        <p className="text-xs text-amber-600">Realiza esta limpieza cada <span className="font-bold">2 meses</span> aproximadamente. Este intervalo puede variar según el volumen de trabajo — a mayor número de partes y fotos, más frecuente deberá ser.</p>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-bold text-red-700">Acción destructiva e irreversible</p>
        <p className="text-xs text-red-600">Una vez confirmada, todos los partes y fotos se eliminarán permanentemente. Asegúrate de guardar el ZIP antes de continuar.</p>
      </div>

      {step === 'idle' && (
        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2.5 bg-red-500 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-red-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Generar ZIP y vaciar base de datos
        </button>
      )}

      {step === 'generating' && (
        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-mp-blue h-2 rounded-full transition-all duration-300"
              style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 font-medium">
            Generando PDFs... {progress.current} / {progress.total}
          </p>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-green-700">ZIP descargado correctamente</p>
            <p className="text-xs text-green-600 mt-0.5">Verifica que el archivo ZIP se ha guardado antes de continuar.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('idle')}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePurge}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
            >
              Confirmar y vaciar
            </button>
          </div>
        </div>
      )}

      {step === 'purging' && (
        <p className="text-center text-sm text-gray-500 font-medium py-2">Limpiando base de datos...</p>
      )}
    </div>
  )
}

type UserMin = Pick<Profile, 'id' | 'full_name' | 'email'>

function ResetPasswordBlock({ users }: { users: UserMin[] }) {
  const [selectedId, setSelectedId] = useState('')
  const [resetting, setResetting] = useState(false)

  function handleReset() {
    if (!selectedId) return
    const user = users.find(u => u.id === selectedId)
    sileo.show({
      type: 'error',
      title: '¿Restablecer contraseña?',
      description: `${user?.full_name} — La contraseña se cambiará a la de fábrica. ¿Estás seguro?`,
      duration: 8000,
      button: {
        title: 'Restablecer',
        onClick: async () => {
          setResetting(true)
          const result = await resetUserPassword(selectedId)
          setResetting(false)
          if (result.error) {
            sileo.error({ title: 'Error', description: result.error })
          } else {
            sileo.success({ title: 'Contraseña restablecida', description: `${user?.full_name} → Motorpool2025` })
          }
        },
      },
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Seleccionar usuario
        </label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-mp-blue text-sm"
        >
          <option value="">— Elige un usuario —</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.full_name} (@{u.email.split('@')[0]})
            </option>
          ))}
        </select>
      </div>
      <Button
        onClick={handleReset}
        loading={resetting}
        disabled={!selectedId}
        variant="ghost"
        className="w-full"
      >
        Restablecer contraseña de fábrica
      </Button>
    </div>
  )
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Creó parte',
  complete: 'Finalizó parte',
  reopen: 'Reabrió parte',
  delete: 'Eliminó parte',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-blue-600 bg-blue-50',
  complete: 'text-green-600 bg-green-50',
  reopen: 'text-amber-600 bg-amber-50',
  delete: 'text-red-500 bg-red-50',
}

function AuditLogBlock({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Sin registros</p>
  }

  return (
    <div className="space-y-2">
      {entries.map(e => {
        const label = ACTION_LABELS[e.action] ?? e.action
        const colorClass = ACTION_COLORS[e.action] ?? 'text-gray-600 bg-gray-100'
        const who = e.profiles?.full_name ?? 'Desconocido'
        const when = new Date(e.created_at).toLocaleString('es-ES', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })

        return (
          <div key={e.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tight ${colorClass}`}>
              {label}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-medium truncate">{e.description}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{who} · {when}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Props = {
  isAdmin: boolean
  parts: Part[]
  users: (Pick<Profile, 'id' | 'full_name' | 'email'> & { role: string })[]
  settings: CompanySettings | null
  currentProfile: Pick<Profile, 'id' | 'full_name' | 'email'>
  auditLog: AuditEntry[]
}

export default function AjustesClient({ isAdmin, parts, users, settings, currentProfile, auditLog }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-mp-blue">Ajustes</h1>

      <Block title="Perfil">
        <PerfilBlock profile={currentProfile} />
      </Block>

      <Block title="Seguridad">
        <div className="space-y-6">
          <SegurityBlock />
          {isAdmin && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Restablecer contraseña de usuario
              </p>
              <ResetPasswordBlock users={users} />
            </div>
          )}
        </div>
      </Block>

      {isAdmin && (
        <Block title="Datos de la empresa">
          <EmpresaBlock settings={settings} />
        </Block>
      )}

      {isAdmin && (
        <Block title="Gestión de usuarios">
          <GestionUsuariosBlock users={users} />
        </Block>
      )}

      <Block title="Catálogo de recambios">
        <CatalogoBlock parts={parts} isAdmin={isAdmin} />
      </Block>

      <Block title="Exportar datos">
        <ExportarBlock />
      </Block>

      {isAdmin && (
        <Block title="Limpiar base de datos">
          <VaciarBlock />
        </Block>
      )}

      {isAdmin && (
        <Block title="Historial de cambios">
          <AuditLogBlock entries={auditLog} />
        </Block>
      )}
    </div>
  )
}
