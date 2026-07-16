import { useState, useEffect } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner.jsx'
import { skillSubjectsApi as defaultSkillSubjectsApi } from '../../lib/sasiApi.js'

function SkillSubjectFormModal({ open, mode, initial, onClose, onSubmit }) {
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
          {mode === 'edit' ? 'Edit Skill Subject' : 'New Skill Subject'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Skill Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., SK MAT, SK SCI"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Skill subjects used in objective exams (e.g., SK MAT, SK SCI)
            </p>
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

function ConfirmDeleteDialog({ open, item, onCancel, onConfirm }) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  if (!open || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete Skill Subject</h3>
        <p className="mb-4 text-sm text-gray-600">
          Delete <span className="font-semibold">{item.name}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={deleting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SkillSubjectsPanel({ skillSubjectsApi = defaultSkillSubjectsApi }) {
  const [skillSubjects, setSkillSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await skillSubjectsApi.listAll()
      setSkillSubjects(res.items || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormMode('create')
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditing(null)
  }

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await skillSubjectsApi.update(editing.id, values)
      setSkillSubjects((prev) => prev.map((item) => (item.id === editing.id ? updated : item)))
    } else {
      const created = await skillSubjectsApi.create(values)
      setSkillSubjects((prev) => [...prev, created])
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await skillSubjectsApi.remove(deleting.id)
    setSkillSubjects((prev) => prev.filter((item) => item.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Skill Subjects</h3>
          <p className="text-xs text-gray-500">
            Manage skill subjects used in objective exams (e.g., SK MAT, SK SCI)
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New Skill Subject
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load skill subjects.'}
          <button type="button" onClick={loadData} className="ml-2 underline hover:no-underline">Retry</button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading skill subjects…" />
      ) : skillSubjects.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No skill subjects yet. Click "New Skill Subject" to create one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {skillSubjects.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => setDeleting(item)}
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

      <SkillSubjectFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        item={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
