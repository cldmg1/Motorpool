import type { QuoteWithItems } from '@/lib/types'

const LOGO_URL = 'https://i.postimg.cc/bv1cQ0GM/Imagotipo-Vertical-con-Eslogan-PNG-COLOR.png'
const MP_BLUE: [number, number, number] = [10, 58, 84]
const MP_ORANGE: [number, number, number] = [248, 90, 43]
const GRAY_DARK: [number, number, number] = [40, 40, 40]
const GRAY_MID: [number, number, number] = [100, 100, 100]
const GRAY_LIGHT: [number, number, number] = [245, 245, 245]
const WHITE: [number, number, number] = [255, 255, 255]

async function fetchLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL)
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

function formatEur(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

async function buildQuoteDoc(
  quote: QuoteWithItems,
  companySettings?: { email: string } | null
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
  doc.text('PRESUPUESTO', pageW - 14, 14, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MID)
  const dateStr = new Date(quote.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  doc.text(`Ref: #${quote.id.slice(0, 8).toUpperCase()}`, pageW - 14, 22, { align: 'right' })
  doc.text(dateStr, pageW - 14, 28, { align: 'right' })

  doc.setDrawColor(...MP_BLUE)
  doc.setLineWidth(0.8)
  doc.line(0, 43, pageW, 43)

  let y = 52

  // ── Section header helper ────────────────────────────────────────────────────
  function sectionHeader(label: string) {
    doc.setDrawColor(...MP_BLUE)
    doc.setLineWidth(0.5)
    doc.line(14, y, pageW - 14, y)
    doc.setFillColor(...MP_ORANGE)
    doc.rect(14, y + 2, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MP_BLUE)
    doc.text(label, 20, y + 5)
    y += 10
  }

  // ── DATOS DEL CLIENTE ────────────────────────────────────────────────────────
  sectionHeader('DATOS DEL CLIENTE')

  const validezStr = quote.fecha_validez
    ? new Date(quote.fecha_validez).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : (() => {
        const d = new Date(quote.created_at)
        d.setDate(d.getDate() + 30)
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
      })()

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Cliente', quote.cliente],
      ['Modelo / Equipo', quote.modelo],
      ['Fecha de emisión', dateStr],
      ['Válido hasta', validezStr],
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

  // ── CONCEPTOS ────────────────────────────────────────────────────────────────
  sectionHeader('CONCEPTOS')

  const items = quote.quote_items ?? []
  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cantidad', 'P. Unit.', 'Subtotal']],
    body: items.map(i => [
      i.description,
      i.quantity % 1 === 0 ? String(i.quantity) : i.quantity.toFixed(2),
      formatEur(i.unit_price),
      formatEur(i.quantity * i.unit_price),
    ]),
    theme: 'grid',
    headStyles: { fillColor: MP_BLUE, textColor: WHITE, fontSize: 8, fontStyle: 'bold', halign: 'left' },
    bodyStyles: { fontSize: 9, textColor: GRAY_DARK },
    alternateRowStyles: { fillColor: GRAY_LIGHT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 6

  // ── TOTALES ──────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const ivaAmount = quote.iva_included ? subtotal * (quote.iva_rate / 100) : 0
  const total = subtotal + ivaAmount

  const totalsX = pageW - 14
  const labelX = pageW - 70

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(labelX, y, totalsX, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY_MID)
  doc.text('Subtotal', labelX, y)
  doc.setTextColor(...GRAY_DARK)
  doc.text(formatEur(subtotal), totalsX, y, { align: 'right' })
  y += 6

  if (quote.iva_included) {
    doc.setTextColor(...GRAY_MID)
    doc.text(`IVA (${quote.iva_rate}%)`, labelX, y)
    doc.setTextColor(...GRAY_DARK)
    doc.text(formatEur(ivaAmount), totalsX, y, { align: 'right' })
    y += 6
  }

  doc.setDrawColor(...MP_BLUE)
  doc.setLineWidth(0.5)
  doc.line(labelX, y, totalsX, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...MP_BLUE)
  doc.text('TOTAL', labelX, y)
  doc.text(formatEur(total), totalsX, y, { align: 'right' })
  y += 10

  // ── NOTAS ────────────────────────────────────────────────────────────────────
  if (quote.notas) {
    y += 4
    doc.setDrawColor(...MP_BLUE)
    doc.setLineWidth(0.5)
    doc.line(14, y, pageW - 14, y)
    doc.setFillColor(...MP_ORANGE)
    doc.rect(14, y + 2, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MP_BLUE)
    doc.text('NOTAS', 20, y + 5)
    y += 10
    const notasLines = doc.splitTextToSize(quote.notas, pageW - 32)
    const notasBoxH = notasLines.length * 5 + 8
    doc.setFillColor(...GRAY_LIGHT)
    doc.roundedRect(14, y, pageW - 28, notasBoxH, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_DARK)
    doc.text(notasLines, 20, y + 6)
  }

  // ── FIRMA / APROBADO POR ────────────────────────────────────────────────────
  if (quote.firma_cliente) {
    y += 10
    const sigX = pageW - 14 - 70
    doc.setDrawColor(...GRAY_MID)
    doc.setLineWidth(0.3)
    doc.line(sigX, y, pageW - 14, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_MID)
    doc.text('Aprobado por:', sigX, y)
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_DARK)
    doc.text(quote.firma_cliente, sigX, y)
  }

  // ── FOOTER en todas las páginas ──────────────────────────────────────────────
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

export async function generateQuotePDF(
  quote: QuoteWithItems,
  companySettings?: { email: string } | null
) {
  const doc = await buildQuoteDoc(quote, companySettings)
  const filename = `Presupuesto_${quote.cliente.replace(/\s+/g, '_')}_${new Date(quote.created_at).toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

export async function generateQuotePDFBase64(
  quote: QuoteWithItems,
  companySettings?: { email: string } | null
): Promise<string> {
  const doc = await buildQuoteDoc(quote, companySettings)
  return doc.output('datauristring').split(',')[1]
}
