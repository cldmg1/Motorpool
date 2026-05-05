'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPart(name: string, category?: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('parts_catalog')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('parts_catalog').insert({
    name: name.trim(),
    category: category?.trim() || null,
    sort_order: (last?.sort_order ?? 0) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/catalogo')
  revalidatePath('/diagnostico')
  return {}
}

export async function updatePart(
  id: string,
  updates: { name?: string; category?: string; is_active?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('parts_catalog').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/catalogo')
  revalidatePath('/diagnostico')
  return {}
}

export async function deletePart(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('parts_catalog')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/catalogo')
  revalidatePath('/diagnostico')
  return {}
}
