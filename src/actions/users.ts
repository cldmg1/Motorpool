'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

const FACTORY_PASSWORD = process.env.FACTORY_RESET_PASSWORD ?? 'MotorPool-Reset-2025'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function resetUserPassword(userId: string): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: FACTORY_PASSWORD })
  if (error) return { error: error.message }
  return {}
}

export async function createUser(
  email: string,
  fullName: string,
  password: string,
  role: 'technician' | 'admin' = 'technician'
): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })
  if (error) return { error: error.message }
  return {}
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  if (!(await assertAdmin())) return { error: 'Sin permisos' }
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return {}
}
