import { createClient } from '@/lib/supabase/server'
import HistorialClient from '@/components/historial/HistorialClient'

export const dynamic = 'force-dynamic'

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('diagnostics')
    .select('*, diagnostic_items(*, parts_catalog(*)), diagnostic_photos(*), profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('user_id', user!.id)
  }

  const { data: diagnostics } = await query

  let technicians: { id: string; full_name: string }[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'technician')
      .order('full_name', { ascending: true })
    technicians = data ?? []
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <HistorialClient
        diagnostics={(diagnostics ?? []) as any}
        isAdmin={isAdmin}
        technicians={technicians}
      />
    </div>
  )
}
