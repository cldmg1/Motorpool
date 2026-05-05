export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import CatalogoClient from '@/components/admin/CatalogoClient'

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: parts } = await supabase
    .from('parts_catalog')
    .select('*')
    .order('sort_order')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <CatalogoClient parts={parts ?? []} />
    </div>
  )
}
