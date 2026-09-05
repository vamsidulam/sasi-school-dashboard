import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function getHeatColor(percentage) {
  if (percentage == null) return [217, 208, 192]
  const p = Math.max(0, Math.min(100, percentage))
  if (p < 50) {
    return [218, Math.round(70 + (p / 50) * 114), Math.round(72 - (p / 50) * 22)]
  }
  return [Math.round(218 - ((p - 50) / 50) * (218 - 31)), 157, Math.round(50 + ((p - 50) / 50) * 37)]
}

export function generateSchoolStudentPDF(studentCode, data) {
  const doc = new jsPDF()
  const margin = 20

  // Header
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('SASI EDUCATIONAL INSTITUTES', 105, 25, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('Student Performance Report', 105, 32, { align: 'center' })

  // Student info
  doc.setFontSize(10)
  doc.text(`Student: ${data.studentName || studentCode}`, margin, 44)
  doc.text(`Roll No: ${data.rollNo || studentCode}`, margin, 50)
  if (data.branchName) doc.text(`Branch: ${data.branchName}`, margin, 56)
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 130, 44)

  // Summary
  const summary = data.summary || {}
  let y = 68

  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('Performance Summary', margin, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Exams', String(summary.totalExams || 0)],
      ['Average Percentage', (summary.avgPercentage || 0) + '%'],
      ['Total Marks', `${summary.totalMarks || 0}${summary.totalMax ? ' / ' + summary.totalMax : ''}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  })

  y = doc.lastAutoTable.finalY + 12

  // Subject-wise summary
  const subjectSummary = data.subjectSummary || []
  if (subjectSummary.length > 0) {
    if (y > 230) { doc.addPage(); y = 25 }

    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Subject-wise Performance', margin, y)
    y += 5

    autoTable(doc, {
      startY: y,
      head: [['Subject', 'Avg Marks', 'Avg %', 'Highest', 'Lowest', 'Exams']],
      body: subjectSummary.map((s) => [
        s.subjectName,
        String(s.avgMarks ?? '—'),
        s.avgPercentage != null ? s.avgPercentage + '%' : '—',
        String(s.highest ?? '—'),
        String(s.lowest ?? '—'),
        String(s.examsAppeared || 0),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      didParseCell(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const val = parseFloat(hookData.cell.text[0])
          if (!isNaN(val)) {
            const [r, g, b] = getHeatColor(val)
            hookData.cell.styles.fillColor = [r, g, b]
            hookData.cell.styles.textColor = val < 40 ? [255, 255, 255] : [0, 0, 0]
          }
        }
      },
    })

    y = doc.lastAutoTable.finalY + 12
  }

  // Exam-wise breakdown
  const exams = data.exams || []
  if (exams.length > 0) {
    if (y > 200) { doc.addPage(); y = 25 }

    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Exam-wise Breakdown', margin, y)
    y += 5

    const subjectNames = [...new Set(exams.flatMap((e) => e.subjects.map((s) => s.subjectName)))]
    const head = ['Exam', ...subjectNames, 'Total', '%']
    const body = exams.map((e) => {
      const row = [e.examName]
      subjectNames.forEach((name) => {
        const s = e.subjects.find((sub) => sub.subjectName === name)
        row.push(s ? String(s.marks) : '—')
      })
      row.push(e.maxMarks ? `${e.totalMarks}/${e.maxMarks}` : String(e.totalMarks))
      row.push(e.percentage + '%')
      return row
    })

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      didParseCell(hookData) {
        if (hookData.section === 'body' && hookData.column.index === head.length - 1) {
          const val = parseFloat(hookData.cell.text[0])
          if (!isNaN(val)) {
            const [r, g, b] = getHeatColor(val)
            hookData.cell.styles.fillColor = [r, g, b]
            hookData.cell.styles.textColor = val < 40 ? [255, 255, 255] : [0, 0, 0]
          }
        }
      },
    })
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
    doc.text('SASI Educational Institutes', margin, 290)
  }

  doc.save(`Student_Report_${studentCode}.pdf`)
}
