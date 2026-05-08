import { createClient } from '@/lib/supabase/client'
import { sileo } from 'sileo'
import { savePhotoRecord } from '@/actions/photos'

const QUOTA_KEYWORDS = ['quota', 'storage limit', 'exceeded', 'capacity', 'insufficient', 'not enough space']

function isQuotaError(msg: string) {
  return QUOTA_KEYWORDS.some(k => msg.toLowerCase().includes(k))
}

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

    if (error) {
      if (isQuotaError(error.message)) {
        sileo.show({
          type: 'error',
          title: 'Almacenamiento lleno',
          description: 'No hay espacio para subir más fotos. Ve a Ajustes → Limpiar base de datos, descarga el ZIP con el historial y limpia el almacenamiento.',
          duration: 0,
        })
        return
      }
    } else {
      await savePhotoRecord(diagnosticId, path, file.name)
    }
  }
}
