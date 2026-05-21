import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, UploadCloud } from 'lucide-react'
import IntermediateFilePicker from './IntermediateFilePicker.jsx'
import { extractExamQuestionTopicsFromFile } from './extractIntermediateFile.js'
import {
  intUploadApi,
  intBranchesApi,
  intStreamsApi,
  intYearsApi,
  intExamsApi,
  intSubjectsApi,
} from '../../lib/intermediateApi.js'

// Global column mappings (apply across all subjects since they share the
// same column layout in the workbook).
// Each value the user enters is a *column reference* — a letter (B), a number
// (2), or a header name. The placeholder shows column-shaped examples so it's
// clear we're not asking for the value itself.
const COLUMN_FIELDS = [
  { key: 'questionId', label: 'Question # — column', required: true, placeholder: 'e.g. B (where 1, 2, 3 … live)' },
  { key: 'topic', label: 'Topic — column', required: true, placeholder: 'e.g. C or Topic' },
  { key: 'subtopic', label: 'Subtopic — column', required: false, placeholder: 'e.g. D or Subtopic (optional)' },
  { key: 'level', label: 'Level — column', required: true, placeholder: 'e.g. E or Difficulty / Level' },
  { key: 'questiontype', label: 'Question Type — column', required: true, placeholder: 'e.g. F or Type' },
]

const emptyColumnMappings = () =>
  COLUMN_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})

// Build per-subject config from the exam's `subjects` map (keys are subject IDs).
function buildSubjectConfig(examSubjects) {
  if (!examSubjects) return {}
  return Object.fromEntries(
    Object.keys(examSubjects).map((sid) => [
      sid,
      { tabName: '', startRow: '', endRow: '' },
    ]),
  )
}

