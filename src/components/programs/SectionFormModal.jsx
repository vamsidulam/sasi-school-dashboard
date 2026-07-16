import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const emptyForm = () => ({
  programId: '',
  classStandardId: '',
  sectionAbbreviation: '',
  sectionName: '',
})

const inputCls =
  'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function SectionFormModal({
  open,
  mode = 'create',
  initial = null,
  programs = [],
  classStandards = [],
  programsLoading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        programId: initial.programId || '',
        classStandardId: initial.classStandardId || '',
        sectionAbbreviation: initial.sectionAbbreviation || '',
        sectionName: initial.sectionName || '',
      })
    } else {
      setForm(emptyForm())
    }
    setError(null)
    setSubmitting(false)
  }, [open, initial, mode])

  if (!open) return null

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // Filter class standards based on selected program
  const availableClassStandards = form.programId
    ? classStandards.filter((cs) => cs.programId === form.programId)
    : []

  // Auto-set programId when classStandardId changes
  const handleClassStandardChange = (classStandardId) => {
    const cs = classStandards.find((item) => item.id === classStandardId)
    setForm((f) => ({
      ...f,
      classStandardId,
      programId: cs?.programId || f.programId,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.programId) return setError('Program is required.')
    if (!form.classStandardId) return setError('Class standard is required.')
    if (!form.sectionAbbreviation.trim()) return setError('Section abbreviation is required.')
    if (!form.sectionName.trim()) return setError('Section name is required.')
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit?.({
        programId: form.programId,
        classStandardId: form.classStandardId,
        sectionAbbreviation: form.sectionAbbreviation.trim(),
        sectionName: form.sectionName.trim(),
      })
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProgram = programs.find((p) => p.id === form.programId)
  const selectedClassStandard = classStandards.find((cs) => cs.id === form.classStandardId)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="section-modal-title" className="text-base font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Section' : 'New Section'}
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

        <div className="space-y-4 px-5 py-4">
          {programs.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Please create a program first before adding sections.
            </div>
          ) : classStandards.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Please create class standards first before adding sections.
            </div>
          ) : null}

          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Program <span className="text-red-500">*</span>
            <select
              value={form.programId}
              onChange={(e) => setField('programId', e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Select program...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Class Standard <span className="text-red-500">*</span>
            <select
              value={form.classStandardId}
              onChange={(e) => handleClassStandardChange(e.target.value)}
              className={inputCls}
              required
              disabled={!form.programId}
            >
              <option value="">
                {form.programId ? 'Select class standard...' : 'Select program first'}
              </option>
              {availableClassStandards.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.standardName}
                </option>
              ))}
            </select>
            {form.programId && availableClassStandards.length === 0 ? (
              <p className="text-[11px] text-amber-600">
                No class standards found for this program. Create them first in the Class Standards tab.
              </p>
            ) : null}
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Section Abbreviation <span className="text-red-500">*</span>
            <input
              type="text"
              value={form.sectionAbbreviation}
              onChange={(e) => setField('sectionAbbreviation', e.target.value)}
              placeholder="e.g., SLK, SUK, S1, A, B"
              className={inputCls}
              required
            />
            <span className="text-[11px] font-normal text-gray-500">
              Short code for this section
            </span>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Section Name <span className="text-red-500">*</span>
            <input
              type="text"
              value={form.sectionName}
              onChange={(e) => setField('sectionName', e.target.value)}
              placeholder="e.g., State Lower Kindergarden, Section A"
              className={inputCls}
              required
            />
            <span className="text-[11px] font-normal text-gray-500">
              Full descriptive name for this section
            </span>
          </label>

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
            disabled={submitting || programs.length === 0 || classStandards.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'edit' ? 'Save Changes' : 'Create Section'}
          </button>
        </footer>
      </form>
    </div>
  )
}
