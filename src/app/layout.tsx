import type { Metadata } from 'next'
import './globals.css'
import 'sileo/styles.css'
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { Toaster } from "sileo";

export const metadata: Metadata = {
  title: 'MotorPool SAT',
  description: 'Sistema de diagnóstico para técnicos SAT',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MotorPool SAT',
  },
  themeColor: '#0a3a54',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={cn("h-full", "font-sans", GeistSans.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" theme="light" options={{ fill: '#1a1a1a' }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
          }
        ` }} />
      </body>
    </html>
  )
}
