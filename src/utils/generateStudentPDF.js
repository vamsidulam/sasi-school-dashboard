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

// Helper function to draw a horizontal bar chart
function drawBar(doc, x, y, width, percentage, label, value) {
  const barHeight = 6;
  const maxBarWidth = width - 65; // Reserve space for label and value
  const barWidth = (percentage / 100) * maxBarWidth;
  const color = getHeatColor(percentage);

  // Draw label (topic name)
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(label.substring(0, 30), x, y + 4, { maxWidth: 50 });

  // Draw bar background (light gray)
  doc.setFillColor(243, 244, 246);
  doc.rect(x + 55, y, maxBarWidth, barHeight, 'F');

  // Draw bar fill (colored)
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x + 55, y, barWidth, barHeight, 'F');

  // Draw border
  doc.setDrawColor(229, 231, 235);
  doc.rect(x + 55, y, maxBarWidth, barHeight, 'S');

  // Draw percentage value
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);
  doc.setFont(undefined, 'bold');
  doc.text(value, x + 55 + maxBarWidth + 3, y + 4);
  doc.setFont(undefined, 'normal');
}

export function generateStudentPDF(studentCode, data) {
  console.log('generateStudentPDF called', { studentCode, data });

  try {
    const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(218, 52, 56); // brand-600
  doc.text('SASI EDUCATIONAL INSTITUTES', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('Student Performance Report', 105, 28, { align: 'center' });

  // Student Info
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(`Student Code: ${studentCode}`, 20, 40);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 47);

  // Summary Statistics
  if (data.totals) {
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81); // gray-700
    doc.text('Performance Summary', 20, 57);

    const stats = [
      ['Total Score', String(data.totals.score || 0)],
      ['Accuracy', `${(data.totals.accuracy || 0).toFixed(1)}%`],
      ['Correct Answers', String(data.totals.right || 0)],
      ['Wrong Answers', String(data.totals.wrong || 0)],
      ['Unattempted', String(data.totals.left || 0)],
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: stats,
      theme: 'grid',
      headStyles: { fillColor: [218, 52, 56], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10 },
    });
  }

  // Strong Topics
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100;

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(218, 52, 56);
  doc.text('Strong Topics', 20, currentY);
  currentY += 5;

  if (data.strongTopics && data.strongTopics.length > 0) {
    // Draw bar charts for strong topics
    data.strongTopics.slice(0, 10).forEach((topic, idx) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      drawBar(
        doc,
        20,
        currentY,
        170,
        topic.acc,
        topic.t,
        `${topic.acc.toFixed(0)}%`
      );
      currentY += 10;
    });
    currentY += 5;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Not enough topic-tagged data.', 20, currentY + 3);
    currentY += 15;
  }

  // Weak Topics
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(218, 52, 56);
  doc.text('Focus Areas (Weakest Topics)', 20, currentY);
  currentY += 5;

  if (data.weakTopics && data.weakTopics.length > 0) {
    // Draw bar charts for weak topics
    data.weakTopics.slice(0, 10).forEach((topic, idx) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      drawBar(
        doc,
        20,
        currentY,
        170,
        topic.acc,
        topic.t,
        `${topic.acc.toFixed(0)}%`
      );
      currentY += 10;
    });
    currentY += 10;
  }

  // Test-wise Breakdown
  if (data.records && data.records.length > 0) {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(218, 52, 56);
    doc.text('Test-wise Breakdown', 20, currentY);

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
      headStyles: { fillColor: [218, 52, 56], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, fontStyle: 'bold', textColor: [218, 52, 56] },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
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
