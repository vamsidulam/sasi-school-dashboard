import { useState, useEffect } from 'react'
import { Loader2, Plus, Pencil, Trash2, Layers } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner.jsx'
import { classStandardsApi as defaultClassStandardsApi, programsApi as defaultProgramsApi } from '../../lib/sasiApi.js'
import { fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'

function ClassStandardFormModal({ open, mode, initial, programs, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    programId: initial?.programId || '',
    standardName: initial?.standardName || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setFormData({
        programId: initial?.programId || '',
        standardName: initial?.standardName || '',
      })
      setError(null)
    }
  }, [open, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.programId.trim()) return setError('Program is required.')
    if (!formData.standardName.trim()) return setError('Standard name is required.')
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        programId: formData.programId,
        standardName: formData.standardName.trim(),
      }
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const selectedProgram = programs.find((p) => p.id === formData.programId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {mode === 'edit' ? 'Edit Class Standard' : 'New Class Standard'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Program <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.programId}
              onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
              required
              disabled={mode === 'edit'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">Select program...</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            {mode === 'edit' && (
              <p className="mt-1 text-xs text-gray-500">Program cannot be changed after creation</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Standard Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.standardName}
              onChange={(e) => setFormData({ ...formData, standardName: e.target.value })}
              required
              placeholder="e.g., LKG, UKG, 1, 2, 10, 11, 12"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Class level (e.g., LKG, UKG for kindergarten, 1-12 for grades)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteDialog({ open, classStandard, onCancel, onConfirm }) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  if (!open || !classStandard) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete Class Standard</h3>
        <p className="mb-4 text-sm text-gray-600">
          Delete <span className="font-semibold">{classStandard.standardName}</span>? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ClassStandardsTable({ classStandards, programs, onEdit, onDelete }) {
  if (!classStandards.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No class standards yet. Click "New Class Standard" to create one.
      </p>
    )
  }

  // Group by program
  const grouped = classStandards.reduce((acc, cs) => {
    const programId = cs.programId
    if (!acc[programId]) acc[programId] = []
    acc[programId].push(cs)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([programId, items]) => {
        const program = programs.find((p) => p.id === programId)
        const programName = program?.name || 'Unknown Program'

        return (
          <div key={programId} className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-gray-900">{programName}</h3>
                <span className="ml-auto text-xs text-gray-500">{items.length} class(es)</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Standard Name</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items
                    .sort((a, b) => a.standardName.localeCompare(b.standardName))
                    .map((cs) => (
                      <tr key={cs.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{cs.standardName}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(cs)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(cs)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ClassStandardsPanel({ classStandardsApi = defaultClassStandardsApi, programsApi = defaultProgramsApi, fetchAll = defaultFetchAll }) {
  const [classStandards, setClassStandards] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [programsData, classStandardsData] = await Promise.all([
        fetchAll(programsApi),
        fetchAll(classStandardsApi),
      ])
      setPrograms(programsData)
      setClassStandards(classStandardsData)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormMode('create')
  }

  const openEdit = (cs) => {
    setEditing(cs)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditing(null)
  }

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await classStandardsApi.update(editing.id, values)
      setClassStandards((prev) => prev.map((item) => (item.id === editing.id ? updated : item)))
    } else {
      const created = await classStandardsApi.create(values)
      setClassStandards((prev) => [...prev, created])
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await classStandardsApi.remove(deleting.id)
    setClassStandards((prev) => prev.filter((item) => item.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Class Standards</h3>
          <p className="text-xs text-gray-500">
            Define class levels for each program (e.g., LKG, UKG, 1-12)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={programs.length === 0}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Class Standard
        </button>
      </div>

      {programs.length === 0 && !loading ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Please create a program first before adding class standards.
        </div>
      ) : null}

      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load class standards.'}
          <button type="button" onClick={loadData} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading class standards…" />
      ) : (
        <ClassStandardsTable
          classStandards={classStandards}
          programs={programs}
          onEdit={openEdit}
          onDelete={(cs) => setDeleting(cs)}
        />
      )}

      <ClassStandardFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        programs={programs}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        classStandard={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
