import type { DiagnosticWithItems, DiagnosticPhoto } from '@/lib/types'

const LOGO_URL = 'https://i.postimg.cc/bv1cQ0GM/Imagotipo-Vertical-con-Eslogan-PNG-COLOR.png'

const MP_BLUE: [number, number, number] = [10, 58, 84]
const MP_ORANGE: [number, number, number] = [248, 90, 43]
const GRAY_DARK: [number, number, number] = [40, 40, 40]
const GRAY_MID: [number, number, number] = [100, 100, 100]
const GRAY_LIGHT: [number, number, number] = [245, 245, 245]
const WHITE: [number, number, number] = [255, 255, 255]

async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function fetchLogoBase64(): Promise<string | null> {
  return fetchImageBase64(LOGO_URL)
}

async function fetchPhotoBase64(path: string): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('diagnostic-photos')
      .createSignedUrl(path, 120)
    if (!data?.signedUrl) return null
    return fetchImageBase64(data.signedUrl)
  } catch {
    return null
  }
}

function sectionHeader(doc: any, y: number, label: string) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setDrawColor(...MP_BLUE)
  doc.setLineWidth(0.5)
  doc.line(14, y, pageW - 14, y)
  doc.setFillColor(...MP_ORANGE)
  doc.rect(14, y + 2, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...MP_BLUE)
  doc.text(label, 20, y + 5)
  return y + 10
}

async function addPhotosPage(doc: any, photos: DiagnosticPhoto[], pageW: number, pageH: number) {
  if (photos.length === 0) return

  const MARGIN = 14
  const COL_GAP = 8
  const ROW_GAP = 10
  const PHOTO_W = (pageW - MARGIN * 2 - COL_GAP) / 2  // ~87mm
  const PHOTO_H = 68
  const LABEL_H = 6
  const ROW_H = PHOTO_H + LABEL_H + ROW_GAP

  doc.addPage()

  // Blue left bar
  doc.setFillColor(...MP_BLUE)
  doc.rect(0, 0, 5, pageH, 'F')

  let y = sectionHeader(doc, 18, 'FOTOGRAFÍAS DEL DIAGNÓSTICO')
  y += 2

  let col = 0

  for (let i = 0; i < photos.length; i++) {
    // New row: check if new page needed
    if (col === 0 && i > 0) {
      y += ROW_H
      if (y + PHOTO_H > pageH - 20) {
        doc.addPage()
        doc.setFillColor(...MP_BLUE)
        doc.rect(0, 0, 5, pageH, 'F')
        y = sectionHeader(doc, 18, 'FOTOGRAFÍAS DEL DIAGNÓSTICO')
        y += 2
      }
    }

    const x = MARGIN + col * (PHOTO_W + COL_GAP)

    // Photo background
    doc.setFillColor(...GRAY_LIGHT)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, PHOTO_W, PHOTO_H, 2, 2, 'FD')

    // Fetch and draw image
    const imgData = await fetchPhotoBase64(photos[i].storage_path)
    if (imgData) {
      const mimeType = imgData.split(';')[0].split(':')[1] ?? 'image/jpeg'
      const format = mimeType.includes('png') ? 'PNG' : 'JPEG'
      const raw = imgData.split(',')[1]
      try {
        // Fit image inside the box maintaining aspect ratio
        doc.addImage(raw, format, x, y, PHOTO_W, PHOTO_H, undefined, 'FAST')
      } catch {
        // If image fails, show placeholder text
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...GRAY_MID)
        doc.text('Sin imagen', x + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' })
      }
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...GRAY_MID)
      doc.text('Sin imagen', x + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' })
    }

    // Photo number + filename label
    const label = `${i + 1}. ${photos[i].file_name}`
    const shortLabel = label.length > 42 ? label.slice(0, 39) + '...' : label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_MID)
    doc.text(shortLabel, x, y + PHOTO_H + 4.5)

    col = col === 0 ? 1 : 0
  }
}

