'use server'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const username = (formData.get('username') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const email = `${username}@motorpool.com`

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    }
  )

  const data = await res.json()

  if (!res.ok || !data.access_token) {
    return { error: 'Usuario o contraseña incorrectos.' }
  }

  const supabase = await createClient()
  await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })

  return { success: true }
}
