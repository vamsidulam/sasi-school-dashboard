import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, UploadCloud } from 'lucide-react'
import IntermediateFilePicker from './IntermediateFilePicker.jsx'
import { extractExamResultsFromFile } from './extractIntermediateFile.js'
import {
  intUploadApi,
  intBranchesApi,
  intStreamsApi,
  intYearsApi,
  intExamsApi,
  intSubjectsApi,
} from '../../lib/intermediateApi.js'

function emptyQuestionMap(count) {
  const out = {}
  for (let i = 1; i <= count; i++) out[String(i)] = ''
  return out
}

// Convert a column ref to a 1-based integer index.
//   "A" → 1, "B" → 2, ..., "Z" → 26, "AA" → 27
//   "2" → 2
//   anything else → NaN
function columnRefToIndex(ref) {
  const s = String(ref ?? '').trim()
  if (!s) return NaN
  if (/^[1-9]\d*$/.test(s)) return Number(s)
  if (/^[A-Za-z]{1,3}$/.test(s)) {
    const upper = s.toUpperCase()
    let idx = 0
    for (let i = 0; i < upper.length; i++) {
      idx = idx * 26 + (upper.charCodeAt(i) - 64)
    }
    return idx
  }
  return NaN
}

function buildSubjectMapping(subjects) {
  if (!subjects) return {}
  return Object.fromEntries(
    Object.entries(subjects).map(([name, count]) => [
      name,
      {
        tabName: '',
        studentLookupCol: '',
        startRow: '',
        endRow: '',
        type: 'range',
        from: '',
        to: '',
        questions: emptyQuestionMap(count),
      },
    ]),
  )
}

