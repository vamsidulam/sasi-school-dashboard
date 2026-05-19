import * as XLSX from 'xlsx'

const readAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsText(file)
  })

const readAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (!lines.length) return { headers: [], rows: [] }
  const splitLine = (line) => line.split(',').map((c) => c.trim())
  const headers = splitLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line)
    return headers.reduce((acc, header, i) => {
      acc[header] = cells[i] ?? ''
      return acc
    }, {})
  })
  return { headers, rows }
}

const getExtension = (name) => name.split('.').pop()?.toLowerCase() || ''

export async function extractFile(file) {
  const ext = getExtension(file.name)

  if (ext === 'csv') {
    const text = await readAsText(file)
    const { headers, rows } = parseCsv(text)
    return { kind: 'csv', headers, rows, rowCount: rows.length }
  }

  if (ext === 'json') {
    const text = await readAsText(file)
    const data = JSON.parse(text)
    const rows = Array.isArray(data) ? data : [data]
    return { kind: 'json', rows, rowCount: rows.length }
  }

  if (ext === 'xlsx') {
    const buffer = await readAsArrayBuffer(file)
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name]
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      const headers = (matrix[0] || []).map((h) => String(h))
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      return { name, headers, rowCount: rows.length, rows }
    })
    const rows = sheets.flatMap((s) => s.rows)
    return {
      kind: 'xlsx',
      sheetNames: workbook.SheetNames,
      sheets,
      rows,
      rowCount: rows.length,
    }
  }

  const text = await readAsText(file)
  return { kind: 'text', preview: text.slice(0, 500), length: text.length }
}

const isColumnLetter = (s) => /^[A-Za-z]{1,3}$/.test(s)

const letterToIndex = (letter) => {
  const upper = letter.toUpperCase()
  let idx = 0
  for (let i = 0; i < upper.length; i++) {
    idx = idx * 26 + (upper.charCodeAt(i) - 64)
  }
  return idx - 1
}

const resolveHeader = (columnName, headers) => {
  if (!columnName) return null
  if (isColumnLetter(columnName)) {
    const idx = letterToIndex(columnName)
    return headers[idx] ?? null
  }
  const match = headers.find(
    (h) => h.toLowerCase() === columnName.toLowerCase(),
  )
  return match ?? columnName
}

const findSheet = (sheets, tabName) => {
  if (!tabName) return null
  const match = sheets.find((s) => s.name.toLowerCase() === tabName.toLowerCase())
  if (match) return match
  const idx = Number(tabName)
  if (Number.isInteger(idx) && idx >= 0 && idx < sheets.length) return sheets[idx]
  return null
}

export function applyMappings(extracted, mappings) {
  const cleaned = mappings.filter(
    (m) => m.tabName && m.columnHeading && m.collectionName && m.targetedAttribute,
  )
  if (!cleaned.length) {
    return { collections: {}, warnings: ['No complete mappings provided.'] }
  }

  const sheets =
    extracted.kind === 'xlsx'
      ? extracted.sheets
      : [{ name: 'default', headers: extracted.headers || [], rows: extracted.rows || [] }]

  const groups = new Map()
  for (const m of cleaned) {
    const key = `${m.tabName}::${m.collectionName}`
    if (!groups.has(key)) {
      groups.set(key, { tabName: m.tabName, collectionName: m.collectionName, columns: [] })
    }
    groups.get(key).columns.push({
      columnHeading: m.columnHeading,
      columnName: m.columnName,
      targetedAttribute: m.targetedAttribute,
    })
  }

  const collections = {}
  const warnings = []

  for (const group of groups.values()) {
    const sheet = findSheet(sheets, group.tabName)
    if (!sheet) {
      warnings.push(
        `Tab "${group.tabName}" not found. Available: ${sheets.map((s) => s.name).join(', ')}`,
      )
      continue
    }
    const resolved = group.columns.map((col) => ({
      targetedAttribute: col.targetedAttribute,
      columnName: col.columnName,
      header: resolveHeader(col.columnHeading, sheet.headers),
      sourceHeading: col.columnHeading,
    }))

    for (const col of resolved) {
      if (col.header == null) {
        warnings.push(
          `Column heading "${col.sourceHeading}" could not be resolved on tab "${sheet.name}".`,
        )
      }
    }

    const records = sheet.rows.map((row) => {
      const record = {}
      for (const col of resolved) {
        record[col.targetedAttribute] = col.header != null ? row[col.header] : undefined
      }
      return record
    })

    if (!collections[group.collectionName]) collections[group.collectionName] = []
    collections[group.collectionName].push(...records)
  }

  return { collections, warnings }
}
