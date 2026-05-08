'use client'

import { useState, useEffect } from 'react'

export default function RealtimeClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null

  const fecha = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const hora = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const fechaCapitalizada = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  return (
    <div className="text-right shrink-0">
      <p className="text-lg font-black text-mp-blue tabular-nums leading-none">{hora}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{fechaCapitalizada}</p>
    </div>
  )
}