async function buildDoc(
  diagnostic: DiagnosticWithItems,
  companySettings?: { email: string; name: string } | null
) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const logo = await fetchLogoBase64()

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...MP_BLUE)
  doc.rect(0, 0, 5, 42, 'F')

  if (logo) {
    doc.addImage(logo, 'PNG', 10, 4, 30, 34)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...MP_BLUE)
    doc.text('MOTORPOOL', 12, 16)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_MID)
    doc.text('Servicio de Asistencia Técnica', 12, 22)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...GRAY_DARK)
  doc.text('INFORME DE DIAGNÓSTICO', pageW - 14, 14, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MID)
  const dateStr = new Date(diagnostic.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  doc.text(`Ref: #${diagnostic.id.slice(0, 8).toUpperCase()}`, pageW - 14, 22, { align: 'right' })
  doc.text(dateStr, pageW - 14, 28, { align: 'right' })

  doc.setDrawColor(...MP_BLUE)
  doc.setLineWidth(0.8)
  doc.line(0, 43, pageW, 43)

  let y = 52

  // ── DATOS DEL EQUIPO ────────────────────────────────────────────────────────
  y = sectionHeader(doc, y, 'DATOS DEL EQUIPO')

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Cliente', diagnostic.cliente],
      ['Modelo', diagnostic.modelo],
      ['Nº de Serie', diagnostic.numero_serie ?? '—'],
      ['Filtro', diagnostic.filtro ?? '—'],
      ['Fuente de Alimentación', diagnostic.fuente_alimentacion ?? '—'],
      ['Horas Motor', diagnostic.horas_motor ? `${diagnostic.horas_motor} h` : '—'],
      ['Horas Fuente', diagnostic.horas_fuente ? `${diagnostic.horas_fuente} h` : '—'],
      ['Tipo', (diagnostic as any).tipo_intervencion ?? '—'],
      ['Fecha de entrega', (diagnostic as any).fecha_entrega ? new Date((diagnostic as any).fecha_entrega).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: GRAY_MID, cellWidth: 58 },
      1: { textColor: GRAY_DARK },
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── AVERÍA DETECTADA ────────────────────────────────────────────────────────
  if (diagnostic.descripcion_averia) {
    y = sectionHeader(doc, y, 'AVERÍA DETECTADA')
    const lines = doc.splitTextToSize(diagnostic.descripcion_averia, pageW - 32)
    const boxH = lines.length * 5 + 8
    doc.setFillColor(...GRAY_LIGHT)
    doc.roundedRect(14, y, pageW - 28, boxH, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_DARK)
    doc.text(lines, 20, y + 6)
    y += boxH + 8
  }

  // ── REPUESTOS Y SERVICIOS ───────────────────────────────────────────────────
  const items = diagnostic.diagnostic_items ?? []
  if (items.length > 0) {
    y = sectionHeader(doc, y, 'REPUESTOS Y SERVICIOS')
    autoTable(doc, {
      startY: y,
      head: [['Descripción', 'Cantidad']],
      body: items.map(i => [i.parts_catalog?.name ?? i.custom_name ?? '—', `${i.quantity} ud`]),
      theme: 'grid',
      headStyles: { fillColor: MP_BLUE, textColor: WHITE, fontSize: 8, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 9, textColor: GRAY_DARK },
      alternateRowStyles: { fillColor: GRAY_LIGHT },
      columnStyles: { 1: { halign: 'center', cellWidth: 28 } },
      margin: { left: 14, right: 14 },
    })
  }

  // ── FOTOGRAFÍAS (página separada) ───────────────────────────────────────────
  const photos = diagnostic.diagnostic_photos ?? []
  await addPhotosPage(doc, photos, pageW, pageH)

  // ── FOOTER en todas las páginas ─────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(14, pageH - 14, pageW - 14, pageH - 14)
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_MID)
    doc.text(companySettings?.email ?? 'infomotorpoolsat@gmail.com', 14, pageH - 8)
    doc.text(`Página ${i} / ${totalPages}`, pageW - 14, pageH - 8, { align: 'right' })
  }

  return doc
}

export async function generatePDF(
  diagnostic: DiagnosticWithItems,
  companySettings?: { email: string; name: string } | null
) {
  const doc = await buildDoc(diagnostic, companySettings)
  const filename = `Diagnostico_${diagnostic.cliente.replace(/\s+/g, '_')}_${new Date(diagnostic.created_at).toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

export async function generatePDFBase64(
  diagnostic: DiagnosticWithItems,
  companySettings?: { email: string; name: string } | null
): Promise<string> {
  const doc = await buildDoc(diagnostic, companySettings)
  return doc.output('datauristring').split(',')[1]
}
