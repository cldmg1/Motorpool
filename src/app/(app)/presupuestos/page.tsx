export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PresupuestosClient from '@/components/presupuesto/PresupuestosClient'

export default async function PresupuestosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('user_id', user!.id)
  }

  const { data: quotes } = await query

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PresupuestosClient quotes={(quotes ?? []) as any} />
    </div>
  )
}
