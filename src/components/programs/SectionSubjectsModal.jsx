import { useEffect, useState } from 'react'
import { X, Loader2, Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { subjectsApi, sectionSubjectsApi } from '../../lib/sasiApi.js'

function AddSubjectForm({ section, allSubjects, onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    subjectId: '',
    maxMarks: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subjectId) {
      setError('Please select a subject')
      return
    }
    if (!formData.maxMarks || formData.maxMarks <= 0) {
      setError('Max marks must be greater than 0')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await onAdd(formData)
      setFormData({ subjectId: '', maxMarks: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-brand-600" />
        <h4 className="text-sm font-semibold text-gray-900">Add Subject to {section.sectionAbbreviation}</h4>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700">Subject</label>
          <select
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select subject...</option>
            {allSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Max Marks</label>
          <input
            type="number"
            value={formData.maxMarks}
            onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
            required
            min="1"
            placeholder="e.g., 50"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Add Subject
        </button>
      </div>
    </form>
  )
}

function EditSubjectForm({ mapping, onUpdate, onCancel }) {
  const [formData, setFormData] = useState({
    maxMarks: mapping.maxMarks,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.maxMarks || formData.maxMarks <= 0) {
      setError('Max marks must be greater than 0')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await onUpdate(mapping.id, formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-brand-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          Edit {mapping.subjectCode} - {mapping.subjectName}
        </h4>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700">Max Marks</label>
        <input
          type="number"
          value={formData.maxMarks}
          onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
          required
          min="1"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Update
        </button>
      </div>
    </form>
  )
}

export default function SectionSubjectsModal({ open, section, onClose }) {
  const [sectionSubjects, setSectionSubjects] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (!open || !section) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [subjectsRes, mappingsRes] = await Promise.all([
          subjectsApi.listAll(),
          sectionSubjectsApi.listBySection(section.id),
        ])
        setAllSubjects(subjectsRes.items || [])
        setSectionSubjects(mappingsRes.items || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, section])

  const handleAdd = async (formData) => {
    const created = await sectionSubjectsApi.create({
      sectionId: section.id,
      ...formData,
    })
    setSectionSubjects((prev) => [...prev, created])
    setShowAddForm(false)
  }

  const handleUpdate = async (id, formData) => {
    const updated = await sectionSubjectsApi.update(id, formData)
    setSectionSubjects((prev) => prev.map((item) => (item.id === id ? updated : item)))
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this subject from the section?')) return
    await sectionSubjectsApi.remove(id)
    setSectionSubjects((prev) => prev.filter((item) => item.id !== id))
  }

  if (!open || !section) return null

  const subjectCount = sectionSubjects.length

  // Filter out subjects already added
  const availableSubjects = allSubjects.filter(
    (subject) => !sectionSubjects.some((ss) => ss.subjectId === subject.id),
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BookOpen className="h-5 w-5 text-brand-600" />
              Manage Subjects - {section.sectionAbbreviation}
            </h2>
            <p className="text-sm text-gray-500">{section.sectionName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div>
            <div className="text-xs text-gray-500">Subject Count</div>
            <div className="text-lg font-semibold text-gray-900">{subjectCount}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Form */}
              {showAddForm ? (
                <AddSubjectForm
                  section={section}
                  allSubjects={availableSubjects}
                  onAdd={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Subject
                </button>
              )}

              {/* Subjects List */}
              {sectionSubjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No subjects assigned yet. Add subjects to this section with specific max marks.
                </div>
              ) : (
                <div className="space-y-2">
                  {sectionSubjects.map((mapping) =>
                    editingId === mapping.id ? (
                      <EditSubjectForm
                        key={mapping.id}
                        mapping={mapping}
                        onUpdate={handleUpdate}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-100 text-sm font-bold text-brand-700">
                            {mapping.subjectCode}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{mapping.subjectName}</div>
                            <div className="text-xs text-gray-500">
                              Max Marks: {mapping.maxMarks}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(mapping.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(mapping.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
