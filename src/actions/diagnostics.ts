'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ChecklistItem, DiagnosticFormData } from '@/lib/types'

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
      status: 'completed',
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
  return { id: diagnostic.id }
}

export async function deleteDiagnostic(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('diagnostics').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/historial')
  return {}
}
