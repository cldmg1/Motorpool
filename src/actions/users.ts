'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/types'

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<{ error?: string }> {
  const supabase = await createAdminClient()

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return {}
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ error?: string }> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return {}
}
