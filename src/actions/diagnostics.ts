'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ChecklistItem, DiagnosticFormData } from '@/lib/types'
import { logAction } from '@/actions/audit'

export async function createDiagnostic(
  formData: DiagnosticFormData,
  items: ChecklistItem[]
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const selectedItems = items.filter(i => i.checked)

  const { data: diagnostic, error: diagError } = await supabase
    .from('diagnostics')
    .insert({
      user_id: user.id,
      cliente: formData.cliente,
      modelo: formData.modelo,
      filtro: formData.filtro || null,
      fuente_alimentacion: formData.fuente_alimentacion || null,
      horas_motor: formData.horas_motor ? parseFloat(formData.horas_motor) : null,
      horas_fuente: formData.horas_fuente ? parseFloat(formData.horas_fuente) : null,
      descripcion_averia: formData.descripcion_averia || null,
      numero_serie: formData.numero_serie || null,
      prioridad: formData.prioridad || 'normal',
      tipo_intervencion: formData.tipo_intervencion || null,
      fecha_entrega: formData.fecha_entrega || null,
      notas_internas: formData.notas_internas || null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (diagError || !diagnostic) {
    return { error: diagError?.message ?? 'Error al crear diagnóstico' }
  }

  if (selectedItems.length > 0) {
    const { error: itemsError } = await supabase.from('diagnostic_items').insert(
      selectedItems.map(item => ({
        diagnostic_id: diagnostic.id,
        part_id: item.part_id,
        custom_name: item.is_custom ? item.name : null,
        quantity: item.quantity,
      }))
    )
    if (itemsError) {
      return { error: itemsError.message }
    }
  }

  revalidatePath('/historial')
  await logAction('create', 'diagnostic', diagnostic.id, `Parte creado: ${formData.cliente} — ${formData.modelo}`)
  return { id: diagnostic.id }
}

export async function updateDiagnostic(
  id: string,
  formData: DiagnosticFormData,
  items: ChecklistItem[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error: diagError } = await supabase.from('diagnostics').update({
    cliente: formData.cliente,
    modelo: formData.modelo,
    filtro: formData.filtro || null,
    fuente_alimentacion: formData.fuente_alimentacion || null,
    horas_motor: formData.horas_motor ? parseFloat(formData.horas_motor) : null,
    horas_fuente: formData.horas_fuente ? parseFloat(formData.horas_fuente) : null,
    descripcion_averia: formData.descripcion_averia || null,
    numero_serie: formData.numero_serie || null,
    prioridad: formData.prioridad || 'normal',
    tipo_intervencion: formData.tipo_intervencion || null,
    fecha_entrega: formData.fecha_entrega || null,
    notas_internas: formData.notas_internas || null,
  }).eq('id', id)

  if (diagError) return { error: diagError.message }

  // Replace all items
  const { error: delError } = await supabase.from('diagnostic_items').delete().eq('diagnostic_id', id)
  if (delError) return { error: delError.message }

  const selectedItems = items.filter(i => i.checked)
  if (selectedItems.length > 0) {
    const { error: itemsError } = await supabase.from('diagnostic_items').insert(
      selectedItems.map(item => ({
        diagnostic_id: id,
        part_id: item.part_id,
        custom_name: item.is_custom ? item.name : null,
        quantity: item.quantity,
      }))
    )
    if (itemsError) return { error: itemsError.message }
  }

  revalidatePath('/historial')
  revalidatePath(`/diagnostico/${id}`)
  return {}
}

export async function updateDiagnosticStatus(id: string, status: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const updateData: Record<string, unknown> = { status }
  if (status === 'completed') {
    updateData.closed_at = new Date().toISOString()
  } else if (status === 'draft') {
    updateData.closed_at = null
  }
  // en_espera: no changes to closed_at

  const { error } = await supabase.from('diagnostics').update(updateData).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/historial')
  revalidatePath(`/diagnostico/${id}`)
  if (status === 'completed') {
    await logAction('complete', 'diagnostic', id, 'Parte finalizado')
  } else if (status === 'draft') {
    await logAction('reopen', 'diagnostic', id, 'Parte reabierto')
  } else if (status === 'en_espera') {
    await logAction('en_espera', 'diagnostic', id, 'Parte en espera de piezas')
  }
  return {}
}

export async function deleteDiagnostic(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Delete storage files before removing the DB records
  const { data: photos } = await supabase
    .from('diagnostic_photos')
    .select('storage_path')
    .eq('diagnostic_id', id)

  if (photos && photos.length > 0) {
    await supabase.storage
      .from('diagnostic-photos')
      .remove(photos.map(p => p.storage_path))
  }

  // Delete associated quotes (cascade handles quote_items)
  await supabase.from('quotes').delete().eq('diagnostic_id', id)

  const { error } = await supabase.from('diagnostics').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/historial')
  await logAction('delete', 'diagnostic', id, 'Parte eliminado')
  return {}
}
