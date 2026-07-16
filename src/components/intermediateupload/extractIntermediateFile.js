import { extractFile } from '../upload/extractFile.js'

// A "column ref" can be:
//   - a positive integer or numeric string  → 1-based column index
//   - a letter string (A, B, AA, ...)        → Excel-style column letter
//   - any other string                       → header name (case-insensitive)
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
  return idx - 1 // 0-based
}

// Resolve a column ref to the header label that XLSX rows are keyed by.
// Returns null if it can't be resolved.
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

// Convert user-entered Excel row numbers (where row 1 is the header) to a
// 0-based slice over the data rows returned by extractFile() (which already
// excludes the header). Returns { startIdx, endIdx } suitable for Array.slice.
function rowRangeToSlice(startRow, endRow, totalRows) {
  // Default: full range (row 2 → last data row)
  const start = Number.isInteger(startRow) && startRow >= 2 ? startRow : 2
  const end =
    Number.isInteger(endRow) && endRow >= start ? endRow : totalRows + 1
  return { startIdx: start - 2, endIdx: end - 1 }
}

/**
 * Parse a student roster file using flat field→column mappings.
 *
 * @param {File} file
 * @param {Object} opts
 * @param {string} [opts.tabName]   sheet name or 0-based index (xlsx only)
 * @param {number} [opts.startRow]  first Excel row to include (≥2; row 1 is header)
 * @param {number} [opts.endRow]    last Excel row to include (inclusive)
 * @param {Object} opts.mappings    { fieldName: columnRef, ... } — `code` required
 * @returns {Promise<{ students: Array<Object>, warnings: string[] }>}
 */
