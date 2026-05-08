'use server'

import { createClient } from '@/lib/supabase/server'

export async function logAction(
  action: string,
  entityType: string,
  entityId: string,
  description: string
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
    })
  } catch {
    // audit log failures should never break the main flow
  }
}
