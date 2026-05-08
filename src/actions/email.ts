'use server'

import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_PDF_BYTES = 5 * 1024 * 1024 // 5 MB base64

async function assertAuthenticated() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function sendDiagnosticEmail(
  to: string,
  pdfBase64: string,
  clienteName: string,
  diagnosticRef: string,
  emailBody?: string | null,
): Promise<{ error?: string }> {
  if (!(await assertAuthenticated())) return { error: 'No autenticado.' }
  if (!EMAIL_REGEX.test(to)) return { error: 'Email destinatario no válido.' }
  if (Buffer.byteLength(pdfBase64, 'base64') > MAX_PDF_BYTES) return { error: 'PDF demasiado grande (máx 5 MB).' }

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    return { error: 'Configuración de email no disponible.' }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  const filename = `Diagnostico_${clienteName.replace(/\s+/g, '_')}.pdf`
  const defaultBody = `Adjunto encontrarás el informe de diagnóstico de MotorPool SAT.\n\nRef: #${diagnosticRef}\nCliente: ${clienteName}\n\nSaludos,\nMotorPool SAT`

  try {
    await transporter.sendMail({
      from: `MotorPool SAT <${user}>`,
      to,
      subject: `Informe de diagnóstico – ${clienteName}`,
      text: emailBody || defaultBody,
      attachments: [
        {
          filename,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    })
    return {}
  } catch (err: any) {
    return { error: err.message ?? 'Error al enviar el email.' }
  }
}

export async function sendQuoteEmail(
  to: string,
  pdfBase64: string,
  clienteName: string,
  quoteRef: string,
  emailBody?: string | null,
): Promise<{ error?: string }> {
  if (!(await assertAuthenticated())) return { error: 'No autenticado.' }
  if (!EMAIL_REGEX.test(to)) return { error: 'Email destinatario no válido.' }
  if (Buffer.byteLength(pdfBase64, 'base64') > MAX_PDF_BYTES) return { error: 'PDF demasiado grande (máx 5 MB).' }

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    return { error: 'Configuración de email no disponible.' }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  const filename = `Presupuesto_${clienteName.replace(/\s+/g, '_')}.pdf`
  const defaultBody = `Adjunto encontrarás el presupuesto de MotorPool SAT.\n\nRef: #${quoteRef}\nCliente: ${clienteName}\n\nSaludos,\nMotorPool SAT`

  try {
    await transporter.sendMail({
      from: `MotorPool SAT <${user}>`,
      to,
      subject: `Presupuesto – ${clienteName}`,
      text: emailBody || defaultBody,
      attachments: [
        {
          filename,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    })
    return {}
  } catch (err: any) {
    return { error: err.message ?? 'Error al enviar el email.' }
  }
}
