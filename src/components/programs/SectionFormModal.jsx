import { useEffect, useMemo, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const emptyForm = () => ({
  programId: '',
  programQuery: '',
  sectionAbbreviation: '',
  sectionName: '',
})

const inputCls =
  'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function SectionFormModal({
  open,
  initialProgram = null,
  programs = [],
  programsLoading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [programOpen, setProgramOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      initialProgram
        ? {
            programId: initialProgram.id,
            programQuery: initialProgram.program || '',
            sectionAbbreviation: '',
            sectionName: '',
          }
        : emptyForm(),
    )
    setError(null)
    setSubmitting(false)
  }, [open, initialProgram])

  const matches = useMemo(() => {
    const q = form.programQuery.trim().toLowerCase()
    if (!q) return programs.slice(0, 8)
    return programs
      .filter((p) => (p.program || '').toLowerCase().includes(q))
      .slice(0, 8)
  }, [form.programQuery, programs])

  if (!open) return null

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleProgramInput = (val) => {
    const match = programs.find(
      (p) => (p.program || '').toLowerCase() === val.trim().toLowerCase(),
    )
    setForm((f) => ({
      ...f,
      programQuery: val,
      programId: match?.id || '',
    }))
  }

  const selectProgram = (p) => {
    setForm((f) => ({ ...f, programQuery: p.program, programId: p.id }))
    setProgramOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.programId) return setError('Pick a program from the list.')
    if (!form.sectionAbbreviation.trim()) return setError('Abbreviation is required.')
    if (!form.sectionName.trim()) return setError('Section name is required.')
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit?.({
        programId: form.programId,
        sectionAbbreviation: form.sectionAbbreviation.trim(),
        sectionName: form.sectionName.trim(),
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
            New section
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
          <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Program
            <div className="relative">
              <input
                type="text"
                value={form.programQuery}
                onChange={(e) => handleProgramInput(e.target.value)}
                onFocus={() => setProgramOpen(true)}
                onBlur={() => setTimeout(() => setProgramOpen(false), 100)}
                placeholder="Type to search programs…"
                className={`${inputCls} w-full`}
                disabled={Boolean(initialProgram)}
              />
              {programOpen && matches.length > 0 && !initialProgram ? (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {programsLoading ? (
                    <li className="px-2.5 py-1.5 text-xs text-gray-500">Loading…</li>
                  ) : null}
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectProgram(p)
                        }}
                        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
                      >
                        <span className="text-gray-900">{p.program}</span>
                        <span className="text-[11px] text-gray-500">{p.standard}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Section abbreviation
            <input
              type="text"
              value={form.sectionAbbreviation}
              onChange={(e) => setField('sectionAbbreviation', e.target.value)}
              placeholder="e.g. A, B, C-1"
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            Section name
            <input
              type="text"
              value={form.sectionName}
              onChange={(e) => setField('sectionName', e.target.value)}
              placeholder="e.g. Section A - Morning batch"
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
            Create section
          </button>
        </footer>
      </form>
    </div>
  )
}
