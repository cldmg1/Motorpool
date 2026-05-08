'use server'

import { createClient } from '@/lib/supabase/server'

export async function markPasswordChanged(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('profiles').update({ has_changed_password: true }).eq('id', user.id)
  if (error) return { error: error.message }
  return {}
}

export async function updateProfile(fullName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id)
  if (error) return { error: error.message }
  return {}
}
