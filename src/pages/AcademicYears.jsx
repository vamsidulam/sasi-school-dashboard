import { useState, useEffect } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import ObjectiveAcademicYears from '../components/intermediate-pages/IntermediateAcademicYears.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { academicYearsApi as schoolAcademicYearsApi } from '../lib/sasiApi.js'
import { academicYearsApi as intermediateAcademicYearsApi } from '../lib/intermediateboardApi.js'

function AcademicYearFormModal({ open, mode, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial?.name || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setError(null)
    }
  }, [open, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Name is required.')
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim() })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {mode === 'edit' ? 'Edit Academic Year' : 'New Academic Year'}
        </h3>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Academic Year Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., 2025-2026"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} disabled={submitting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SchoolAcademicYears({ api = schoolAcademicYearsApi, label = 'School' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listAll()
      setItems(res.items || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await api.update(editing.id, values)
      setItems((prev) => prev.map((item) => (item.id === editing.id ? updated : item)))
    } else {
      const created = await api.create(values)
      setItems((prev) => [created, ...prev])
    }
    setFormMode(null)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.remove(deleting.id)
    setItems((prev) => prev.filter((item) => item.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{label} Academic Years</h2>
          <p className="text-sm text-gray-500">Manage academic year periods for school programs.</p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setFormMode('create') }}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New Academic Year
        </button>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load.'}
            <button type="button" onClick={loadData} className="ml-2 underline hover:no-underline">Retry</button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading academic years…" />
        ) : items.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            No academic years yet. Click "New Academic Year" to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((ay) => (
                  <tr key={ay.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{ay.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => { setEditing(ay); setFormMode('edit') }}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button type="button" onClick={() => setDeleting(ay)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AcademicYearFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={() => { setFormMode(null); setEditing(null) }}
        onSubmit={handleSubmit}
      />

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleting(null)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete Academic Year</h3>
            <p className="mb-4 text-sm text-gray-600">
              Delete <span className="font-semibold">{deleting.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AcademicYears() {
  const [tab, setTab] = useState('school')
  return (
    <div className="space-y-6">
      {/* <header>
        <h1 className="text-xl font-semibold text-gray-900">Academic Years</h1>
        <p className="text-sm text-gray-500">
          Manage school, intermediate, and objective academic year ranges.
        </p>
      </header> */}
      <SchoolIntermediateTabs active={tab} onChange={setTab} />
      {tab === 'school' && <SchoolAcademicYears api={schoolAcademicYearsApi} label="School" />}
      {tab === 'intermediate' && <SchoolAcademicYears api={intermediateAcademicYearsApi} label="Intermediate" />}
      {tab === 'objective' && <ObjectiveAcademicYears />}
    </div>
  )
}
