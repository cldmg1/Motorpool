export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PerfilClient from '@/components/layout/PerfilClient'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PerfilClient profile={profile!} />
    </div>
  )
}
