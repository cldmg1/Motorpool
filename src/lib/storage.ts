import { createClient } from '@/lib/supabase/client'
import { savePhotoRecord } from '@/actions/photos'

export async function uploadPhotos(diagnosticId: string, files: File[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${diagnosticId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('diagnostic-photos')
      .upload(path, file, { upsert: false })

    if (!error) {
      await savePhotoRecord(diagnosticId, path, file.name)
    }
  }
}
