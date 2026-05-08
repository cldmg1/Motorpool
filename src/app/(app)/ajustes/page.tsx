export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AjustesClient from '@/components/ajustes/AjustesClient'
import { getCompanySettings } from '@/actions/settings'

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const isAdmin = profile?.role === 'admin'

  const [{ data: parts }, { data: profiles }, settings, currentProfileResult, { data: auditLog }] = await Promise.all([
    supabase.from('parts_catalog').select('*').order('sort_order'),
    isAdmin
      ? supabase.from('profiles').select('id, full_name, email, role').order('full_name')
      : Promise.resolve({ data: [] }),
    getCompanySettings(),
    supabase.from('profiles').select('id, full_name, email, role').eq('id', user!.id).single(),
    isAdmin
      ? supabase
          .from('audit_log')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <AjustesClient
        isAdmin={isAdmin}
        parts={parts ?? []}
        users={profiles ?? []}
        settings={settings}
        currentProfile={currentProfileResult.data!}
        auditLog={(auditLog ?? []) as any}
      />
    </div>
  )
}