export default function IntermediateExamQuestionTopicsUploadModal({ open, onClose, onUploaded }) {
  const [branchId, setBranchId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [yearId, setYearId] = useState('')
  const [examId, setExamId] = useState('')

  const [file, setFile] = useState(null)
  const [subjectConfig, setSubjectConfig] = useState({})
  const [columnMappings, setColumnMappings] = useState(emptyColumnMappings)
  const [subjectsById, setSubjectsById] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const [branches, setBranches] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])
  const [exams, setExams] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    intBranchesApi
      .listAll()
      .then((res) => !cancelled && setBranches(res.items || []))
      .catch((err) => !cancelled && console.warn('[Topics] branches load:', err.message))
    return () => {
      cancelled = true
    }
  }, [open])

  // Streams are global now — load all once when the modal opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    intStreamsApi
      .listAll()
      .then((res) => !cancelled && setStreams(res.items || []))
      .catch((err) => !cancelled && console.warn('[Topics] streams load:', err.message))
    return () => {
      cancelled = true
    }
  }, [open])

  // Years are global now — load all once when the modal opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    intYearsApi
      .listAll()
      .then((res) => !cancelled && setYears(res.items || []))
      .catch((err) => !cancelled && console.warn('[Topics] years load:', err.message))
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingFilters(true)
    intExamsApi
      .list({
        branchid: branchId || undefined,
        streamid: streamId || undefined,
        yearid: yearId || undefined,
      })
      .then((res) => !cancelled && setExams(res.items || []))
      .catch((err) => !cancelled && console.warn('[Topics] exams load:', err.message))
      .finally(() => !cancelled && setLoadingFilters(false))
    return () => {
      cancelled = true
    }
  }, [open, branchId, streamId, yearId])

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === examId) || null,
    [exams, examId],
  )

  // Load subject names for the selected exam so we can show them in Step 3
  useEffect(() => {
    if (!selectedExam) {
      setSubjectsById({})
      return
    }
    let cancelled = false
    intSubjectsApi
      .byStreamYear({
        streamid: selectedExam.streamid,
        yearid: selectedExam.yearid,
      })
      .then((res) => {
        if (cancelled) return
        const map = {}
        for (const s of res.items || []) map[s.id] = s
        setSubjectsById(map)
      })
      .catch((err) => !cancelled && console.warn('[Topics] subjects load:', err.message))
    return () => {
      cancelled = true
    }
  }, [selectedExam])

  // Rebuild per-subject config whenever the selected exam changes
  useEffect(() => {
    setSubjectConfig(selectedExam ? buildSubjectConfig(selectedExam.subjects) : {})
  }, [selectedExam])

  useEffect(() => {
    if (!open) {
      setBranchId('')
      setStreamId('')
      setYearId('')
      setExamId('')
      setFile(null)
      setSubjectConfig({})
      setColumnMappings(emptyColumnMappings())
      setSubmitting(false)
      setError(null)
      setResult(null)
    }
  }, [open])

  if (!open) return null

  const setSubjectField = (sid, key, value) =>
    setSubjectConfig((prev) => ({
      ...prev,
      [sid]: { ...prev[sid], [key]: value },
    }))

  const setColumnMapping = (key, value) =>
    setColumnMappings((prev) => ({ ...prev, [key]: value }))

  const copyFirstSubjectMeta = () => {
    const sids = Object.keys(subjectConfig)
    if (sids.length < 2) return
    const first = subjectConfig[sids[0]]
    setSubjectConfig((prev) => {
      const out = { ...prev }
      for (const sid of sids.slice(1)) {
        out[sid] = {
          ...out[sid],
          tabName: first.tabName,
          startRow: first.startRow,
          endRow: first.endRow,
        }
      }
      return out
    })
  }

  const handleSubmit = async () => {
    setError(null)
    setResult(null)
    if (!selectedExam) return setError('Select an exam first.')
    if (!file) return setError('Pick a file before uploading.')

    // Validate column mappings (global)
    for (const f of COLUMN_FIELDS) {
      if (f.required && !columnMappings[f.key].trim()) {
        return setError(`Column mapping for "${f.label}" is required.`)
      }
    }

    // Validate per-subject configs
    const cleanedConfig = {}
    for (const [sid, conf] of Object.entries(subjectConfig)) {
      const label = subjectsById[sid]?.name || sid
      let startN = null
      let endN = null
      if (conf.startRow && String(conf.startRow).trim()) {
        startN = Number(conf.startRow)
        if (!Number.isInteger(startN) || startN < 2) {
          return setError(`Subject "${label}": Start row must be ≥ 2 (row 1 is the header).`)
        }
      }
      if (conf.endRow && String(conf.endRow).trim()) {
        endN = Number(conf.endRow)
        if (!Number.isInteger(endN) || endN < 2) {
          return setError(`Subject "${label}": End row must be ≥ 2.`)
        }
      }
      if (startN !== null && endN !== null && endN < startN) {
        return setError(`Subject "${label}": End row must be ≥ Start row.`)
      }
      cleanedConfig[sid] = {
        tabName: conf.tabName.trim() || null,
        startRow: startN,
        endRow: endN,
      }
    }

    setSubmitting(true)
    try {
      const cleanColumnMappings = Object.fromEntries(
        Object.entries(columnMappings)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      )

      const { rows, warnings: extractWarnings } =
        await extractExamQuestionTopicsFromFile(file, {
          subjectConfig: cleanedConfig,
          columnMappings: cleanColumnMappings,
        })

      if (!rows.length) {
        throw new Error(
          'No usable rows found. Check per-subject tab names + ranges and column mappings.',
        )
      }

      const response = await intUploadApi.examQuestionTopics({
        examid: selectedExam.id,
        fileName: file.name,
        rows,
      })

      setResult({ ...response, extractWarnings })
      onUploaded?.({
        type: 'examquestiontopics',
        fileName: file.name,
        ...response,
        status: 'SUCCESS',
      })
    } catch (err) {
      setError(err.message || 'Upload failed.')
      onUploaded?.({
        type: 'examquestiontopics',
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
  const selectCls = inputCls

  const subjectIds = Object.keys(subjectConfig)

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">Upload Question Topics</h2>
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
          {/* Step 1 — filters */}
          <section className="rounded-md border border-amber-200 bg-amber-50/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Step 1
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Select the exam</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Branch
                <select
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value)
                    setStreamId('')
                    setYearId('')
                    setExamId('')
                  }}
                  disabled={submitting}
                  className={selectCls}
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Stream
                <select
                  value={streamId}
                  onChange={(e) => {
                    setStreamId(e.target.value)
                    setYearId('')
                    setExamId('')
                  }}
                  disabled={submitting}
                  className={selectCls}
                >
                  <option value="">All streams</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Year
                <select
                  value={yearId}
                  onChange={(e) => {
                    setYearId(e.target.value)
                    setExamId('')
                  }}
                  disabled={submitting}
                  className={selectCls}
                >
                  <option value="">All years</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.yearname}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Exam
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  disabled={submitting || loadingFilters || !exams.length}
                  className={selectCls}
                >
                  <option value="">
                    {loadingFilters
                      ? 'Loading exams…'
                      : exams.length
                        ? 'Choose an exam…'
                        : 'No exams match filters'}
                  </option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.examname} ({ex.examdate})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedExam ? (
              <div className="mt-2 rounded border border-amber-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-700">
                <span className="font-semibold">{selectedExam.examname}</span> ·{' '}
                {selectedExam.totalquestions} total Qs · subjects:{' '}
                {Object.entries(selectedExam.subjects || {})
                  .map(([sid, c]) => `${subjectsById[sid]?.name || sid} (${c})`)
                  .join(', ')}
              </div>
            ) : null}
          </section>

          {/* Step 2 — file */}
          <section className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                Step 2
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Choose the workbook</h3>
            </div>
            <IntermediateFilePicker file={file} onFileChange={setFile} disabled={submitting} />
            <p className="mt-2 text-[11px] text-gray-500">
              One workbook holding every subject. You'll set the per-subject sheet/range below
              and the column layout (same across subjects) in Step 4.
            </p>
          </section>

          {/* Step 3 — per-subject ranges */}
          {selectedExam ? (
            <section className="space-y-3 rounded-md border border-brand-200 bg-brand-50/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-brand-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-900">
                    Step 3
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">Per-subject ranges</h3>
                </div>
                {subjectIds.length > 1 ? (
                  <button
                    type="button"
                    onClick={copyFirstSubjectMeta}
                    disabled={submitting}
                    className="rounded-md border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy 1st subject's tab/rows to all
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-gray-600">
                One block per subject in the exam. Specify which tab and which row range
                contains that subject's questions. Tab/rows can be the same or different per subject.
              </p>
              <div className="space-y-3">
                {subjectIds.map((sid) => {
                  const conf = subjectConfig[sid]
                  const qCount = selectedExam.subjects?.[sid] ?? 0
                  const displayName = subjectsById[sid]?.name || sid
                  return (
                    <div key={sid} className="rounded-md border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {displayName}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {qCount} questions
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                          Sheet / Tab name
                          <input
                            type="text"
                            value={conf.tabName}
                            onChange={(e) => setSubjectField(sid, 'tabName', e.target.value)}
                            disabled={submitting}
                            placeholder="Leave empty = first sheet"
                            className={inputCls}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                          Start row (Excel #)
                          <input
                            type="number"
                            min="2"
                            step="1"
                            value={conf.startRow}
                            onChange={(e) => setSubjectField(sid, 'startRow', e.target.value)}
                            disabled={submitting}
                            placeholder="2 = first data row"
                            className={inputCls}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                          End row (Excel #)
                          <input
                            type="number"
                            min="2"
                            step="1"
                            value={conf.endRow}
                            onChange={(e) => setSubjectField(sid, 'endRow', e.target.value)}
                            disabled={submitting}
                            placeholder="Empty = last row"
                            className={inputCls}
                          />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* Step 4 — global column mappings */}
          <section className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                Step 4
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Column mappings</h3>
            </div>
            <p className="mb-2 text-[11px] text-gray-600">
              Tell us <strong>which column</strong> each piece of data lives in — enter a
              column letter (<code>B</code>), number (<code>2</code>), or header name.
              Don't paste the values themselves. Same layout is assumed across every subject.
              Question numbers from the file (1, 2, 3 …) are stored as <code>"1"</code>,{' '}
              <code>"2"</code>, ….
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                Inserted: {result.inserted ?? 0} · Doc {result.created ? 'created' : 'updated'}
              </div>
              {result.skipped ? (
                <div className="text-xs text-emerald-900/80">
                  Skipped — in-file dups: {result.skipped.inFile ?? 0} · invalid:{' '}
                  {result.skipped.invalid ?? 0} · subject not found:{' '}
                  {result.skipped.subjectNotFound ?? 0}
                </div>
              ) : null}
              {result.warnings?.length ? (
                <details open className="text-xs">
                  <summary className="cursor-pointer font-medium text-amber-700">
                    {result.warnings.length} warning(s) — missing questions
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-amber-700">{w}</li>
                    ))}
                  </ul>
                </details>
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
            disabled={!selectedExam || !file || submitting}
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
