import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import SchoolCollegeToggle from './SchoolCollegeToggle.jsx'

const emptyForm = () => ({ standard: '', group: '', program: '', isCollege: false })

const inputCls =
  'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function ProgramFormModal({ open, mode = 'create', initial = null, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            standard: initial.standard || '',
            group: initial.group || '',
            program: initial.program || '',
            isCollege: Boolean(initial.isCollege),
          }
        : emptyForm(),
    )
    setError(null)
    setSubmitting(false)
  }, [open, initial])

  if (!open) return null

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleToggle = (isCollege) => {
    setForm((f) => ({
      ...f,
      isCollege,
      group: isCollege ? f.group : '',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.standard.trim()) return setError('Standard is required.')
    if (!form.program.trim()) return setError('Program is required.')
    if (form.isCollege && !form.group.trim()) {
      return setError('Group is required for college programs.')
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit?.({
        isCollege: form.isCollege,
        standard: form.standard.trim(),
        program: form.program.trim(),
        group: form.isCollege ? form.group.trim() : null,
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
      aria-labelledby="program-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="program-modal-title" className="text-base font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit program' : 'New program'}
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
          <div className="flex flex-col gap-2 text-xs font-medium text-gray-700">
            Type
            <SchoolCollegeToggle
              isCollege={form.isCollege}
              onChange={handleToggle}
            />
            <span className="text-[11px] font-normal text-gray-500">
              Toggle off for school, on for college.
            </span>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Class / Standard
            <input
              type="text"
              value={form.standard}
              onChange={(e) => setField('standard', e.target.value)}
              placeholder={form.isCollege ? 'e.g. B.Tech, M.Tech, MBA' : 'e.g. X, XII'}
              className={inputCls}
              autoFocus
            />
          </label>

          {form.isCollege ? (
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Group
              <input
                type="text"
                value={form.group}
                onChange={(e) => setField('group', e.target.value)}
                placeholder="e.g. CSE, ECE, Finance"
                className={inputCls}
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Program
            <input
              type="text"
              value={form.program}
              onChange={(e) => setField('program', e.target.value)}
              placeholder={form.isCollege ? 'e.g. B.Tech Computer Science' : 'e.g. Class 10 - CBSE'}
              className={inputCls}
            />
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
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'edit' ? 'Save changes' : 'Create program'}
          </button>
        </footer>
      </form>
    </div>
  )
}
