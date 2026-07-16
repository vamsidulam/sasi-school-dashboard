import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to get heat map color based on percentage
function getHeatColor(percentage) {
  if (percentage == null) return [217, 208, 192]; // gray
  const p = Math.max(0, Math.min(100, percentage));

  if (p < 50) {
    // Red to Orange (0-50%)
    const r = 218;
    const g = Math.round(70 + (p / 50) * 114);
    const b = Math.round(72 - (p / 50) * 22);
    return [r, g, b];
  } else {
    // Orange to Green (50-100%)
    const r = Math.round(218 - ((p - 50) / 50) * (218 - 31));
    const g = 157;
    const b = Math.round(50 + ((p - 50) / 50) * 37);
    return [r, g, b];
  }
}

// Helper function to convert hex color to RGB array
function hexToRgb(hex) {
  if (!hex || hex === 'undefined') return [107, 114, 128]; // gray-500
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [107, 114, 128];
}

// Helper function to draw a horizontal bar chart
function drawBar(doc, x, y, width, percentage, label, value) {
  const barHeight = 6;
  const maxBarWidth = width - 65; // Reserve space for label and value
  const barWidth = (percentage / 100) * maxBarWidth;
  const color = getHeatColor(percentage);

  // Draw label (topic name)
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(label.substring(0, 30), x, y + 4, { maxWidth: 50 });

  // Draw bar background (light gray)
  doc.setFillColor(0, 0, 0);
  doc.rect(x + 55, y, maxBarWidth, barHeight, 'F');

  // Draw bar fill (colored)
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x + 55, y, barWidth, barHeight, 'F');

  // Draw border
  doc.setDrawColor(229, 231, 235);
  doc.rect(x + 55, y, maxBarWidth, barHeight, 'S');

  // Draw percentage value
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(value, x + 55 + maxBarWidth + 3, y + 4);
  doc.setFont(undefined, 'normal');
}

