import { useEffect, useState } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { intSubjectsApi } from '../../../lib/intermediateApi.js'

const empty = () => ({
  examname: '',
  branchid: [],
  streamid: '',
  yearid: '',
  academicyearid: '',
  examtypeid: '',
  examdate: '',
  totalquestions: '',
})

export default function ExamFormModal({
  open,
  mode = 'create',
  initial = null,
  branches = [],
  streams = [],
  years = [],
  academicYears = [],
  examTypes = [],
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(empty)
  // subjectRows: [{ subjectId, count }]; keys are real Subjects collection IDs
  const [subjectRows, setSubjectRows] = useState([{ subjectId: '', count: '' }])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [subjectsError, setSubjectsError] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (initial) {
        const initBranch = initial.branchid
          ? (Array.isArray(initial.branchid) ? initial.branchid : [initial.branchid])
          : []
        setForm({
          examname: initial.examname || '',
          branchid: initBranch,
          streamid: initial.streamid || '',
          yearid: initial.yearid || '',
          academicyearid: initial.academicyearid || '',
          examtypeid: initial.examtypeid || '',
          examdate: initial.examdate || '',
          totalquestions: initial.totalquestions ?? '',
        })
        const subs = initial.subjects
          ? Object.entries(initial.subjects).map(([subjectId, count]) => ({
              subjectId,
              count,
            }))
          : [{ subjectId: '', count: '' }]
        setSubjectRows(subs.length ? subs : [{ subjectId: '', count: '' }])
      } else {
        setForm(empty())
        setSubjectRows([{ subjectId: '', count: '' }])
      }
      setError(null)
      setSubmitting(false)
      setAvailableSubjects([])
      setSubjectsError(null)
    }
  }, [open, initial])

  // Refetch subjects whenever streamid changes (subjects are mapped only to stream)
  useEffect(() => {
    if (!open) return
    if (!form.streamid) {
      setAvailableSubjects([])
      return
    }
    let cancelled = false
    setSubjectsLoading(true)
    setSubjectsError(null)
    intSubjectsApi
      .byStreamYear({ streamid: form.streamid })
      .then((res) => {
        if (cancelled) return
        setAvailableSubjects(res.items || [])
      })
      .catch((err) => {
        if (!cancelled) setSubjectsError(err.message || 'Failed to load subjects.')
      })
      .finally(() => {
        if (!cancelled) setSubjectsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, form.streamid])

  // Streams and Years are global now — no upstream-filtering applied.
  const filteredStreams = streams
  const filteredYears = years

  if (!open) return null

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const setSubject = (i, key, value) =>
    setSubjectRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
  const addSubject = () => setSubjectRows((prev) => [...prev, { subjectId: '', count: '' }])
  const removeSubject = (i) =>
    setSubjectRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  // IDs already picked in other rows — disable them in subsequent dropdowns to prevent duplicates
  const pickedIds = new Set(subjectRows.map((r) => r.subjectId).filter(Boolean))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.examname.trim()) return setError('Exam name is required.')
    if (!form.branchid.length) return setError('Select at least one branch.')
    if (!form.streamid) return setError('Stream is required.')
    if (!form.yearid) return setError('Year is required.')
    if (!form.academicyearid) return setError('Academic year is required.')
    if (!form.examtypeid) return setError('Exam type is required.')
    if (!form.examdate.trim()) return setError('Exam date is required.')
    const tq = Number(form.totalquestions)
    if (!Number.isInteger(tq) || tq <= 0) return setError('Total questions must be a positive integer.')

    const subjects = {}
    const seen = new Set()
    for (const row of subjectRows) {
      const sid = row.subjectId
      if (!sid) continue
      if (seen.has(sid)) return setError('A subject is selected more than once.')
      seen.add(sid)
      const c = Number(row.count)
      if (!Number.isInteger(c) || c <= 0) {
        const subj = availableSubjects.find((s) => s.id === sid)
        return setError(`Subject "${subj?.name || sid}": count must be a positive integer.`)
      }
      subjects[sid] = c
    }
    if (!Object.keys(subjects).length) {
      return setError('Add at least one subject with its question count.')
    }

    setError(null)
    setSubmitting(true)
    try {
      await onSubmit?.({
        examname: form.examname.trim(),
        branchid: form.branchid,
        streamid: form.streamid,
        yearid: form.yearid,
        academicyearid: form.academicyearid,
        examtypeid: form.examtypeid,
        examdate: form.examdate.trim(),
        totalquestions: tq,
        subjects,
      })
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls =
    'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">{mode === 'edit' ? 'Edit exam' : 'New exam'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700 sm:col-span-2">
            Exam name <span className="text-red-600">*</span>
            <input type="text" value={form.examname} onChange={(e) => setField('examname', e.target.value)} placeholder="e.g. Weekly Test 5" className={fieldCls} autoFocus />
          </label>
          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700 sm:col-span-2">
            Branches <span className="text-red-600">*</span>
            <div className="flex flex-wrap gap-2 rounded-md border border-gray-300 bg-white p-2 min-h-[36px]">
              {branches.map((b) => {
                const selected = form.branchid.includes(b.id)
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const updated = selected
                        ? form.branchid.filter((id) => id !== b.id)
                        : [...form.branchid, b.id]
                      setField('branchid', updated)
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {b.name}{b.code ? ` (${b.code})` : ''}
                  </button>
                )
              })}
              {!branches.length && <span className="text-[11px] text-gray-400">No branches available</span>}
            </div>
            {form.branchid.length > 0 && (
              <span className="text-[11px] text-gray-500">{form.branchid.length} branch{form.branchid.length > 1 ? 'es' : ''} selected</span>
            )}
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Stream <span className="text-red-600">*</span>
            <select
              value={form.streamid}
              onChange={(e) => {
                setField('streamid', e.target.value)
                setSubjectRows([{ subjectId: '', count: '' }])
              }}
              disabled={!form.branchid.length}
              className={fieldCls}
            >
              <option value="">— select —</option>
              {filteredStreams.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Year <span className="text-red-600">*</span>
            <select
              value={form.yearid}
              onChange={(e) => {
                setField('yearid', e.target.value)
              }}
              disabled={!form.streamid}
              className={fieldCls}
            >
              <option value="">— select —</option>
              {filteredYears.map((y) => (
                <option key={y.id} value={y.id}>{y.yearname}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Academic year <span className="text-red-600">*</span>
            <select value={form.academicyearid} onChange={(e) => setField('academicyearid', e.target.value)} className={fieldCls}>
              <option value="">— select —</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Exam type <span className="text-red-600">*</span>
            <select value={form.examtypeid} onChange={(e) => setField('examtypeid', e.target.value)} className={fieldCls}>
              <option value="">— select —</option>
              {examTypes.map((et) => (
                <option key={et.id} value={et.id}>{et.name}</option>
              ))}
            </select>
            {!examTypes.length ? (
              <span className="text-[11px] text-amber-700">
                No exam types defined yet — create some in <em>Exams → Exam Types</em>.
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Exam date <span className="text-red-600">*</span>
            <input type="date" value={form.examdate} onChange={(e) => setField('examdate', e.target.value)} className={fieldCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Total questions <span className="text-red-600">*</span>
            <input type="number" min="1" step="1" value={form.totalquestions} onChange={(e) => setField('totalquestions', e.target.value)} className={fieldCls} />
          </label>

          <div className="sm:col-span-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Subjects &amp; question counts</h3>
                <p className="text-[11px] text-gray-500">
                  Pick from subjects defined for the selected stream. Sum should equal total questions.
                </p>
              </div>
              <button
                type="button"
                onClick={addSubject}
                disabled={!form.streamid || !availableSubjects.length}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Add subject
              </button>
            </div>

            {!form.streamid ? (
              <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                Pick a stream first to load available subjects.
              </div>
            ) : subjectsLoading ? (
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading subjects…
              </div>
            ) : subjectsError ? (
              <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
                {subjectsError}
              </div>
            ) : !availableSubjects.length ? (
              <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                No subjects defined for this stream yet. Create them in <em>Exams → Subjects</em> first.
              </div>
            ) : (
              <div className="space-y-2">
                {subjectRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
                    <select
                      value={row.subjectId}
                      onChange={(e) => setSubject(i, 'subjectId', e.target.value)}
                      className={fieldCls}
                    >
                      <option value="">— select subject —</option>
                      {availableSubjects.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={pickedIds.has(s.id) && row.subjectId !== s.id}
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.count}
                      onChange={(e) => setSubject(i, 'count', e.target.value)}
                      placeholder="# questions"
                      className={fieldCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeSubject(i)}
                      disabled={subjectRows.length <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error ? <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'edit' ? 'Save changes' : 'Create exam'}
          </button>
        </footer>
      </form>
    </div>
  )
}
