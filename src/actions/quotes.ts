'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { QuoteItem } from '@/lib/types'

export async function createQuote(data: {
  diagnostic_id?: string | null
  cliente: string
  modelo: string
  notas?: string
  iva_included: boolean
  iva_rate: number
  firma_cliente?: string | null
  fecha_validez?: string | null
  items: Omit<QuoteItem, 'id' | 'quote_id'>[]
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: quote, error } = await supabase.from('quotes').insert({
    user_id: user.id,
    diagnostic_id: data.diagnostic_id ?? null,
    cliente: data.cliente,
    modelo: data.modelo,
    notas: data.notas || null,
    iva_included: data.iva_included,
    iva_rate: data.iva_rate,
    firma_cliente: data.firma_cliente ?? null,
    fecha_validez: data.fecha_validez ?? null,
  }).select('id').single()

  if (error || !quote) return { error: error?.message ?? 'Error al crear presupuesto' }

  if (data.items.length > 0) {
    const { error: itemsError } = await supabase.from('quote_items').insert(
      data.items.map(item => ({ ...item, quote_id: quote.id }))
    )
    if (itemsError) return { error: itemsError.message }
  }

  revalidatePath(`/diagnostico/${data.diagnostic_id}`)
  return { id: quote.id }
}

export async function deleteQuote(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function updateQuoteStatus(
  id: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/presupuestos')
  return {}
}
