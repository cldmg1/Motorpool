export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditDiagnosticWizard from '@/components/diagnostico/EditDiagnosticWizard'

export default async function EditDiagnosticPage({
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

  if (!diagnostic) notFound()
  if (diagnostic.status !== 'draft') redirect(`/diagnostico/${id}`)

  const { data: parts } = await supabase
    .from('parts_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <EditDiagnosticWizard diagnostic={diagnostic as any} parts={parts ?? []} />
    </div>
  )
}