export function generateStudentPDF(studentCode, data, diagnostics) {
  console.log('generateStudentPDF called', { studentCode, data, diagnostics });

  try {
    const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('SASI EDUCATIONAL INSTITUTES', 105, 35, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.text('Student Performance Report', 105, 42, { align: 'center' });

  // Student Info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Student Code: ${studentCode}`, 28.35, 52);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 28.35, 58);

  // Summary Statistics
  if (data.totals) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Summary', 28.35, 68);

    const stats = [
      ['Total Score', String(data.totals.score || 0)],
      ['Accuracy', `${(data.totals.accuracy || 0).toFixed(1)}%`],
      ['Correct Answers', String(data.totals.right || 0)],
      ['Wrong Answers', String(data.totals.wrong || 0)],
      ['Unattempted', String(data.totals.left || 0)],
    ];

    autoTable(doc, {
      startY: 72,
      head: [['Metric', 'Value']],
      body: stats,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 10 },
    });

    // Add formulas note
    let formulaY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 3 : 110;
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('Formulas:',28.35,formulaY);
    formulaY += 3;
    doc.text('• Total Score = (Correct Answers × 4) - Wrong Answers', 22, formulaY);
    formulaY += 3;
    doc.text('• Accuracy = [Correct / (Correct + Wrong + Unattempted)] × 100', 22, formulaY);
  }

  // Subject-wise Performance Chart
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100;

  if (diagnostics?.table1?.subjects && diagnostics.table1.subjects.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Subject-wise Performance Analysis',28.35,currentY);
    currentY += 5;

    diagnostics.table1.subjects.forEach((subject, idx) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      // Subject name
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(subject.subjectName || 'Unknown',28.35,currentY);
      doc.setFont(undefined, 'normal');
      currentY += 3;

      // Individual % bar
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text('Individual:',28.35,currentY);

      const indivPercent = subject.individualAccuracy || 0;
      const indivBarWidth = (indivPercent / 100) * 120;

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(45, currentY - 3, 120, 5, 'F');

      // Black border
      doc.setDrawColor(0, 0, 0);
      doc.rect(45, currentY - 3, 120, 5, 'S');

      // Black progress bar
      doc.setFillColor(0, 0, 0);
      doc.rect(45, currentY - 3, indivBarWidth, 5, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(`${indivPercent.toFixed(1)}%`, 168, currentY);
      doc.setFont(undefined, 'normal');
      currentY += 6;

      // Grand % bar
      doc.setTextColor(0, 0, 0);
      doc.text('Grand:',28.35,currentY);

      const grandPercent = subject.grandAccuracy || 0;
      const grandBarWidth = (grandPercent / 100) * 120;

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(45, currentY - 3, 120, 5, 'F');

      // Black border
      doc.setDrawColor(0, 0, 0);
      doc.rect(45, currentY - 3, 120, 5, 'S');

      // Black progress bar
      doc.setFillColor(0, 0, 0);
      doc.rect(45, currentY - 3, grandBarWidth, 5, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(`${grandPercent.toFixed(1)}%`, 168, currentY);
      doc.setFont(undefined, 'normal');
      currentY += 6;

      // Execution Drop
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0); // amber-600
      doc.text(`Exec. Drop: ${(subject.executionDrop || 0).toFixed(1)}%`,28.35,currentY);
      currentY += 8;
    });

    currentY += 5;
  }

  // Strong Topics (from Level 1 Table 2) - Grid format

  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('STRONG TOPICS (TOP 10)',28.35,currentY);
  currentY += 5;

  const strongTopics = diagnostics?.table2?.topics
    ? diagnostics.table2.topics
        .filter(t => t.combinedIndex != null && t.combinedIndex >= 70)
        .sort((a, b) => (b.combinedIndex || 0) - (a.combinedIndex || 0))
        .slice(0, 10)
    : [];

  if (strongTopics.length > 0) {
    const topicsData = strongTopics.map(t => {
      return [
        (t.topicName || 'Unknown').substring(0, 35),
        t.subjectName || '-',
        t.combinedIndex != null ? t.combinedIndex.toFixed(0) + '%' : '-'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      body: topicsData,
      theme: 'grid',
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 45, fontSize: 7 },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      },
    });
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 40;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('No strong topics yet - keep working!',28.35,currentY + 3);
    currentY += 15;
  }

  // Weak Topics (from Level 1 Table 2) - Grid format
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('WEAK SUBTOPICS - PRIORITY FOCUS AREAS (TOP 10)',28.35,currentY);
  currentY += 5;

  const weakTopics = diagnostics?.table2?.topics
    ? diagnostics.table2.topics
        .filter(t => t.combinedIndex != null && t.combinedIndex < 50)
        .sort((a, b) => (a.combinedIndex || 0) - (b.combinedIndex || 0))
        .slice(0, 10)
    : [];

  if (weakTopics.length > 0) {
    const weakTopicsData = weakTopics.map(t => {
      return [
        (t.topicName || 'Unknown').substring(0, 35),
        t.subjectName || '-',
        t.combinedIndex != null ? t.combinedIndex.toFixed(0) + '%' : '-'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      body: weakTopicsData,
      theme: 'grid',
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 45, fontSize: 7 },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      },
    });
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 40;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Great! No weak topics found',28.35,currentY + 3);
    currentY += 15;
  }

  // Strong Subtopics (from Level 1 Table 3) - Grid format
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('STRONG SUBTOPICS (TOP 10)',28.35,currentY);
  currentY += 5;

  // Remove duplicates from subtopics
  const allStrongSubtopics = diagnostics?.table3?.subtopics || [];
  const uniqueStrongSubtopics = allStrongSubtopics.reduce((acc, current) => {
    const key = `${current.subjectName}-${current.topicName}-${current.subtopicName}`;
    if (!acc.some(item => `${item.subjectName}-${item.topicName}-${item.subtopicName}` === key)) {
      acc.push(current);
    }
    return acc;
  }, []);

  const strongSubtopics = uniqueStrongSubtopics
    .filter(st => st.combinedIndex != null && st.combinedIndex >= 70)
    .sort((a, b) => (b.combinedIndex || 0) - (a.combinedIndex || 0))
    .slice(0, 10);

  if (strongSubtopics.length > 0) {
    const strongSubtopicsData = strongSubtopics.map(st => {
      return [
        st.subtopicName || 'General',
        `${st.topicName || 'Unspecified'} • ${st.subjectName || '-'}`,
        st.combinedIndex != null ? st.combinedIndex.toFixed(0) + '%' : '-'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      body: strongSubtopicsData,
      theme: 'grid',
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 80, fontSize: 7 },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      },
    });
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 40;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Not enough subtopic data.',28.35,currentY + 3);
    currentY += 15;
  }

  // Weak Subtopics (from Level 1 Table 3) - Grid format
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('WEAK SUBTOPICS - PRIORITY FOCUS AREAS (TOP 10)',28.35,currentY);
  currentY += 5;

  // Remove duplicates from subtopics
  const allWeakSubtopics = diagnostics?.table3?.subtopics || [];
  const uniqueWeakSubtopics = allWeakSubtopics.reduce((acc, current) => {
    const key = `${current.subjectName}-${current.topicName}-${current.subtopicName}`;
    if (!acc.some(item => `${item.subjectName}-${item.topicName}-${item.subtopicName}` === key)) {
      acc.push(current);
    }
    return acc;
  }, []);

  const weakSubtopics = uniqueWeakSubtopics
    .filter(st => st.combinedIndex != null && st.combinedIndex < 50)
    .sort((a, b) => (a.combinedIndex || 0) - (b.combinedIndex || 0))
    .slice(0, 10);

  if (weakSubtopics.length > 0) {
    const weakSubtopicsData = weakSubtopics.map(st => {
      return [
        st.subtopicName || 'General',
        `${st.topicName || 'Unspecified'} • ${st.subjectName || '-'}`,
        st.combinedIndex != null ? st.combinedIndex.toFixed(0) + '%' : '-'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      body: weakSubtopicsData,
      theme: 'grid',
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 80, fontSize: 7 },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      },
    });
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 40;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Excellent! No weak subtopics',28.35,currentY + 3);
    currentY += 15;
  }

  // Test-wise Breakdown
  if (data.records && data.records.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Test-wise Breakdown',28.35,currentY);

    const testData = data.records
      .sort((a, b) => a.exam.localeCompare(b.exam))
      .map(r => {
        const accuracy = r.att > 0 ? ((r.right / r.att) * 100).toFixed(0) : '0';
        return [
          r.exam,
          r.subject || '-',
          String(r.score || 0),
          String(r.right || 0),
          String(r.wrong || 0),
          String(r.left || 0),
          `${accuracy}%`
        ];
      });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Test', 'Subject', 'Score', 'R', 'W', 'L', 'Accuracy']],
      body: testData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 8, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 15, fontStyle: 'bold' },
        3: { cellWidth: 12 },
        4: { cellWidth: 12 },
        5: { cellWidth: 12 },
        6: { cellWidth: 25 },
      },
    });
  }

  // ============ DIAGNOSTICS SECTION ============
  if (diagnostics) {
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : currentY + 15;

    // New page for diagnostics
    doc.addPage();
    currentY = 20;

    // ========== LEVEL 1 SECTION ==========
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('DIAGNOSTIC REPORT - LEVEL 1', 105, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('What the Student is Doing', 105, currentY, { align: 'center' });
    currentY += 10;

    // LEVEL 1 - TABLE 1: Subject Strength Metrics
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE 1: Subject Strength & Behaviour',28.35,currentY);
    currentY += 5;

    if (diagnostics.table1?.subjects && diagnostics.table1.subjects.length > 0) {
      const subjectData = diagnostics.table1.subjects.map(s => [
        s.subjectName || 'Unknown',
        s.individualAccuracy != null ? s.individualAccuracy.toFixed(1) + '%' : '-',
        s.grandAccuracy != null ? s.grandAccuracy.toFixed(1) + '%' : '-',
        s.executionDrop != null ? s.executionDrop.toFixed(1) + '%' : '-',
        s.wrongPct != null ? s.wrongPct.toFixed(1) + '%' : '-',
        s.leftPct != null ? s.leftPct.toFixed(1) + '%' : '-',
        s.intelligentLeavingPct != null ? s.intelligentLeavingPct.toFixed(1) + '%' : '-',
        s.ilInterpretation || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Subject', 'Indiv %', 'Grand %', 'Exec Drop', 'Wrong %', 'Left %', 'IL %', 'Behaviour']],
        body: subjectData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7 },
        margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
          7: { cellWidth: 27 },
        },
      });
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 5 : currentY + 40;

      // IL% Interpretation Legend
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('IL% (Intelligent Leaving) Interpretation:',28.35,currentY);
      currentY += 3;

      const ilLegend = [
        ['0–10%', 'Overattempting / gambling'],
        ['10–30%', 'Aggressive but manageable'],
        ['30–55%', 'Healthy NEET maturity'],
        ['55–75%', 'Conservative / fear'],
        ['75%+', 'Avoidance behaviour'],
      ];

      autoTable(doc, {
        startY: currentY,
        body: ilLegend,
        theme: 'plain',
        margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold', textColor: [31, 41, 55] },
          1: { cellWidth: 120, textColor: [107, 114, 128] },
        },
      });
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 20;
    }

    // LEVEL 1 - TABLE 2: Topic-level Analysis (IASS/GASS/Combined Index)
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE 2: Topic-Level Analysis (IASS/GASS/Combined Index)',28.35,currentY);
    currentY += 5;

    if (diagnostics.table2?.topics && diagnostics.table2.topics.length > 0) {
      const topicData = diagnostics.table2.topics.map(t => {
        return [
          t.subjectName || '-',
          t.topicName || 'Unspecified',
          t.IASS != null ? t.IASS.toFixed(1) : '-',
          t.GASS != null ? t.GASS.toFixed(1) : '-',
          t.combinedIndex != null ? t.combinedIndex.toFixed(1) : '-',
          t.interpretation || '-'
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Subject', 'Topic', 'IASS', 'GASS', 'Combined', 'Interpretation']],
        body: topicData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8 },
        margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 45 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 20, fontStyle: 'bold' },
          5: { cellWidth: 24 },
        },
      });
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 40;
    }

    // LEVEL 1 - TABLE 3: Subtopic-level Analysis (Top 20) - Remove duplicates
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE 3: Subtopic-Level Analysis (Top 20)',28.35,currentY);
    currentY += 5;

    if (diagnostics.table3?.subtopics && diagnostics.table3.subtopics.length > 0) {
      // Remove duplicates
      const allSubtopics = diagnostics.table3.subtopics;
      const uniqueSubtopics = allSubtopics.reduce((acc, current) => {
        const key = `${current.subjectName}-${current.topicName}-${current.subtopicName}`;
        if (!acc.some(item => `${item.subjectName}-${item.topicName}-${item.subtopicName}` === key)) {
          acc.push(current);
        }
        return acc;
      }, []);

      const subtopicData = uniqueSubtopics.slice(0, 20).map(st => [
        st.subjectName || '-',
        st.topicName || 'Unspecified',
        st.subtopicName || 'General',
        st.IASS != null ? st.IASS.toFixed(1) : '-',
        st.GASS != null ? st.GASS.toFixed(1) : '-',
        st.combinedIndex != null ? st.combinedIndex.toFixed(1) : '-',
        st.interpretation || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Subject', 'Topic', 'Subtopic', 'IASS', 'GASS', 'Combined', 'Interpretation']],
        body: subtopicData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7 },
        margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 40, overflow: 'linebreak' },
          2: { cellWidth: 40, overflow: 'linebreak' },
          3: { cellWidth: 12 },
          4: { cellWidth: 12 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15, overflow: 'linebreak' },
        },
      });
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 60;
    }

    // ========== LEVEL 2 SECTION ==========
    doc.addPage();
    currentY = 20;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // purple-600
    doc.text('DIAGNOSTIC REPORT - LEVEL 2', 105, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('How the Student Processes Information', 105, currentY, { align: 'center' });
    currentY += 10;

    // LEVEL 2 - TABLE 1: Subject × Question Type (CMSI) - DETAILED
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE 1: Cognitive Processing (CMSI) - Question Type Breakdown',28.35,currentY);
    currentY += 5;

    if (diagnostics.table4_detailed?.subjects && diagnostics.table4_detailed.subjects.length > 0) {
      diagnostics.table4_detailed.subjects.forEach((subject) => {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        // Subject header with CMSI score and interpretation
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        const cmsiText = `${subject.subjectName} (CMSI: ${subject.CMSI != null ? subject.CMSI.toFixed(1) : '-'})`;
        const cmsiInterpretation = subject.interpretation ? ` - ${subject.interpretation}` : '';
        doc.text(cmsiText + cmsiInterpretation,28.35,currentY);
        doc.setFont(undefined, 'normal');
        currentY += 5;

        // Question types table
        if (subject.questionTypes && subject.questionTypes.length > 0) {
          const qtData = subject.questionTypes.map(qt => [
            qt.type.charAt(0).toUpperCase() + qt.type.slice(1),
            qt.individual != null ? qt.individual.toFixed(1) + '%' : '-',
            qt.grand != null ? qt.grand.toFixed(1) + '%' : '-',
            qt.blended != null ? qt.blended.toFixed(1) + '%' : '-',
            (qt.interpretation || '').substring(0, 30)
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Type', 'Individual', 'Grand', 'Blended', 'Interpretation']],
            body: qtData,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7 },
            margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
            styles: { fontSize: 7 },
            columnStyles: {
              0: { cellWidth: 30, fontStyle: 'bold' },
              1: { cellWidth: 25, halign: 'center' },
              2: { cellWidth: 25, halign: 'center' },
              3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
              4: { cellWidth: 45 },
            },
          });
          currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : currentY + 30;
        }
      });

      currentY += 5;
    } else if (diagnostics.table4?.subjects && diagnostics.table4.subjects.length > 0) {
      // Fallback to old format if detailed data not available
      diagnostics.table4.subjects.forEach((s) => {
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text(`${s.subjectName} - CMSI: ${s.CMSI != null ? s.CMSI.toFixed(1) : '-'}`,28.35,currentY);
        doc.setFont(undefined, 'normal');
        currentY += 8;
      });
    }

    // LEVEL 2 - TABLE 2: Subject × Difficulty (CDAI) - DETAILED
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE 2: Difficulty Adaptability (CDAI) - Difficulty Level Breakdown',28.35,currentY);
    currentY += 5;

    if (diagnostics.table5_detailed?.subjects && diagnostics.table5_detailed.subjects.length > 0) {
      diagnostics.table5_detailed.subjects.forEach((subject) => {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        // Subject header with CDAI score and interpretation
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        const cdaiText = `${subject.subjectName} (CDAI: ${subject.CDAI != null ? subject.CDAI.toFixed(1) : '-'})`;
        const cdaiInterpretation = subject.interpretation ? ` - ${subject.interpretation}` : '';
        doc.text(cdaiText + cdaiInterpretation,28.35,currentY);
        doc.setFont(undefined, 'normal');
        currentY += 5;

        // Difficulty levels table
        if (subject.levels && subject.levels.length > 0) {
          const levelData = subject.levels.map(level => [
            level.level.charAt(0).toUpperCase() + level.level.slice(1),
            level.individual != null ? level.individual.toFixed(1) + '%' : '-',
            level.grand != null ? level.grand.toFixed(1) + '%' : '-',
            level.blended != null ? level.blended.toFixed(1) + '%' : '-',
            (level.interpretation || '').substring(0, 30)
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Level', 'Individual', 'Grand', 'Blended', 'Interpretation']],
            body: levelData,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7 },
            margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
            styles: { fontSize: 7 },
            columnStyles: {
              0: { cellWidth: 30, fontStyle: 'bold' },
              1: { cellWidth: 25, halign: 'center' },
              2: { cellWidth: 25, halign: 'center' },
              3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
              4: { cellWidth: 45 },
            },
          });
          currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : currentY + 30;
        }
      });

      currentY += 5;
    } else if (diagnostics.table5?.subjects && diagnostics.table5.subjects.length > 0) {
      // Fallback to old format if detailed data not available
      diagnostics.table5.subjects.forEach((s) => {
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text(`${s.subjectName} - CDAI: ${s.CDAI != null ? s.CDAI.toFixed(1) : '-'}`,28.35,currentY);
        doc.setFont(undefined, 'normal');
        currentY += 8;
      });
    }

    // ========== LEVEL 3 SECTION ==========
    // Only add page if not enough space
    if (currentY > 240) {
      doc.addPage();
      currentY = 28.35;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // orange-600
    doc.text('DIAGNOSTIC REPORT - LEVEL 3', 105, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('HOW and WHERE to Improve - Exam Impact Priority Matrix', 105, currentY, { align: 'center' });
    currentY += 10;

    // LEVEL 3 - Topics Table (Top 10)
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE: Exam Impact Priority Matrix (Top 10 Topics)',28.35,currentY);
    currentY += 5;

    if (diagnostics.table6?.topics && diagnostics.table6.topics.length > 0) {
      const topicData = diagnostics.table6.topics.slice(0, 10).map(t => {
        return [
          t.subjectName || 'Unknown',
          (t.topicName || 'Unspecified').substring(0, 20),
          t.CMSI != null ? t.CMSI.toFixed(1) : '-',
          t.CDAI != null ? t.CDAI.toFixed(1) : '-',
          t.EW != null ? t.EW.toFixed(1) + '%' : '-',
          t.SIPI != null ? t.SIPI.toFixed(1) : '-',
          t.priority || '-',
          (t.meaning || '-').substring(0, 35),
          (t.suggestedAction || '-').substring(0, 35)
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Subject', 'Topic', 'CMSI', 'CDAI', 'EW', 'SIPI', 'Priority', 'Meaning', 'Suggested Action']],
        body: topicData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7 },
        margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 12 },
          3: { cellWidth: 12 },
          4: { cellWidth: 12 },
          5: { cellWidth: 12, fontStyle: 'bold' },
          6: { cellWidth: 18 },
          7: { cellWidth: 30 },
          8: { cellWidth: 30 },
        },
      });
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 60;
    }

    // LEVEL 3 - Subtopics Table (Top 20)
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TABLE: Priority Subtopics (Top 20)',28.35,currentY);
    currentY += 5;

    if (diagnostics.table6?.subtopics && diagnostics.table6.subtopics.length > 0) {
      const subtopicData = diagnostics.table6.subtopics.slice(0, 20).map(st => {
        return [
          st.subjectName || '-',
          st.topicName || 'Unspecified',
          st.subtopicName || 'General',
          st.CMSI != null ? st.CMSI.toFixed(1) : '-',
          st.CDAI != null ? st.CDAI.toFixed(1) : '-',
          st.EW != null ? st.EW.toFixed(1) + '%' : '-',
          st.SIPI != null ? st.SIPI.toFixed(1) : '-',
          st.priority || '-',
          st.meaning || '-',
          st.suggestedAction || '-'
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Subject', 'Topic', 'Subtopic', 'CMSI', 'CDAI', 'EW', 'SIPI', 'Priority', 'Meaning', 'Action']],
        body: subtopicData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 6 },
        margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
        styles: { fontSize: 6, textColor: [0, 0, 0], cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 10 },
          4: { cellWidth: 10 },
          5: { cellWidth: 10 },
          6: { cellWidth: 10, fontStyle: 'bold' },
          7: { cellWidth: 15 },
          8: { cellWidth: 28 },
          9: { cellWidth: 28 },
        },
      });
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 80;
    }

    // SIPI Legend - ensure it stays on one page
    const legendHeight = 50; // Approximate height needed for formula + table
    if (currentY > 240 - legendHeight) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('SIPI Formula: (Weakness Factor × Complexity Risk Factor × Exam Weightage) / 10000',28.35,currentY);
    currentY += 5;

    const legendData = [
      ['250+', 'Critical', 'Very frequently-high yield weighted'],
      ['150-249', 'High', 'Significant competitive weakness'],
      ['100-149', 'Moderate', 'Improvement possible but not urgent'],
      ['50-99', 'Low', 'Weakness exists but limited impact'],
      ['0-49', 'Stable', 'Safe area with minimal risk'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['SIPI Range', 'Priority', 'Meaning']],
      body: legendData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8 },
      margin: { left: 28.35, right: 28.35, top: 28.35, bottom: 28.35 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 90 },
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // gray-400
    doc.text(
      `Page ${i} of ${pageCount} | Generated by SASI Dashboard`,
      105,
      287,
      { align: 'center' }
    );
  }

    // Save the PDF
    doc.save(`Student_${studentCode}_Report.pdf`);
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error.message}`);
  }
}
