import { useState, useEffect } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner.jsx'
import { subjectsApi as defaultSubjectsApi, classStandardsApi as defaultClassStandardsApi, classStandardSubjectsApi as defaultClassStandardSubjectsApi, programsApi as defaultProgramsApi } from '../../lib/sasiApi.js'
import { usePaginatedList } from '../../lib/usePaginatedList.js'
import { fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'

function SubjectFormModal({ open, mode, initial, classStandards, programs, onClose, onSubmit, classStandardSubjectsApi }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classStandardMappings: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [originalMappings, setOriginalMappings] = useState([])

  useEffect(() => {
    if (!open) return
    setError(null)

    if (mode === 'edit' && initial) {
      setLoadingMappings(true)
      setFormData({
        name: initial.name || '',
        code: initial.code || '',
        classStandardMappings: [],
      })

      // Load existing class standard mappings for this subject
      const loadMappings = async () => {
        try {
          const allMappings = []
          for (const cs of classStandards) {
            const res = await classStandardSubjectsApi.listByClassStandard(cs.id)
            const items = res.items || []
            const match = items.find((m) => m.subjectId === initial.id)
            if (match) {
              allMappings.push({
                classStandardId: cs.id,
                mappingId: match.id,
              })
            }
          }
          setFormData((prev) => ({ ...prev, classStandardMappings: allMappings }))
          setOriginalMappings(allMappings)
        } catch (err) {
          console.error('Failed to load class standard mappings:', err)
        } finally {
          setLoadingMappings(false)
        }
      }
      loadMappings()
    } else {
      setFormData({ name: '', code: '', classStandardMappings: [] })
      setOriginalMappings([])
      setLoadingMappings(false)
    }
  }, [open, initial, mode, classStandards])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleClassStandard = (classStandardId) => {
    setFormData((prev) => {
      const exists = prev.classStandardMappings.find((m) => m.classStandardId === classStandardId)
      if (exists) {
        return {
          ...prev,
          classStandardMappings: prev.classStandardMappings.filter((m) => m.classStandardId !== classStandardId),
        }
      } else {
        return {
          ...prev,
          classStandardMappings: [...prev.classStandardMappings, { classStandardId }],
        }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return setError('Subject name is required.')
    if (!formData.code.trim()) return setError('Subject code is required.')

    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        _originalMappings: mode === 'edit' ? originalMappings : [],
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  // Group class standards by program
  const grouped = classStandards.reduce((acc, cs) => {
    if (!acc[cs.programId]) acc[cs.programId] = []
    acc[cs.programId].push(cs)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Subject' : 'New Subject'}
          </h3>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., English, Mathematics"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="e.g., ENG, MAT"
                maxLength={10}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-500">Short code (will be uppercased automatically)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Class Standards
              </label>
              {loadingMappings ? (
                <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading mappings…
                </div>
              ) : classStandards.length === 0 ? (
                <p className="text-sm text-gray-500">No class standards available. Create them first.</p>
              ) : (
                <div className="space-y-4 rounded-md border border-gray-200 p-3 max-h-64 overflow-y-auto">
                  {Object.entries(grouped).map(([programId, items]) => {
                    const program = programs.find((p) => p.id === programId)
                    return (
                      <div key={programId}>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          {program?.name || 'Unknown Program'}
                        </div>
                        <div className="space-y-2">
                          {items.map((cs) => {
                            const mapping = formData.classStandardMappings.find((m) => m.classStandardId === cs.id)
                            const isSelected = !!mapping

                            return (
                              <div
                                key={cs.id}
                                className={`rounded-md border p-2 ${
                                  isSelected ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white'
                                }`}
                              >
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleClassStandard(cs.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                  />
                                  <span className="text-sm font-medium text-gray-900">
                                    {cs.standardName}
                                  </span>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Select which class standards this subject belongs to.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
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

function ConfirmDeleteDialog({ open, subject, onCancel, onConfirm }) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  if (!open || !subject) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete Subject</h3>
        <p className="mb-4 text-sm text-gray-600">
          Delete <span className="font-semibold">{subject.name}</span> ({subject.code})? This cannot be undone.
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

function SubjectsTable({ subjects, subjectMappings, classStandards, programs, onEdit, onDelete }) {
  if (!subjects.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No subjects yet. Click "New Subject" to create one.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-3 py-2 font-semibold">Code</th>
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold">Assigned Class Standards</th>
            <th className="px-3 py-2 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {subjects.map((subject) => {
            const mappings = subjectMappings[subject.id] || []
            return (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center rounded-md bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                    {subject.code}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-gray-900">{subject.name}</td>
                <td className="px-3 py-2">
                  {mappings.length === 0 ? (
                    <span className="text-xs text-gray-400">Not assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {mappings.map((m) => {
                        const cs = classStandards.find((c) => c.id === m.classStandardId)
                        return (
                          <span
                            key={m.id}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {cs?.standardName || '?'}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button type="button" onClick={() => onEdit(subject)}
                    className="mr-2 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => onDelete(subject)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function SubjectsPanel({ subjectsApi = defaultSubjectsApi, classStandardsApi = defaultClassStandardsApi, classStandardSubjectsApi = defaultClassStandardSubjectsApi, programsApi = defaultProgramsApi, fetchAll = defaultFetchAll }) {
  const {
    items: subjects,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    addItem,
    replaceItem,
    removeItem,
  } = usePaginatedList(subjectsApi)

  const [classStandards, setClassStandards] = useState([])
  const [programs, setPrograms] = useState([])
  const [subjectMappings, setSubjectMappings] = useState({})
  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [csData, programsData] = await Promise.all([
          fetchAll(classStandardsApi),
          fetchAll(programsApi),
        ])
        setClassStandards(csData)
        setPrograms(programsData)
      } catch (err) {
        console.error('Failed to load class standards/programs:', err)
      }
    }
    loadData()
  }, [])

  // Load all mappings when subjects or classStandards change
  useEffect(() => {
    if (!classStandards.length || !subjects.length) return
    const loadAllMappings = async () => {
      try {
        const mappingsMap = {}
        for (const cs of classStandards) {
          const res = await classStandardSubjectsApi.listByClassStandard(cs.id)
          const items = res.items || []
          for (const item of items) {
            if (!mappingsMap[item.subjectId]) mappingsMap[item.subjectId] = []
            mappingsMap[item.subjectId].push(item)
          }
        }
        setSubjectMappings(mappingsMap)
      } catch (err) {
        console.error('Failed to load subject mappings:', err)
      }
    }
    loadAllMappings()
  }, [classStandards, subjects])

  const openCreate = () => {
    setEditing(null)
    setFormMode('create')
  }

  const openEdit = (subject) => {
    setEditing(subject)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditing(null)
  }

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      // Update subject name/code
      const updated = await subjectsApi.update(editing.id, {
        name: values.name,
        code: values.code,
      })
      replaceItem(editing.id, updated)

      // Sync class standard mappings
      const oldMappings = values._originalMappings || []
      const newMappings = values.classStandardMappings || []

      // Removed mappings
      for (const old of oldMappings) {
        const stillExists = newMappings.find((m) => m.classStandardId === old.classStandardId)
        if (!stillExists && old.mappingId) {
          await classStandardSubjectsApi.remove(old.mappingId)
        }
      }

      // Added mappings
      for (const mapping of newMappings) {
        const existing = oldMappings.find((m) => m.classStandardId === mapping.classStandardId)
        if (!existing) {
          await classStandardSubjectsApi.create({
            classStandardId: mapping.classStandardId,
            subjectId: editing.id,
          })
        }
      }
    } else {
      // Create with class standard mappings
      if (values.classStandardMappings && values.classStandardMappings.length > 0) {
        const result = await subjectsApi.createWithClassStandards({
          name: values.name,
          code: values.code,
          classStandardMappings: values.classStandardMappings,
        })
        addItem(result.subject)
      } else {
        const created = await subjectsApi.create({
          name: values.name,
          code: values.code,
        })
        addItem(created)
      }
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await subjectsApi.remove(deleting.id)
    removeItem(deleting.id)
    setDeleting(null)
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Master Subject Catalog</h3>
          <p className="text-xs text-gray-500">{subjects.length} subjects loaded</p>
        </div>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New Subject
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load subjects.'}
          <button type="button" onClick={refresh} className="ml-2 underline hover:no-underline">Retry</button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading subjects…" />
      ) : (
        <>
          <SubjectsTable
            subjects={subjects}
            subjectMappings={subjectMappings}
            classStandards={classStandards}
            programs={programs}
            onEdit={openEdit}
            onDelete={(s) => setDeleting(s)}
          />
          {hasMore ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={loadMore} disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}

      <SubjectFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        classStandards={classStandards}
        programs={programs}
        onClose={closeForm}
        onSubmit={handleSubmit}
        classStandardSubjectsApi={classStandardSubjectsApi}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        subject={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
