'use server'

import { createClient } from '@/lib/supabase/server'
import type { DiagnosticWithItems } from '@/lib/types'

export async function getAllDiagnosticsForExport(): Promise<{ data?: DiagnosticWithItems[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Sin permisos' }

  const { data, error } = await supabase
    .from('diagnostics')
    .select('*, diagnostic_items(*, parts_catalog(*)), diagnostic_photos(*), profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: (data as any) ?? [] }
}

export async function purgeAllDiagnostics(): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Only admins
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Sin permisos' }

  // Get all storage paths before deleting
  const { data: photos } = await supabase
    .from('diagnostic_photos')
    .select('storage_path')

  // Delete all storage files
  if (photos && photos.length > 0) {
    const paths = photos.map(p => p.storage_path)
    // Delete in batches of 100 (Supabase limit)
    for (let i = 0; i < paths.length; i += 100) {
      await supabase.storage.from('diagnostic-photos').remove(paths.slice(i, i + 100))
    }
  }

  // Delete all quotes (cascade deletes quote_items)
  await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Delete all diagnostics (cascade deletes items + photo records)
  const { error } = await supabase.from('diagnostics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }

  return {}
}
