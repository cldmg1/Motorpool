export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import DiagnosticWizard from '@/components/diagnostico/DiagnosticWizard'

export default async function DiagnosticoPage() {
  const supabase = await createClient()
  const { data: parts } = await supabase
    .from('parts_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <DiagnosticWizard parts={parts ?? []} />
    </div>
  )
}
