import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import BranchesInput from './BranchesInput.jsx'
import { programsApi as defaultProgramsApi, branchesApi as defaultBranchesApi, academicYearsApi as defaultAcademicYearsApi, fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'

const emptyForm = () => ({
  name: '',
  programId: '',
  academicYearId: '',
  branches: [],
})

export default function ExamFormModal({ open, mode = 'create', initial = null, onClose, onSubmit, programsApiRef, branchesApiRef, academicYearsApiRef, fetchAllFn }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [programOptions, setProgramOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [academicYearOptions, setAcademicYearOptions] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name || '',
              programId: initial.programId || '',
              academicYearId: initial.academicYearId || '',
              branches: [...(initial.branches || [])],
            }
          : emptyForm(),
      )
      setError(null)
      setSubmitting(false)
    }
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setOptionsLoading(true)
    const _fetchAll = fetchAllFn || defaultFetchAll
    const _programsApi = programsApiRef || defaultProgramsApi
    const _branchesApi = branchesApiRef || defaultBranchesApi
    const _academicYearsApi = academicYearsApiRef || defaultAcademicYearsApi
    Promise.all([_fetchAll(_programsApi), _fetchAll(_branchesApi), _academicYearsApi.listAll()])
      .then(([progs, brs, ayRes]) => {
        if (cancelled) return
        setProgramOptions(progs)
        setBranchOptions(brs)
        setAcademicYearOptions(ayRes.items || [])
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[ExamFormModal] failed to load options:', err.message)
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, programsApiRef, branchesApiRef, academicYearsApiRef, fetchAllFn])

  if (!open) return null

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Exam name is required.')
    if (!form.programId) return setError('Program is required.')
    if (!form.academicYearId) return setError('Academic year is required.')
    if (!form.branches.length) return setError('Add at least one branch.')
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit?.({
        name: form.name.trim(),
        programId: form.programId,
        academicYearId: form.academicYearId,
        branches: form.branches,
      })
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="exam-modal-title" className="text-base font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit exam' : 'New exam'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Exam Name <span className="text-red-500">*</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Mid Term, Final Exam"
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
          </label>

          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Program <span className="text-red-500">*</span>
            <select
              value={form.programId}
              onChange={(e) => setField('programId', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">{optionsLoading ? 'Loading…' : 'Select program...'}</option>
              {programOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Academic Year <span className="text-red-500">*</span>
            <select
              value={form.academicYearId}
              onChange={(e) => setField('academicYearId', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">{optionsLoading ? 'Loading…' : 'Select academic year...'}</option>
              {academicYearOptions.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Branches <span className="text-red-500">*</span>
            <BranchesInput
              branches={form.branches}
              onChange={(branches) => setField('branches', branches)}
              suggestions={branchOptions}
            />
            <span className="text-[11px] font-normal text-gray-500">
              {optionsLoading
                ? 'Loading branches…'
                : 'Type to search and click a suggestion, or press Enter to add custom. × to remove.'}
            </span>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'edit' ? 'Save changes' : 'Create exam'}
          </button>
        </footer>
      </form>
    </div>
  )
}