export default function IntermediateExamResultsUploadModal({ open, onClose, onUploaded }) {
  const [branchId, setBranchId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [yearId, setYearId] = useState('')
  const [examId, setExamId] = useState('')

  const [file, setFile] = useState(null)
  const [subjectMapping, setSubjectMapping] = useState({})
  // Map of subject ID → subject doc, used so we can show names instead of raw IDs
  const [subjectsById, setSubjectsById] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const [branches, setBranches] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])
  const [exams, setExams] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Branches load once on open
  useEffect(() => {
    if (!open) return
    let cancelled = false
    intBranchesApi
      .listAll()
      .then((res) => !cancelled && setBranches(res.items || []))
      .catch((err) => {
        if (!cancelled) console.warn('[ExamResults] branches load:', err.message)
      })
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
      .catch((err) => {
        if (!cancelled) console.warn('[ExamResults] streams load:', err.message)
      })
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
      .catch((err) => {
        if (!cancelled) console.warn('[ExamResults] years load:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  // Exams load when any filter changes
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
      .catch((err) => {
        if (!cancelled) console.warn('[ExamResults] exams load:', err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, branchId, streamId, yearId])

  // No further filtering needed — API already filters
  const filteredStreams = streams
  const filteredYears = years
  const filteredExams = exams

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === examId) || null,
    [exams, examId],
  )

  useEffect(() => {
    if (!open) {
      setBranchId('')
      setStreamId('')
      setYearId('')
      setExamId('')
      setFile(null)
      setSubjectMapping({})
      setSubmitting(false)
      setError(null)
      setResult(null)
    }
  }, [open])

  // When an exam is selected, fetch the subject docs so we can show their names
  // in Step 3 instead of raw IDs.
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
      .catch((err) => {
        if (!cancelled) console.warn('[ExamResults] subjects load:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [selectedExam])

  useEffect(() => {
    if (selectedExam) {
      setSubjectMapping(buildSubjectMapping(selectedExam.subjects))
    } else {
      setSubjectMapping({})
    }
  }, [selectedExam])

  if (!open) return null

  const setSubject = (name, patch) =>
    setSubjectMapping((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...patch },
    }))

  const setSubjectQuestion = (name, qKey, value) =>
    setSubjectMapping((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        questions: { ...prev[name].questions, [qKey]: value },
      },
    }))

  const copyFirstSubjectMeta = () => {
    const names = Object.keys(subjectMapping)
    if (names.length < 2) return
    const first = subjectMapping[names[0]]
    setSubjectMapping((prev) => {
      const out = { ...prev }
      for (const n of names.slice(1)) {
        out[n] = {
          ...out[n],
          tabName: first.tabName,
          studentLookupCol: first.studentLookupCol,
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
    if (!selectedExam) {
      setError('Select an exam first.')
      return
    }
    if (!file) {
      setError('Pick an Exam Results file before uploading.')
      return
    }

    const cleanedSubjects = {}
    const examSubjects = selectedExam.subjects || {}
    for (const [sid, conf] of Object.entries(subjectMapping)) {
      const label = subjectsById[sid]?.name || sid
      if (!conf.studentLookupCol.trim()) {
        setError(`Subject "${label}": student lookup column is required.`)
        return
      }
      let startN = null
      let endN = null
      if (conf.startRow && String(conf.startRow).trim()) {
        startN = Number(conf.startRow)
        if (!Number.isInteger(startN) || startN < 2) {
          setError(`Subject "${label}": Start row must be ≥ 2 (row 1 is header).`)
          return
        }
      }
      if (conf.endRow && String(conf.endRow).trim()) {
        endN = Number(conf.endRow)
        if (!Number.isInteger(endN) || endN < 2) {
          setError(`Subject "${label}": End row must be ≥ 2.`)
          return
        }
      }
      if (startN !== null && endN !== null && endN < startN) {
        setError(`Subject "${label}": End row must be ≥ Start row.`)
        return
      }

      const base = {
        tabName: conf.tabName.trim() || null,
        studentLookupCol: conf.studentLookupCol.trim(),
        startRow: startN,
        endRow: endN,
      }

      if (conf.type === 'range') {
        const fromN = columnRefToIndex(conf.from)
        const toN = columnRefToIndex(conf.to)
        if (!Number.isInteger(fromN) || fromN < 1) {
          setError(`Subject "${label}": From column must be a letter (A, B, …) or a positive number.`)
          return
        }
        if (!Number.isInteger(toN) || toN < 1) {
          setError(`Subject "${label}": To column must be a letter (A, B, …) or a positive number.`)
          return
        }
        if (toN < fromN) {
          setError(`Subject "${label}": To column must be at or after From column.`)
          return
        }
        const span = toN - fromN + 1
        const expected = examSubjects[sid]
        if (expected && span !== expected) {
          setError(
            `Subject "${label}": range covers ${span} columns but ${expected} questions are defined.`,
          )
          return
        }
        cleanedSubjects[sid] = {
          ...base,
          type: 'range',
          from: fromN,
          to: toN,
        }
      } else {
        const qs = {}
        for (const [qKey, v] of Object.entries(conf.questions)) {
          if (!String(v).trim()) {
            setError(`Subject "${label}": column for Q${qKey} is missing.`)
            return
          }
          qs[qKey] = String(v).trim()
        }
        cleanedSubjects[sid] = { ...base, type: 'per-question', questions: qs }
      }
    }

    setSubmitting(true)
    try {
      const { results, warnings } = await extractExamResultsFromFile(file, {
        examSubjects: selectedExam.subjects || {},
        subjectConfig: cleanedSubjects,
      })

      if (!results.length) {
        throw new Error(
          'No usable rows found. Check tab names, lookup column, and that rows have student codes.',
        )
      }

      const payload = {
        examid: selectedExam.id,
        branchid: selectedExam.branchid,
        streamid: selectedExam.streamid,
        yearid: selectedExam.yearid,
        academicyearid: selectedExam.academicyearid,
        fileName: file.name,
        results,
      }

      const response = await intUploadApi.examResults(payload)

      setResult({ ...response, warnings })
      onUploaded?.({
        type: 'examresults',
        fileName: file.name,
        ...response,
        status: 'SUCCESS',
      })
    } catch (err) {
      setError(err.message || 'Upload failed.')
      onUploaded?.({
        type: 'examresults',
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

  const subjectNames = Object.keys(subjectMapping)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="examresults-upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2
            id="examresults-upload-modal-title"
            className="text-base font-semibold text-gray-900"
          >
            Upload Exam Results
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
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
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
                  {filteredStreams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
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
                  {filteredYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.yearname}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Exam
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  disabled={submitting || loadingFilters || !filteredExams.length}
                  className={selectCls}
                >
                  <option value="">
                    {loadingFilters
                      ? 'Loading exams…'
                      : filteredExams.length
                        ? 'Choose an exam…'
                        : 'No exams match filters'}
                  </option>
                  {filteredExams.map((ex) => (
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
                {Object.entries(selectedExam.subjects)
                  .map(([sid, c]) => `${subjectsById[sid]?.name || sid} (${c})`)
                  .join(', ')}
              </div>
            ) : null}
          </section>

          <section className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                Step 2
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Choose the workbook</h3>
            </div>
            <IntermediateFilePicker
              file={file}
              onFileChange={setFile}
              disabled={submitting}
            />
            <p className="mt-2 text-[11px] text-gray-500">
              One file holding every subject. You'll set per-subject sheet name, student
              lookup column, and row count in the next step.
            </p>
          </section>

          {selectedExam ? (
            <section className="space-y-3 rounded-md border border-brand-200 bg-brand-50/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-brand-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-900">
                    Step 3
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">Per-subject mapping</h3>
                </div>
                {subjectNames.length > 1 ? (
                  <button
                    type="button"
                    onClick={copyFirstSubjectMeta}
                    disabled={submitting}
                    className="rounded-md border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy 1st subject's tab/lookup/rows to all
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-gray-600">
                Each subject can come from a different sheet, with its own student lookup column
                and row count. The answer-column mapping is either a contiguous{' '}
                <strong>range</strong> or one column <strong>per question</strong>.
              </p>
              <div className="space-y-3">
                {subjectNames.map((name) => {
                  const conf = subjectMapping[name]
                  const qCount = Object.keys(conf.questions).length
                  const displayName = subjectsById[name]?.name || name
                  return (
                    <div
                      key={name}
                      className="rounded-md border border-gray-200 bg-white p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {displayName}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                            {qCount} questions
                          </span>
                        </div>
                        <div className="flex gap-1 rounded border border-gray-200 bg-gray-50 p-0.5">
                          {['range', 'per-question'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSubject(name, { type: t })}
                              disabled={submitting}
                              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                                conf.type === t
                                  ? 'bg-brand-600 text-white'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {t === 'range' ? 'Range' : 'Per question'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                          Sheet / Tab name
                          <input
                            type="text"
                            value={conf.tabName}
                            onChange={(e) =>
                              setSubject(name, { tabName: e.target.value })
                            }
                            disabled={submitting}
                            placeholder="Leave empty = first sheet"
                            className={inputCls}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                          Student lookup column <span className="text-red-600">*</span>
                          <input
                            type="text"
                            value={conf.studentLookupCol}
                            onChange={(e) =>
                              setSubject(name, { studentLookupCol: e.target.value })
                            }
                            disabled={submitting}
                            placeholder="e.g. A or Roll No"
                            className={inputCls}
                          />
                        </label>
                      </div>
                      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                          Start row (Excel #)
                          <input
                            type="number"
                            min="2"
                            step="1"
                            value={conf.startRow}
                            onChange={(e) =>
                              setSubject(name, { startRow: e.target.value })
                            }
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
                            onChange={(e) =>
                              setSubject(name, { endRow: e.target.value })
                            }
                            disabled={submitting}
                            placeholder="Empty = last row"
                            className={inputCls}
                          />
                        </label>
                      </div>

                      {conf.type === 'range' ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                            From column
                            <input
                              type="text"
                              value={conf.from}
                              onChange={(e) =>
                                setSubject(name, { from: e.target.value })
                              }
                              disabled={submitting}
                              placeholder="e.g. B (where q1 starts)"
                              className={inputCls}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                            To column
                            <input
                              type="text"
                              value={conf.to}
                              onChange={(e) =>
                                setSubject(name, { to: e.target.value })
                              }
                              disabled={submitting}
                              placeholder={`needs to cover ${qCount} questions`}
                              className={inputCls}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                          {Object.entries(conf.questions).map(([qKey, val]) => (
                            <label
                              key={qKey}
                              className="flex flex-col gap-1 text-[11px] font-medium text-gray-700"
                            >
                              <span className="uppercase tracking-wide">Q{qKey}</span>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  setSubjectQuestion(name, qKey, e.target.value)
                                }
                                disabled={submitting}
                                placeholder="col"
                                className={inputCls}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <div className="font-medium">
                Inserted: {result.inserted ?? 0}
              </div>
              {result.skipped ? (
                <div className="text-xs text-emerald-900/80">
                  Skipped — in-file dups: {result.skipped.inFile ?? 0} · already in DB:{' '}
                  {result.skipped.inDb ?? 0} · student not found:{' '}
                  {result.skipped.studentNotFound ?? 0} · invalid:{' '}
                  {result.skipped.invalid ?? 0}
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
                        row {e.rowIndex}
                        {e.studentCode ? ` (${e.studentCode})` : ''}: {e.message}
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
            onClick={handleSubmit}
            disabled={!selectedExam || !file || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </footer>
      </div>
    </div>
  )
}
