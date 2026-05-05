import type { DiagnosticWithItems } from '@/lib/types'

export async function generatePDF(diagnostic: DiagnosticWithItems) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF()
  const mpBlue: [number, number, number] = [10, 58, 84]
  const mpOrange: [number, number, number] = [248, 90, 43]
  const pageW = doc.internal.pageSize.getWidth()

  // Header bar
  doc.setFillColor(...mpBlue)
  doc.rect(0, 0, pageW, 32, 'F')

  // Logo text (in case image fails)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('MOTORPOOL', 14, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Servicio de Asistencia Técnica', 14, 22)

  // Date
  const dateStr = new Date(diagnostic.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  doc.setFontSize(8)
  doc.text(dateStr, pageW - 14, 20, { align: 'right' })

  // Title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORME DE DIAGNÓSTICO', 14, 45)

  // Equipment section
  doc.setFillColor(...mpOrange)
  doc.rect(14, 52, 3, 16, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...mpOrange)
  doc.text('DATOS DEL EQUIPO', 20, 58)

  const fields = [
    ['Cliente', diagnostic.cliente],
    ['Modelo', diagnostic.modelo],
    ['Filtro', diagnostic.filtro ?? '—'],
    ['Fuente de Alimentación', diagnostic.fuente_alimentacion ?? '—'],
    ['Horas Motor', diagnostic.horas_motor ? `${diagnostic.horas_motor} h` : '—'],
    ['Horas Fuente', diagnostic.horas_fuente ? `${diagnostic.horas_fuente} h` : '—'],
  ]

  autoTable(doc, {
    startY: 62,
    head: [],
    body: fields,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 55 },
      1: { textColor: [20, 20, 20] },
    },
  })

  let y = (doc as any).lastAutoTable.finalY + 8

  // Fault description
  if (diagnostic.descripcion_averia) {
    doc.setFillColor(...mpOrange)
    doc.rect(14, y, 3, 16, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...mpOrange)
    doc.setFontSize(9)
    doc.text('AVERÍA DETECTADA', 20, y + 6)

    y += 10
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(diagnostic.descripcion_averia, pageW - 28)
    doc.text(lines, 20, y + 4)
    y += lines.length * 5 + 10
  }

  // Parts table
  const items = diagnostic.diagnostic_items ?? []
  if (items.length > 0) {
    doc.setFillColor(...mpOrange)
    doc.rect(14, y, 3, 16, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...mpOrange)
    doc.setFontSize(9)
    doc.text('REPUESTOS Y SERVICIOS', 20, y + 6)
    y += 10

    autoTable(doc, {
      startY: y,
      head: [['Descripción', 'Cantidad']],
      body: items.map(i => [
        i.parts_catalog?.name ?? i.custom_name ?? '—',
        `${i.quantity} ud`,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: mpBlue,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center', cellWidth: 30 } },
    })
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('infomotorpoolsat@gmail.com', 14, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Página ${i} / ${totalPages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  const filename = `Diagnostico_${diagnostic.cliente.replace(/\s+/g, '_')}_${new Date(diagnostic.created_at).toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
