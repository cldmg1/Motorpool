import { createClient } from '@/lib/supabase/server'
import DiagnosticList from '@/components/historial/DiagnosticList'

export const dynamic = 'force-dynamic'

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page = '1' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const pageNum = parseInt(page) || 1
  const pageSize = 20
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('diagnostics')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (profile?.role !== 'admin') {
    query = query.eq('user_id', user!.id)
  }

  if (q) {
    query = query.or(`cliente.ilike.%${q}%,modelo.ilike.%${q}%`)
  }

  const { data: diagnostics, count } = await query

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <DiagnosticList
        diagnostics={diagnostics ?? []}
        total={count ?? 0}
        page={pageNum}
        pageSize={pageSize}
        searchQuery={q}
        isAdmin={profile?.role === 'admin'}
      />
    </div>
  )
}
