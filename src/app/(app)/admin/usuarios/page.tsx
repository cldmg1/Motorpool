export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import UsuariosClient from '@/components/admin/UsuariosClient'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <UsuariosClient profiles={profiles ?? []} />
    </div>
  )
}
