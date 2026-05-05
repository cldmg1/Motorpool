'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePhotoRecord(
  diagnosticId: string,
  storagePath: string,
  fileName: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('diagnostic_photos').insert({
    diagnostic_id: diagnosticId,
    storage_path: storagePath,
    file_name: fileName,
  })

  if (error) return { error: error.message }
  revalidatePath(`/diagnostico/${diagnosticId}`)
  return {}
}

export async function deletePhoto(
  photoId: string,
  storagePath: string,
  diagnosticId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  await supabase.storage.from('diagnostic-photos').remove([storagePath])

  const { error } = await supabase
    .from('diagnostic_photos')
    .delete()
    .eq('id', photoId)

  if (error) return { error: error.message }
  revalidatePath(`/diagnostico/${diagnosticId}`)
  return {}
}
