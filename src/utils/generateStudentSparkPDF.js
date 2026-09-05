import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { buildSparkReport, groupSipiBySubject, formatSipiTopicLine, formatSipiSubjectHeader } from './sparkReportModel.js'

const tableTheme = {
  theme: 'grid',
  headStyles: {
    fontSize: 7,
    fontStyle: 'bold',
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    lineWidth: 0.2,
    lineColor: [0, 0, 0],
    cellPadding: 1.2,
  },
  bodyStyles: {
    fontSize: 7,
    textColor: [0, 0, 0],
    lineWidth: 0.2,
    lineColor: [0, 0, 0],
    cellPadding: 1.2,
  },
}

export function generateStudentSparkPDF(studentCode, data, diagnostics, aiInsights = null, streamName = '') {
  try {
    const report = buildSparkReport({
      studentCode,
      data,
      diagnostics,
      aiInsights,
      streamName,
    })

    const doc = new jsPDF({ format: 'a4', unit: 'mm' })
    const pageW = 210
    const pageH = 297
    const marginL = 14
    const marginR = 14
    const marginT = 14
    const marginB = 16
    const contentW = pageW - marginL - marginR
    let y = marginT

    const ensureSpace = (needed) => {
      if (y + needed > pageH - marginB) {
        doc.addPage()
        y = marginT
      }
    }

    const sectionTitle = (title) => {
      ensureSpace(12)
      doc.setFontSize(9)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(title.toUpperCase(), marginL, y)
      y += 2
      doc.setLineWidth(0.3)
      doc.line(marginL, y, marginL + contentW, y)
      y += 4
    }

    // Header
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('STUDENT PERFORMANCE INTELLIGENCE', pageW / 2, y, { align: 'center' })
    y += 5
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text('SASI SPARK Analytics Report', pageW / 2, y, { align: 'center' })
    y += 8

    // 1. Identity — one block, no divider between name row and scores
    sectionTitle('Student Identity Card')
    ensureSpace(22)
    const idRows = [
      [
        ['Name', report.studentName],
        ['Program', report.streamName],
        ['Branch', report.branchName],
        ['Roll No', report.rollNo],
      ],
      [
        ['Overall Academic Score', String(report.avgInd)],
        ['Overall Competitive Score', String(report.avgGrand)],
        ['Overall Grade', report.grade],
        ['Learner Type', report.typeOfLearner],
      ],
    ]
    idRows.forEach((cols, rowIdx) => {
      cols.forEach(([label, value], i) => {
        const x = marginL + i * (contentW / 4)
        const maxW = contentW / 4 - 2
        doc.setFontSize(6)
        doc.setFont(undefined, 'normal')
        doc.text(label, x, y, { maxWidth: maxW })
        doc.setFontSize(rowIdx === 1 && i !== 3 ? 11 : 8)
        doc.setFont(undefined, 'bold')
        doc.text(String(value), x, y + (rowIdx === 1 ? 5 : 4), { maxWidth: maxW })
      })
      y += rowIdx === 0 ? 9 : 11
    })

    // 2. Subject dashboard
    sectionTitle('Subject Performance Dashboard')
    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      ...tableTheme,
      head: [['Subject', 'Ind%', 'Grand%', 'Drop%', 'Wrong%', 'Left%', 'IDI%', 'SPI', 'Status']],
      body: report.subjectRows.map((r) => [
        r.subjectName, r.ind, r.grand, r.drop, r.wrong, r.left, r.idi, r.spi, r.status,
      ]),
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center', fontStyle: 'bold' },
        8: { halign: 'center', cellWidth: 28 },
      },
    })
    y = doc.lastAutoTable.finalY + 8

    // 3. Indicators
    sectionTitle('Student Performance Indicators')
    const { indicators } = report
    const pairs = [
      ['Strongest Subject', indicators.strongestSubject, 'Weakest Subject', indicators.weakestSubject],
      ['Competitive Readiness', indicators.competitiveReadiness, 'Execution Consistency', indicators.executionConsistency],
      ['Confidence', indicators.confidenceLevel, 'Risk Behaviour', indicators.riskBehaviour],
      ['Decision Making', indicators.decisionMaking, 'Learning Consistency', indicators.learningConsistency],
    ]
    doc.setFontSize(8)
    pairs.forEach(([l1, v1, l2, v2]) => {
      ensureSpace(6)
      doc.setFont(undefined, 'normal')
      doc.text(l1, marginL, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(v1), marginL + 48, y)
      doc.setFont(undefined, 'normal')
      doc.text(l2, marginL + 95, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(v2), marginL + 143, y)
      y += 5
    })
    ensureSpace(8)
    doc.setFont(undefined, 'bold')
    doc.text('Learner Archetype', marginL, y)
    doc.text(String(indicators.typeOfLearner), marginL + 48, y)
    y += 8

    // 4. Cognitive
    if (report.cognitiveRows.length) {
      sectionTitle('COMBINED MASTERY STRENGTH INDEX (CMSI)')
      autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        ...tableTheme,
        head: [['Subject', ...report.cognitiveHeaders, 'CMSI']],
        body: report.cognitiveRows.map((r) => [r.subjectName, ...r.cells, r.cmsi]),
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 28 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center', fontStyle: 'bold' },
        },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // 5. Difficulty
    if (report.difficultyRows.length) {
      sectionTitle('COMBINED DIFFICULTY ADAPTABILITY INDEX (CDAI)')
      autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        ...tableTheme,
        head: [['Subject', ...report.difficultyHeaders, 'CDAI']],
        body: report.difficultyRows.map((r) => [r.subjectName, ...r.cells, r.cdai]),
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 36 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center', fontStyle: 'bold' },
        },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // AI mentor
    if (report.aiInsights) {
      sectionTitle("AI Mentor's Observation")
      doc.setFontSize(8)
      doc.setFont(undefined, 'normal')
      const lines = doc.splitTextToSize(report.aiInsights, contentW)
      lines.forEach((line) => {
        ensureSpace(5)
        doc.text(line, marginL, y)
        y += 4
      })
      y += 4
    }

    // Strategic Improvement Matrix — 2 subjects per row
    if (report.sipiTopics.length) {
      sectionTitle('Strategic Improvement Matrix (top 5 topics per subject)')
      const columns = groupSipiBySubject(report.sipiTopics)
      const perRow = 2
      const gap = 6
      const colW = (contentW - gap) / perRow
      const headerH = 5.5
      const lineH = 4.2

      const fitLine = (text, maxW) => {
        if (doc.getTextWidth(text) <= maxW) return text
        let t = text
        while (t.length > 4 && doc.getTextWidth(`${t}…`) > maxW) t = t.slice(0, -1)
        return `${t}…`
      }

      for (let i = 0; i < columns.length; i += perRow) {
        const row = columns.slice(i, i + perRow)
        const maxTopics = Math.max(...row.map((c) => c.topics.length), 0)
        const rowH = headerH + maxTopics * lineH
        ensureSpace(rowH + 3)
        row.forEach((col, ci) => {
          const x = marginL + ci * (colW + gap)
          doc.setFontSize(8)
          doc.setFont(undefined, 'bold')
          doc.text(formatSipiSubjectHeader(col.subjectName), x, y, { maxWidth: colW })
          doc.setFontSize(6.5)
          doc.setFont(undefined, 'normal')
          col.topics.forEach((t, ti) => {
            doc.text(fitLine(formatSipiTopicLine(t), colW), x, y + headerH + ti * lineH)
          })
        })
        y += rowH + 4
      }
    }

    // Legend
    ensureSpace(8)
    doc.setFontSize(7)
    doc.setFont(undefined, 'bold')
    doc.text('EW: Exam Weightage, SIPI: Strategic Improvement Priority Index', marginL, y)
    y += 6

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setFont(undefined, 'normal')
      doc.text(
        `Generated ${new Date().toLocaleDateString()}  ·  ${report.rollNo}`,
        marginL,
        pageH - 8,
      )
      doc.text(`Page ${i} of ${pageCount}`, pageW - marginR, pageH - 8, { align: 'right' })
    }

    doc.save(`SPARK_${studentCode}_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error generating SPARK PDF:', error)
    alert('Failed to generate PDF. Please try again.')
  }
}
