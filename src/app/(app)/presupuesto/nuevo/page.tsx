export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QuoteForm from '@/components/presupuesto/QuoteForm'
import { getCompanySettings } from '@/actions/settings'

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ diagnosticId?: string }>
}) {
  const { diagnosticId } = await searchParams
  if (!diagnosticId) notFound()

  const supabase = await createClient()
  const { data: diagnostic } = await supabase
    .from('diagnostics')
    .select('*, diagnostic_items(*, parts_catalog(*)), diagnostic_photos(*), profiles(full_name, email)')
    .eq('id', diagnosticId)
    .single()

  if (!diagnostic) notFound()

  const settings = await getCompanySettings()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <QuoteForm diagnostic={diagnostic as any} companySettings={settings} />
    </div>
  )
}
