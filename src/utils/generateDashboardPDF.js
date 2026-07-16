import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 8
const MARGIN_TOP = 8
const MARGIN_BOTTOM = 8
const CONTENT_W = PAGE_W - MARGIN_X * 2
const CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
const HEADER_H = 14

export async function generateDashboardPDF(element, { filename = 'school-dashboard.pdf', title = '', subtitle = '' } = {}) {
  if (!element) throw new Error('No element provided')

  try {
    const pdf = new jsPDF('p', 'mm', 'a4')

    const pages = Array.from(element.querySelectorAll('[data-pdf-page]'))
      .filter((el) => el.offsetHeight > 0)
      .sort((a, b) => Number(a.dataset.pdfPage) - Number(b.dataset.pdfPage))

    if (!pages.length) {
      const canvas = await captureElement(element)
      drawHeader(pdf, title, subtitle)
      placeImage(pdf, canvas, MARGIN_TOP + HEADER_H)
      addPageNumbers(pdf)
      pdf.save(filename)
      return
    }

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage()

      const pageEl = pages[i]
      const canvas = await captureElement(pageEl)

      const availH = i === 0 ? CONTENT_H - HEADER_H : CONTENT_H
      const availW = CONTENT_W

      let destW = availW
      let destH = (canvas.height / canvas.width) * availW

      if (destH > availH) {
        destH = availH
        destW = (canvas.width / canvas.height) * availH
      }

      if (i === 0) {
        drawHeader(pdf, title, subtitle)
      }

      const startY = i === 0 ? MARGIN_TOP + HEADER_H : MARGIN_TOP
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', MARGIN_X, startY, destW, destH)
    }

    addPageNumbers(pdf)
    pdf.save(filename)
  } finally {
    // nothing to clean up
  }
}

async function captureElement(el) {
  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })
  // Force grayscale at pixel level
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114)
    d[i] = gray
    d[i + 1] = gray
    d[i + 2] = gray
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function placeImage(pdf, canvas, startY) {
  const availH = PAGE_H - MARGIN_BOTTOM - startY
  const imgAspect = canvas.width / canvas.height
  let destW, destH

  if (imgAspect > CONTENT_W / availH) {
    destW = CONTENT_W
    destH = CONTENT_W / imgAspect
  } else {
    destH = availH
    destW = availH * imgAspect
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  pdf.addImage(imgData, 'JPEG', MARGIN_X, startY, destW, destH)
}

function drawHeader(pdf, title, subtitle) {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.setTextColor(0, 0, 0)
  pdf.text(title || 'School Dashboard', MARGIN_X, MARGIN_TOP + 5)

  if (subtitle) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.text(subtitle, MARGIN_X, MARGIN_TOP + 10)
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(100, 100, 100)
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  pdf.text(`Generated: ${date}`, PAGE_W - MARGIN_X, MARGIN_TOP + 5, { align: 'right' })

  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.3)
  pdf.line(MARGIN_X, MARGIN_TOP + HEADER_H - 2, PAGE_W - MARGIN_X, MARGIN_TOP + HEADER_H - 2)
}

function addPageNumbers(pdf) {
  const total = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(120, 120, 120)
    pdf.text(`Page ${i} of ${total}`, PAGE_W / 2, PAGE_H - 5, { align: 'center' })
  }
}