export async function extractStudentsFromFile(
  file,
  { tabName, startRow, endRow, mappings },
) {
  const extracted = await extractFile(file)
  const sheet = findSheet(extracted, tabName)
  if (!sheet) {
    throw new Error(
      `Tab "${tabName}" not found. Available: ${
        extracted.sheetNames?.join(', ') || 'default'
      }`,
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

  if (!resolved.code) {
    throw new Error('Mapping for "code" is required.')
  }

  const { startIdx, endIdx } = rowRangeToSlice(
    startRow,
    endRow,
    sheet.rows.length,
  )
  const rows = sheet.rows.slice(startIdx, endIdx)

  const students = []
  for (const row of rows) {
    const out = {}
    for (const [field, header] of Object.entries(resolved)) {
      const v = row[header]
      out[field] = v === undefined ? null : v
    }
    // skip blank rows (no code)
    if (out.code === null || out.code === undefined || String(out.code).trim() === '') {
      continue
    }
    students.push(out)
  }

  return { students, warnings }
}

// Expand a Range subject mapping into per-question column refs (numeric).
//   from=2, to=4, qCount=3  →  { "1": 2, "2": 3, "3": 4 }
// Keys are bare numeric strings — they line up with ExamQuestionTopics IDs.
function expandRange(from, to, qCount) {
  const f = Number(from)
  const t = Number(to)
  if (!Number.isInteger(f) || !Number.isInteger(t) || f < 1 || t < 1) {
    throw new Error('Range from/to must be positive column numbers.')
  }
  if (t < f) throw new Error('Range "to" must be ≥ "from".')
  const span = t - f + 1
  if (span !== qCount) {
    throw new Error(
      `Range covers ${span} columns but the subject has ${qCount} questions.`,
    )
  }
  const out = {}
  for (let i = 0; i < qCount; i++) out[String(i + 1)] = f + i
  return out
}

/**
 * Parse an exam-question-topics workbook with per-subject ranges + shared
 * column mappings.
 *
 * Each subject has its own block in the workbook (potentially on a different
 * tab, with its own start/end row range). The question/topic/subtopic/level/
 * questiontype columns share the same layout across all subjects.
 *
 * @param {File} file
 * @param {Object} opts
 * @param {Object} opts.subjectConfig  { [subjectId]: { tabName, startRow, endRow } }
 * @param {Object} opts.columnMappings { questionId, topic, subtopic?, level, questiontype }
 * @returns {Promise<{ rows: Array<Object>, warnings: string[] }>}
 *
 * Each output row carries `subjectId` (so the backend uses it directly,
 * skipping the name→id lookup).
 */
export async function extractExamQuestionTopicsFromFile(
  file,
  { subjectConfig, columnMappings },
) {
  const extracted = await extractFile(file)
  const warnings = []

  const required = ['questionId', 'topic', 'level', 'questiontype']
  const allFields = [...required, 'subtopic']
  if (!subjectConfig || !Object.keys(subjectConfig).length) {
    throw new Error('At least one subject mapping is required.')
  }

  const rows = []
  for (const [subjectId, conf] of Object.entries(subjectConfig)) {
    const sheet = findSheet(extracted, conf.tabName)
    if (!sheet) {
      warnings.push(
        `Subject "${subjectId}": tab "${conf.tabName}" not found — skipped.`,
      )
      continue
    }
    const headers = sheet.headers || []
    const resolved = {}
    let missingRequired = null
    for (const field of allFields) {
      const ref = columnMappings?.[field]
      if (!ref || !String(ref).trim()) continue
      const header = resolveHeader(ref, headers)
      if (header === null) {
        warnings.push(
          `Subject "${subjectId}": column "${ref}" for field "${field}" could not be resolved.`,
        )
        continue
      }
      resolved[field] = header
    }
    for (const field of required) {
      if (!resolved[field]) {
        missingRequired = field
        break
      }
    }
    if (missingRequired) {
      warnings.push(
        `Subject "${subjectId}": mapping for "${missingRequired}" could not be resolved — skipped.`,
      )
      continue
    }

    const { startIdx, endIdx } = rowRangeToSlice(
      conf.startRow,
      conf.endRow,
      sheet.rows.length,
    )
    const sliced = sheet.rows.slice(startIdx, endIdx)

    for (const row of sliced) {
      const out = { subjectId }
      for (const [field, header] of Object.entries(resolved)) {
        const v = row[header]
        out[field] = v === undefined || v === null ? '' : String(v)
      }
      // Skip wholly-blank rows
      if (!out.questionId?.trim() && !out.topic?.trim()) continue
      rows.push(out)
    }
  }

  return { rows, warnings }
}

/**
 * Parse a topics file with name + subject + weightage + tabname columns.
 *
 * @param {File} file
 * @param {Object} opts
 * @param {string} [opts.tabName]   sheet name or 0-based index (xlsx only)
 * @param {number} [opts.startRow]  first Excel row to include (≥2; row 1 is header)
 * @param {number} [opts.endRow]    last Excel row to include (inclusive)
 * @param {Object} opts.columnMappings  { name: columnRef, subject: columnRef, weightage?: columnRef, tabname?: columnRef }
 * @returns {Promise<{ rows: Array<{name, subject, weightage?, tabname?}>, warnings: string[] }>}
 */
export async function extractTopicsFromFile(file, { tabName, startRow, endRow, columnMappings }) {
  const extracted = await extractFile(file)
  const sheet = findSheet(extracted, tabName)
  if (!sheet) {
    throw new Error(
      tabName
        ? `Tab "${tabName}" not found. Available: ${extracted.sheetNames?.join(', ') || 'default'}`
        : 'No sheet found in file'
    )
  }

  const headers = sheet.headers || []
  const warnings = []
  const resolved = {}

  // Resolve column mappings
  for (const [key, ref] of Object.entries(columnMappings)) {
    if (!ref || !String(ref).trim()) continue
    const h = resolveHeader(ref, headers)
    if (!h) {
      warnings.push(`Column "${ref}" for ${key} not found`)
    } else {
      resolved[key] = h
    }
  }

  if (!resolved.name) {
    throw new Error('name column could not be resolved')
  }

  const { startIdx, endIdx } = rowRangeToSlice(
    startRow,
    endRow,
    sheet.rows.length,
  )
  const slicedRows = sheet.rows.slice(startIdx, endIdx)

  const rows = []
  for (const rawRow of slicedRows) {
    const name = String(rawRow[resolved.name] || '').trim()
    if (!name) continue // Skip empty rows

    const row = { name }
    if (resolved.subject) {
      const s = rawRow[resolved.subject]
      if (s !== null && s !== undefined && s !== '') {
        row.subject = String(s).trim()
      }
    }
    if (resolved.weightage) {
      const w = rawRow[resolved.weightage]
      if (w !== null && w !== undefined && w !== '') {
        row.weightage = Number(w)
      }
    }
    if (resolved.tabname) {
      const t = rawRow[resolved.tabname]
      if (t !== null && t !== undefined && t !== '') {
        row.tabname = String(t).trim()
      }
    }
    rows.push(row)
  }

  return { rows, warnings }
}

/**
 * Parse a subtopics file with name + topic columns.
 *
 * @param {File} file
 * @param {Object} opts
 * @param {string} [opts.tabName]   sheet name or 0-based index (xlsx only)
 * @param {number} [opts.startRow]  first Excel row to include (≥2; row 1 is header)
 * @param {number} [opts.endRow]    last Excel row to include (inclusive)
 * @param {Object} opts.columnMappings  { name: columnRef, topic: columnRef }
 * @returns {Promise<{ rows: Array<{name, topic}>, warnings: string[] }>}
 */
export async function extractSubtopicsFromFile(file, { tabName, startRow, endRow, columnMappings }) {
  const extracted = await extractFile(file)
  const sheet = findSheet(extracted, tabName)
  if (!sheet) {
    throw new Error(
      tabName
        ? `Tab "${tabName}" not found. Available: ${extracted.sheetNames?.join(', ') || 'default'}`
        : 'No sheet found in file'
    )
  }

  const headers = sheet.headers || []
  const warnings = []
  const resolved = {}

  // Resolve column mappings
  for (const [key, ref] of Object.entries(columnMappings)) {
    if (!ref || !String(ref).trim()) continue
    const h = resolveHeader(ref, headers)
    if (!h) {
      warnings.push(`Column "${ref}" for ${key} not found`)
    } else {
      resolved[key] = h
    }
  }

  if (!resolved.name) {
    throw new Error('name column could not be resolved')
  }

  const { startIdx, endIdx } = rowRangeToSlice(
    startRow,
    endRow,
    sheet.rows.length,
  )
  const slicedRows = sheet.rows.slice(startIdx, endIdx)

  const rows = []
  for (const rawRow of slicedRows) {
    const name = String(rawRow[resolved.name] || '').trim()
    if (!name) continue // Skip empty rows

    const row = { name }
    if (resolved.topic) {
      const t = rawRow[resolved.topic]
      if (t !== null && t !== undefined && t !== '') {
        row.topic = String(t).trim()
      }
    }
    rows.push(row)
  }

  return { rows, warnings }
}

/**
 * Parse an exam-results workbook using per-subject mappings.
 *
 * Each subject mapping can specify its own tab, lookup column, row limit,
 * and either a contiguous range (from/to numeric column #) or an explicit
 * per-question column map.
 *
 * @param {File} file
 * @param {Object} opts
 * @param {Object} opts.examSubjects  `{ subjectName: numberOfQuestions }` from the exam
 * @param {Object} opts.subjectConfig per-subject config (see modal state shape)
 * @returns {Promise<{ results: Array<{ studentCode, subjects }>, warnings: string[] }>}
 */
export async function extractExamResultsFromFile(file, { examSubjects, subjectConfig }) {
  const extracted = await extractFile(file)
  const warnings = []

  // resultsByCode[code] = { studentCode, subjects: { maths: { q1: 'A' }, ... } }
  const resultsByCode = new Map()

  for (const [subjectName, qCount] of Object.entries(examSubjects)) {
    const conf = subjectConfig[subjectName]
    if (!conf) {
      warnings.push(`No mapping provided for subject "${subjectName}" — skipped.`)
      continue
    }

    const sheet = findSheet(extracted, conf.tabName)
    if (!sheet) {
      warnings.push(
        `Subject "${subjectName}": tab "${conf.tabName}" not found — skipped.`,
      )
      continue
    }
    const headers = sheet.headers || []

    const lookupHeader = resolveHeader(conf.studentLookupCol, headers)
    if (lookupHeader === null) {
      warnings.push(
        `Subject "${subjectName}": student lookup column "${conf.studentLookupCol}" could not be resolved — skipped.`,
      )
      continue
    }

    let questionRefs // { q1: ref, q2: ref, ... }
    if (conf.type === 'range') {
      try {
        questionRefs = expandRange(conf.from, conf.to, qCount)
      } catch (e) {
        warnings.push(`Subject "${subjectName}": ${e.message}`)
        continue
      }
    } else {
      questionRefs = conf.questions
    }

    // Resolve each question column to its header label
    const questionHeaders = {}
    let anyMissing = false
    for (const [qKey, ref] of Object.entries(questionRefs)) {
      const h = resolveHeader(ref, headers)
      if (h === null) {
        warnings.push(
          `Subject "${subjectName}": ${qKey} column "${ref}" could not be resolved.`,
        )
        anyMissing = true
        break
      }
      questionHeaders[qKey] = h
    }
    if (anyMissing) continue

    const { startIdx, endIdx } = rowRangeToSlice(
      conf.startRow,
      conf.endRow,
      sheet.rows.length,
    )
    const rows = sheet.rows.slice(startIdx, endIdx)

    for (const row of rows) {
      const codeRaw = row[lookupHeader]
      const code = codeRaw === null || codeRaw === undefined ? '' : String(codeRaw).trim()
      if (!code) continue
      let entry = resultsByCode.get(code)
      if (!entry) {
        entry = { studentCode: code, subjects: {} }
        resultsByCode.set(code, entry)
      }
      const qMap = {}
      for (const [qKey, header] of Object.entries(questionHeaders)) {
        const v = row[header]
        qMap[qKey] = v === null || v === undefined ? '' : String(v)
      }
      entry.subjects[subjectName] = qMap
    }
  }

  return { results: Array.from(resultsByCode.values()), warnings }
}
