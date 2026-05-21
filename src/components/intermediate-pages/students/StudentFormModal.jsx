import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const empty = () => ({
  code: '',
  name: '',
  phone: '',
  parentname: '',
  branchid: '',
  academicyearid: '',
  streamid: '',
  yearid: '',
})

export default function StudentFormModal({
  open,
  mode = 'create',
  initial = null,
  branches = [],
  academicYears = [],
  streams = [],
  years = [],
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              code: initial.code || '',
              name: initial.name || '',
              phone: initial.phone || '',
              parentname: initial.parentname || '',
              branchid: initial.branchid || '',
              academicyearid: initial.academicyearid || '',
              streamid: initial.streamid || '',
              yearid: initial.yearid || '',
            }
          : empty(),
      )
      setError(null)
      setSubmitting(false)
    }
  }, [open, initial])

  if (!open) return null

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) return setError('Student code is required.')
    setError(null)
    setSubmitting(true)
    try {
      const payload = { code: form.code.trim() }
      if (form.name.trim()) payload.name = form.name.trim()
      if (form.phone.trim()) payload.phone = form.phone.trim()
      if (form.parentname.trim()) payload.parentname = form.parentname.trim()
      if (form.branchid) payload.branchid = form.branchid
      if (form.academicyearid) payload.academicyearid = form.academicyearid
      if (form.streamid) payload.streamid = form.streamid
      if (form.yearid) payload.yearid = form.yearid
      await onSubmit?.(payload)
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls =
    'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit student' : 'New student'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Code <span className="text-red-600">*</span>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
              placeholder="e.g. INT2401001"
              className={fieldCls}
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="optional"
              className={fieldCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Phone
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="optional"
              className={fieldCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Parent name
            <input
              type="text"
              value={form.parentname}
              onChange={(e) => setField('parentname', e.target.value)}
              placeholder="optional"
              className={fieldCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Branch
            <select
              value={form.branchid}
              onChange={(e) => setField('branchid', e.target.value)}
              className={fieldCls}
            >
              <option value="">— none —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Academic year
            <select
              value={form.academicyearid}
              onChange={(e) => setField('academicyearid', e.target.value)}
              className={fieldCls}
            >
              <option value="">— none —</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Stream
            <select
              value={form.streamid}
              onChange={(e) => setField('streamid', e.target.value)}
              className={fieldCls}
            >
              <option value="">— none —</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Year
            <select
              value={form.yearid}
              onChange={(e) => setField('yearid', e.target.value)}
              className={fieldCls}
            >
              <option value="">— none —</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.yearname}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
            {mode === 'edit' ? 'Save changes' : 'Create student'}
          </button>
        </footer>
      </form>
    </div>
  )
}
