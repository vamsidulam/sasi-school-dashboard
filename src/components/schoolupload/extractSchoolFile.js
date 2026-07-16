import { extractFile } from '../upload/extractFile.js'

function isPositiveIntString(s) {
  return /^[1-9]\d*$/.test(s)
}
function isColumnLetter(s) {
  return /^[A-Za-z]{1,3}$/.test(s)
}

function letterToIndex(letter) {
  const upper = letter.toUpperCase()
  let idx = 0
  for (let i = 0; i < upper.length; i++) {
    idx = idx * 26 + (upper.charCodeAt(i) - 64)
  }
  return idx - 1
}

function resolveHeader(ref, headers) {
  if (ref === null || ref === undefined) return null
  const s = String(ref).trim()
  if (!s) return null

  if (typeof ref === 'number' && Number.isInteger(ref) && ref >= 1) {
    return headers[ref - 1] ?? null
  }
  if (isPositiveIntString(s)) {
    const idx = Number(s) - 1
    return headers[idx] ?? null
  }
  if (isColumnLetter(s)) {
    return headers[letterToIndex(s)] ?? null
  }
  const match = headers.find((h) => String(h).toLowerCase() === s.toLowerCase())
  return match ?? null
}

function findSheet(extracted, tabName) {
  if (extracted.kind !== 'xlsx') {
    return {
      name: 'default',
      headers: extracted.headers || [],
      rows: extracted.rows || [],
    }
  }
  const sheets = extracted.sheets
  if (!tabName) return sheets[0]
  const lower = String(tabName).toLowerCase()
  const byName = sheets.find((s) => s.name.toLowerCase() === lower)
  if (byName) return byName
  const idx = Number(tabName)
  if (Number.isInteger(idx) && idx >= 0 && idx < sheets.length) return sheets[idx]
  return null
}

function rowRangeToSlice(startRow, endRow, totalRows) {
  const start = Number.isInteger(startRow) && startRow >= 2 ? startRow : 2
  const end = Number.isInteger(endRow) && endRow >= start ? endRow : totalRows + 1
  return { startIdx: start - 2, endIdx: end - 1 }
}

/**
 * Parse a school students file.
 */
export async function extractSchoolStudentsFromFile(
  file,
  { tabName, startRow, endRow, mappings },
) {
  const extracted = await extractFile(file)
  const sheet = findSheet(extracted, tabName)
  if (!sheet) {
    throw new Error(
      `Tab "${tabName}" not found. Available: ${extracted.sheetNames?.join(', ') || 'default'}`,
    )
  }

  const headers = sheet.headers || []
  const warnings = []
  const resolved = {}
  for (const [field, ref] of Object.entries(mappings)) {
    if (!ref || !String(ref).trim()) continue
    const header = resolveHeader(ref, headers)
    if (header === null) {
      warnings.push(`Column "${ref}" for field "${field}" could not be resolved.`)
      continue
    }
    resolved[field] = header
  }

  if (!resolved.rollNo) {
    throw new Error('Mapping for "rollNo" is required.')
  }

  const { startIdx, endIdx } = rowRangeToSlice(startRow, endRow, sheet.rows.length)
  const rows = sheet.rows.slice(startIdx, endIdx)

  const students = []
  for (const row of rows) {
    const out = {}
    for (const [field, header] of Object.entries(resolved)) {
      const v = row[header]
      out[field] = v === undefined ? null : v
    }
    if (out.rollNo === null || out.rollNo === undefined || String(out.rollNo).trim() === '') {
      continue
    }
    students.push(out)
  }

  return { students, warnings }
}

/**
 * Parse a school exam results file.
 */
export async function extractSchoolExamResultsFromFile(
  file,
  { tabName, startRow, endRow, studentCodeColumn, subjectColumns },
) {
  const extracted = await extractFile(file)
  const sheet = findSheet(extracted, tabName)
  if (!sheet) {
    throw new Error(
      `Tab "${tabName}" not found. Available: ${extracted.sheetNames?.join(', ') || 'default'}`,
    )
  }

  const headers = sheet.headers || []
  const warnings = []

  // Resolve student code column
  const studentHeader = resolveHeader(studentCodeColumn, headers)
  if (!studentHeader) {
    throw new Error(`Student code column "${studentCodeColumn}" could not be resolved.`)
  }

  // Resolve subject columns: { subjectId: columnRef }
  const resolvedSubjects = {}
  for (const [subjectId, colRef] of Object.entries(subjectColumns)) {
    const header = resolveHeader(colRef, headers)
    if (header === null) {
      warnings.push(`Column "${colRef}" for subject could not be resolved.`)
      continue
    }
    resolvedSubjects[subjectId] = header
  }

  if (!Object.keys(resolvedSubjects).length) {
    throw new Error('At least one subject column must be mapped.')
  }

  const { startIdx, endIdx } = rowRangeToSlice(startRow, endRow, sheet.rows.length)
  const rows = sheet.rows.slice(startIdx, endIdx)

  const results = []
  for (const row of rows) {
    const studentCode = row[studentHeader]
    if (studentCode === undefined || studentCode === null || String(studentCode).trim() === '') {
      continue
    }

    const subjectScores = {}
    for (const [subjectId, header] of Object.entries(resolvedSubjects)) {
      const v = row[header]
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v)
        if (Number.isFinite(n)) {
          subjectScores[subjectId] = n
        }
      }
    }

    results.push({
      studentCode: String(studentCode).trim(),
      subjectScores,
    })
  }

  return { results, warnings }
}
