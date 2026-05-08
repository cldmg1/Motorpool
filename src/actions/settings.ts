'use server'

import { createClient } from '@/lib/supabase/server'
import type { CompanySettings } from '@/lib/types'

export async function getCompanySettings(): Promise<CompanySettings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('company_settings').select('*').eq('id', 1).single()
  return data ?? null
}

export async function updateCompanySettings(
  updates: Partial<Pick<CompanySettings, 'name' | 'email' | 'phone' | 'address' | 'iva_default' | 'email_body'>>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Sin permisos' }

  const { error } = await supabase.from('company_settings').update(updates).eq('id', 1)
  if (error) return { error: error.message }
  return {}
}
