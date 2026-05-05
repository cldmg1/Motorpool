export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DiagnosticDetail from '@/components/diagnostico/DiagnosticDetail'

export default async function DiagnosticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: diagnostic } = await supabase
    .from('diagnostics')
    .select('*, diagnostic_items(*, parts_catalog(*)), diagnostic_photos(*), profiles(full_name, email)')
    .eq('id', id)
    .single()

  if (!diagnostic) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <DiagnosticDetail diagnostic={diagnostic as any} />
    </div>
  )
}
