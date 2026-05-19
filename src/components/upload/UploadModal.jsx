import { Plus, Trash2, X, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import FilePicker from './FilePicker.jsx'
import ColumnMappingList from './ColumnMappingList.jsx'
import { emptyMapping } from './mapping.js'
import { extractFile, applyMappings } from './extractFile.js'
import { examsApi, fetchAll, uploadApi } from '../../lib/sasiApi.js'

const initialMappings = () => [emptyMapping()]
const emptySubject = () => ({ columnHeading: '', columnName: '' })
const emptyExamMapping = () => ({
  studentLookup: { columnHeading: '', columnName: '' },
  subjects: [emptySubject()],
})

export default function UploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [mappings, setMappings] = useState(initialMappings)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const [rowLimit, setRowLimit] = useState('')
  const [isExamResults, setIsExamResults] = useState(false)
  const [examQuery, setExamQuery] = useState('')
  const [examId, setExamId] = useState('')
  const [examOptions, setExamOptions] = useState([])
  const [examOpen, setExamOpen] = useState(false)
  const [examsLoading, setExamsLoading] = useState(false)
  const [examMapping, setExamMapping] = useState(emptyExamMapping)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setMappings(initialMappings())
      setSubmitting(false)
      setError(null)
      setResult(null)
      setRowLimit('')
      setIsExamResults(false)
      setExamQuery('')
      setExamId('')
      setExamOptions([])
      setExamOpen(false)
      setExamMapping(emptyExamMapping())
    }
  }, [open])

  useEffect(() => {
    if (!open || !isExamResults || examOptions.length) return
    let cancelled = false
    setExamsLoading(true)
    fetchAll(examsApi)
      .then((items) => {
        if (!cancelled) setExamOptions(items)
      })
      .catch((err) => {
        if (!cancelled) console.warn('[UploadModal] failed to load exams:', err.message)
      })
      .finally(() => {
        if (!cancelled) setExamsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, isExamResults, examOptions.length])

  const examMatches = useMemo(() => {
    const q = examQuery.trim().toLowerCase()
    if (!q) return examOptions.slice(0, 8)
    return examOptions
      .filter((e) => {
        const name = (e.name || '').toLowerCase()
        const program = (e.programName || '').toLowerCase()
        return name.includes(q) || program.includes(q)
      })
      .slice(0, 8)
  }, [examQuery, examOptions])

  if (!open) return null

  const canSubmit =
    Boolean(file) && !submitting && (!isExamResults || Boolean(examId))

  const handleExamInput = (val) => {
    setExamQuery(val)
    const match = examOptions.find(
      (e) => (e.name || '').toLowerCase() === val.trim().toLowerCase(),
    )
    setExamId(match?.id || '')
  }

  const selectExam = (e) => {
    setExamId(e.id)
    setExamQuery(e.name)
    setExamOpen(false)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Pick a file before uploading.')
      return
    }
    if (isExamResults && !examId) {
      setError('Select an exam before uploading.')
      return
    }
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const extracted = await extractFile(file)

      let activeMappings
      let studentCodeAttribute
      if (isExamResults) {
        const lookup = examMapping.studentLookup
        if (!lookup.columnHeading.trim()) {
          throw new Error('Student lookup: column header is required.')
        }
        const subjects = examMapping.subjects.filter(
          (s) => s.columnHeading.trim() && s.columnName.trim(),
        )
        if (!subjects.length) {
          throw new Error(
            'Add at least one subject row with both column header and column name.',
          )
        }
        const tabName =
          extracted.kind === 'xlsx' ? extracted.sheetNames[0] || '0' : 'default'
        studentCodeAttribute = 'rollNo'
        activeMappings = [
          {
            tabName,
            columnHeading: lookup.columnHeading.trim(),
            columnName: lookup.columnName.trim(),
            targetedAttribute: studentCodeAttribute,
            collectionName: 'ExamResults',
          },
          ...subjects.map((s) => ({
            tabName,
            columnHeading: s.columnHeading.trim(),
            columnName: s.columnName.trim(),
            targetedAttribute: s.columnName.trim(),
            collectionName: 'ExamResults',
          })),
        ]
      } else {
        activeMappings = mappings.filter(
          (m) =>
            m.tabName ||
            m.columnHeading ||
            m.collectionName ||
            m.columnName ||
            m.targetedAttribute,
        )
      }

      const { collections, warnings } = applyMappings(extracted, activeMappings)

      if (!Object.keys(collections).length) {
        throw new Error('No rows to import. Check your column mappings.')
      }

      const limit = rowLimit.trim() ? Number(rowLimit) : null
      if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
        throw new Error('Max rows must be a positive whole number.')
      }
      const limited = limit
        ? Object.fromEntries(
            Object.entries(collections).map(([name, rows]) => [
              name,
              rows.slice(0, limit),
            ]),
          )
        : collections

      const response = await uploadApi.import({
        collections: limited,
        isExamResults,
        examId: isExamResults ? examId : undefined,
        studentCodeAttribute: isExamResults ? studentCodeAttribute : undefined,
      })

      setResult({ ...response, warnings })
      onUploaded?.({ ...response, warnings, file: file.name })
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="upload-modal-title" className="text-base font-semibold text-gray-900">
            New upload
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">File</h3>
            <FilePicker file={file} onFileChange={setFile} disabled={submitting} />
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700 sm:max-w-xs">
              Max rows per collection
              <input
                type="number"
                min="1"
                step="1"
                value={rowLimit}
                onChange={(e) => setRowLimit(e.target.value)}
                disabled={submitting}
                placeholder="Leave empty for all rows"
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="text-[11px] font-normal text-gray-500">
                Caps how many rows are extracted and uploaded for each target collection. Empty = no cap.
              </span>
            </label>
          </section>

          <section className="space-y-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Exam results</h3>
                <p className="text-[11px] text-gray-500">
                  Turn on to attach an examId to every uploaded row and unlock ExamResults as a target.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isExamResults}
                onClick={() => setIsExamResults((v) => !v)}
                disabled={submitting}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isExamResults ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isExamResults ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isExamResults ? (
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700">Exam</label>
                <input
                  type="text"
                  value={examQuery}
                  onChange={(e) => handleExamInput(e.target.value)}
                  onFocus={() => setExamOpen(true)}
                  onBlur={() => setTimeout(() => setExamOpen(false), 100)}
                  placeholder="Type to search exams…"
                  disabled={submitting}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {examOpen && examMatches.length > 0 ? (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {examsLoading ? (
                      <li className="px-2.5 py-1.5 text-xs text-gray-500">Loading…</li>
                    ) : null}
                    {examMatches.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onMouseDown={(ev) => {
                            ev.preventDefault()
                            selectExam(e)
                          }}
                          className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
                        >
                          <span className="text-gray-900">{e.name}</span>
                          <span className="text-[11px] text-gray-500">{e.programName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-1 text-[11px] text-gray-500">
                  {examsLoading
                    ? 'Loading exams…'
                    : examId
                      ? `Selected examId: ${examId}`
                      : 'Type to search; click a suggestion to select.'}
                </p>
              </div>
            ) : null}
          </section>

          <section>
            {isExamResults ? (
              <ExamResultsMappingSection
                value={examMapping}
                onChange={setExamMapping}
                disabled={submitting}
              />
            ) : (
              <>
                <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  For <strong>Students</strong> uploads, these attribute names are auto-resolved to
                  IDs: <code>section</code> &rarr; <code>sectionId</code> + <code>programId</code>,{' '}
                  <code>branch</code> &rarr; <code>branchId</code>, <code>program</code> &rarr;{' '}
                  <code>programId</code>. The original text values are dropped &mdash; only the IDs
                  are stored. Rows whose lookup values don't match an existing record are skipped
                  and reported.
                </div>
                <ColumnMappingList mappings={mappings} onChange={setMappings} />
                <p className="mt-2 text-xs text-gray-500">
                  Configure how spreadsheet columns map to Firestore collection attributes. Allowed
                  collections: Students, Programs, Branches, Exams.
                </p>
              </>
            )}
          </section>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="font-medium text-gray-900">Upload result</div>
              <div className="space-y-1 text-xs">
                {Object.entries(result.inserted || {}).map(([name, count]) => {
                  const sk = result.skipped?.[name] || { inFile: 0, inDb: 0 }
                  return (
                    <div key={name} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="font-mono text-gray-700">{name}</span>
                      <span className="text-emerald-700">inserted: {count}</span>
                      <span className="text-gray-500">
                        skipped (in-file): {sk.inFile}
                      </span>
                      <span className="text-gray-500">
                        skipped (already in DB): {sk.inDb}
                      </span>
                    </div>
                  )
                })}
              </div>
              {result.errors?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-red-700">
                    {result.errors.length} row error(s)
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-red-700">
                        <span className="font-mono">{e.collection}</span>
                        {e.rowIndex >= 0 ? ` row ${e.rowIndex}` : ''}: {e.message}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {result.warnings?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-amber-700">
                    {result.warnings.length} warning(s)
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-amber-700">
                        {w}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </footer>
      </div>
    </div>
  )
}

const fieldCls =
  'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50'

function ExamResultsMappingSection({ value, onChange, disabled }) {
  const { studentLookup, subjects } = value

  const setLookup = (key, v) =>
    onChange({ ...value, studentLookup: { ...studentLookup, [key]: v } })

  const setSubject = (i, key, v) =>
    onChange({
      ...value,
      subjects: subjects.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)),
    })

  const addSubject = () =>
    onChange({ ...value, subjects: [...subjects, { columnHeading: '', columnName: '' }] })

  const removeSubject = (i) => {
    if (subjects.length <= 1) return
    onChange({ ...value, subjects: subjects.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-200 bg-amber-50/40 p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
            Step 1
          </span>
          <h3 className="text-sm font-semibold text-gray-900">Student lookup column</h3>
        </div>
        <p className="mb-2 text-[11px] text-gray-600">
          The column that holds each student's roll number. We use it to find the student
          in the database. This column's value is not stored on the result.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Column header
            <input
              type="text"
              value={studentLookup.columnHeading}
              onChange={(e) => setLookup('columnHeading', e.target.value)}
              placeholder="e.g. A or Roll No"
              disabled={disabled}
              className={fieldCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Column name
            <input
              type="text"
              value={studentLookup.columnName}
              onChange={(e) => setLookup('columnName', e.target.value)}
              placeholder="e.g. Roll number"
              disabled={disabled}
              className={fieldCls}
            />
          </label>
        </div>
      </div>

      <div className="rounded-md border border-brand-200 bg-brand-50/30 p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-900">
              Step 2
            </span>
            <h3 className="text-sm font-semibold text-gray-900">Subject columns (marks)</h3>
          </div>
          <button
            type="button"
            onClick={addSubject}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add subject
          </button>
        </div>
        <p className="mb-2 text-[11px] text-gray-600">
          Each row reads one column from the spreadsheet and stores it as a field on the
          ExamResults doc. <strong>Column name</strong> becomes the field key
          (e.g. <code>Eng</code>, <code>Math</code>).
        </p>
        <div className="space-y-2">
          {subjects.map((s, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Column header
                <input
                  type="text"
                  value={s.columnHeading}
                  onChange={(e) => setSubject(i, 'columnHeading', e.target.value)}
                  placeholder="e.g. E or English"
                  disabled={disabled}
                  className={fieldCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Column name
                <input
                  type="text"
                  value={s.columnName}
                  onChange={(e) => setSubject(i, 'columnName', e.target.value)}
                  placeholder="e.g. Eng"
                  disabled={disabled}
                  className={fieldCls}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  disabled={disabled || subjects.length <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove subject"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
