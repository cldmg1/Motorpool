import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MotorPool SAT',
  description: 'Sistema de diagnóstico para técnicos SAT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
