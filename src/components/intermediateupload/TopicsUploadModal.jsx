import { useEffect, useState } from 'react'
import { X, Loader2, UploadCloud } from 'lucide-react'
import IntermediateFilePicker from './IntermediateFilePicker.jsx'
import { extractTopicsFromFile } from './extractIntermediateFile.js'
import { intUploadApi, intStreamsApi, intSubjectsApi } from '../../lib/intermediateApi.js'
import { useAuth } from '../../hooks/useAuth.js'

const COLUMN_FIELDS = [
  { key: 'name', label: 'Topic Name', required: true, placeholder: 'e.g. A or Topic/Name' },
  { key: 'weightage', label: 'Weightage', required: false, placeholder: 'e.g. B or Weightage (optional)' },
  { key: 'tabname', label: 'Tab Name', required: false, placeholder: 'e.g. C or Sheet1 (optional)' },
]

const emptyColumnMappings = () =>
  COLUMN_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})

const emptyRowSettings = () => ({ tabName: '', startRow: '', endRow: '' })

export default function TopicsUploadModal({ open, onClose, onUploaded }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [columnMappings, setColumnMappings] = useState(emptyColumnMappings)
  const [rowSettings, setRowSettings] = useState(emptyRowSettings)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Filters
  const [streams, setStreams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedStream, setSelectedStream] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loadingStreams, setLoadingStreams] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Load streams when modal opens
  useEffect(() => {
    if (open && streams.length === 0) {
      setLoadingStreams(true)
      intStreamsApi.listAll()
        .then(res => setStreams(res.items || []))
        .catch(err => console.error('Failed to load streams:', err))
        .finally(() => setLoadingStreams(false))
    }
  }, [open])

  // Load subjects when stream changes
  useEffect(() => {
    if (!selectedStream) {
      setSubjects([])
      setSelectedSubject('')
      return
    }
    setLoadingSubjects(true)
    intSubjectsApi.byStreamYear({ streamid: selectedStream })
      .then(res => setSubjects(res.items || []))
      .catch(err => console.error('Failed to load subjects:', err))
      .finally(() => setLoadingSubjects(false))
  }, [selectedStream])

  useEffect(() => {
    if (!open) {
      setFile(null)
      setColumnMappings(emptyColumnMappings())
      setRowSettings(emptyRowSettings())
      setSelectedStream('')
      setSelectedSubject('')
      setSubmitting(false)
      setError(null)
      setResult(null)
    }
  }, [open])

  if (!open) return null

  const setColumnMapping = (key, value) =>
    setColumnMappings((prev) => ({ ...prev, [key]: value }))

  const setRowSetting = (key, value) =>
    setRowSettings((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setError(null)
    setResult(null)
    if (!file) return setError('Pick a file before uploading.')
    if (!selectedStream) return setError('Please select a stream.')
    if (!selectedSubject) return setError('Please select a subject.')

    // Validate column mappings
    for (const f of COLUMN_FIELDS) {
      if (f.required && !columnMappings[f.key].trim()) {
        return setError(`Column mapping for "${f.label}" is required.`)
      }
    }

    setSubmitting(true)
    try {
      const cleanColumnMappings = Object.fromEntries(
        Object.entries(columnMappings)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      )

      const extractOptions = { columnMappings: cleanColumnMappings }
      if (rowSettings.tabName && rowSettings.tabName.trim()) extractOptions.tabName = rowSettings.tabName.trim()
      if (rowSettings.startRow) extractOptions.startRow = parseInt(rowSettings.startRow, 10)
      if (rowSettings.endRow) extractOptions.endRow = parseInt(rowSettings.endRow, 10)

      const { rows, warnings: extractWarnings } = await extractTopicsFromFile(file, extractOptions)

      if (!rows.length) {
        throw new Error('No usable rows found. Check column mappings.')
      }

      const response = await intUploadApi.topics({
        fileName: file.name,
        rows,
        streamid: selectedStream,
        subjectid: selectedSubject,
        uploadedBy: user?.email || null,
      })

      setResult({ ...response, extractWarnings })
      onUploaded?.({
        type: 'topics',
        fileName: file.name,
        ...response,
        status: 'SUCCESS',
      })
    } catch (err) {
      setError(err.message || 'Upload failed.')
      onUploaded?.({
        type: 'topics',
        fileName: file.name,
        status: 'FAILED',
        errorLog: err.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">Upload Topics</h2>
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
          {/* Step 0 — Filters */}
          <section className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900">
                Filters
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Select Stream & Subject</h3>
            </div>
            <p className="mb-2 text-[11px] text-gray-600">
              Select the stream and subject for these topics. This helps avoid ambiguity when the same topic name exists in multiple subjects.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                <span>Stream <span className="ml-1 text-red-600">*</span></span>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  disabled={submitting || loadingStreams}
                  className={inputCls}
                >
                  <option value="">-- Select Stream --</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                <span>Subject <span className="ml-1 text-red-600">*</span></span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={submitting || loadingSubjects || !selectedStream}
                  className={inputCls}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Step 1 — file */}
          <section className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                Step 1
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Choose the file</h3>
            </div>
            <IntermediateFilePicker file={file} onFileChange={setFile} disabled={submitting} />
            <p className="mt-2 text-[11px] text-gray-500">
              Upload Excel (.xlsx, .xls) or CSV file with topics. The file should contain topic name and weightage.
            </p>
          </section>

          {/* Step 2 — Row range & column mappings */}
          <section className="rounded-md border border-amber-200 bg-amber-50/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Step 2
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Sheet, Row Range & Column Mappings</h3>
            </div>

            <p className="mb-2 text-[11px] text-gray-600">
              <strong>Sheet & Row range:</strong> Specify which sheet/tab to read (leave blank for first sheet) and which rows to process (leave blank for all data rows).
            </p>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                <span>Sheet/Tab Name (optional)</span>
                <input
                  type="text"
                  value={rowSettings.tabName}
                  onChange={(e) => setRowSetting('tabName', e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. Sheet1 or 0"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                <span>Start Row (optional)</span>
                <input
                  type="number"
                  min="1"
                  value={rowSettings.startRow}
                  onChange={(e) => setRowSetting('startRow', e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. 2"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                <span>End Row (optional)</span>
                <input
                  type="number"
                  min="1"
                  value={rowSettings.endRow}
                  onChange={(e) => setRowSetting('endRow', e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. 100"
                  className={inputCls}
                />
              </label>
            </div>

            <p className="mb-2 text-[11px] text-gray-600">
              <strong>Column mappings:</strong> Enter column letter (<code>A</code>, <code>B</code>) or header name. Subject name will be looked up in database.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
              {COLUMN_FIELDS.map((f) => (
                <label
                  key={f.key}
                  className="flex flex-col gap-1 text-xs font-medium text-gray-700"
                >
                  <span>
                    {f.label}
                    {f.required ? <span className="ml-1 text-red-600">*</span> : null}
                  </span>
                  <input
                    type="text"
                    value={columnMappings[f.key]}
                    onChange={(e) => setColumnMapping(f.key, e.target.value)}
                    disabled={submitting}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                </label>
              ))}
            </div>
          </section>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <div className="font-medium">
                Inserted: {result.inserted ?? 0} · Updated: {result.updated ?? 0}
              </div>
              {(result.startRow !== undefined || result.endRow !== undefined) ? (
                <div className="text-xs text-emerald-900/80">
                  Processed rows: {result.startRow ?? '?'} to {result.endRow ?? '?'}
                </div>
              ) : null}
              {result.skipped ? (
                <div className="text-xs text-emerald-900/80">
                  Skipped — invalid: {result.skipped.invalid ?? 0} · duplicate:{' '}
                  {result.skipped.duplicate ?? 0}
                </div>
              ) : null}
              {result.errors?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-red-700">
                    {result.errors.length} row error(s)
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {result.errors.slice(0, 50).map((e, i) => (
                      <li key={i} className="text-red-700">
                        row {e.rowIndex}: {e.message}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {result.extractWarnings?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-amber-700">
                    {result.extractWarnings.length} parse warning(s)
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {result.extractWarnings.map((w, i) => (
                      <li key={i} className="text-amber-700">{w}</li>
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
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </footer>
      </div>
    </div>
  )
}
