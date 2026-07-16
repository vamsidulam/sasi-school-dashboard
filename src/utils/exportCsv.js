export function downloadCsv(rows, columns, filename = 'export.csv') {
  if (!rows.length) return

  const header = columns.map((c) => c.label).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        let val = typeof c.key === 'function' ? c.key(row) : (row[c.key] ?? '')
        val = String(val).replace(/"/g, '""')
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val}"`
        }
        return val
      })
      .join(',')
  )

  const csv = [header, ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
