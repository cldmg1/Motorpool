'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function createPart(
  name: string,
  category?: string,
  subcategory?: string,
  brand_section?: string,
  brand_subsection?: string,
): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
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
    subcategory: subcategory?.trim() || null,
    brand_section: brand_section?.trim() || null,
    brand_subsection: brand_subsection?.trim() || null,
    sort_order: (last?.sort_order ?? 0) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/catalogo')
  revalidatePath('/diagnostico')
  return {}
}

export async function updatePart(
  id: string,
  updates: { name?: string; category?: string; subcategory?: string; brand_section?: string; brand_subsection?: string; brand_tags?: string[]; is_active?: boolean }
): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
  const supabase = await createClient()
  const { error } = await supabase.from('parts_catalog').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/catalogo')
  revalidatePath('/diagnostico')
  return {}
}

export async function deletePart(id: string): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
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

export async function hardDeletePart(id: string): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
  const supabase = await createClient()
  const { error } = await supabase.from('parts_catalog').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/catalogo')
  revalidatePath('/diagnostico')
  return {}
}
