import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import LoadingSpinner from '../../LoadingSpinner.jsx'
import ConfirmDeleteDialog from '../../common/ConfirmDeleteDialog.jsx'
import ExamFormModal from './ExamFormModal.jsx'
import {
  intExamsApi,
  intBranchesApi,
  intStreamsApi,
  intYearsApi,
  intAcademicYearsApi,
  intSubjectsApi,
  intExamTypesApi,
} from '../../../lib/intermediateApi.js'

export default function ExamsPanel() {
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [subjectsById, setSubjectsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await intExamsApi.list()
      setItems(res.items || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    intBranchesApi.listAll().then((res) => setBranches(res.items || [])).catch(() => {})
    intStreamsApi.listAll().then((res) => setStreams(res.items || [])).catch(() => {})
    intYearsApi.listAll().then((res) => setYears(res.items || [])).catch(() => {})
    intAcademicYearsApi.listAll().then((res) => setAcademicYears(res.items || [])).catch(() => {})
    intExamTypesApi.listAll().then((res) => setExamTypes(res.items || [])).catch(() => {})
    // Build a flat id → subject map for label-rendering
    intSubjectsApi
      .list()
      .then((res) => {
        const map = {}
        for (const s of res.items || []) map[s.id] = s
        setSubjectsById(map)
      })
      .catch(() => {})
  }, [load])

  const lookup = (list, id) => list.find((x) => x.id === id)

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await intExamsApi.update(editing.id, values)
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const created = await intExamsApi.create(values)
      setItems((prev) => [created, ...prev])
    }
    setFormMode(null)
    setEditing(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await intExamsApi.remove(deleting.id)
    setItems((prev) => prev.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          Exam name must be unique within a branch.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormMode('create')
          }}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New exam
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load.'}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading exams…" />
      ) : !items.length ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No exams yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Exam</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Stream</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Qs</th>
                <th className="px-3 py-2">Subjects</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((ex) => {
                const b = lookup(branches, ex.branchid)
                const s = lookup(streams, ex.streamid)
                const y = lookup(years, ex.yearid)
                const et = lookup(examTypes, ex.examtypeid)
                return (
                  <tr key={ex.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{ex.examname}</td>
                    <td className="px-3 py-2 text-gray-700">{b ? b.code : '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{s ? s.name : '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{y ? y.yearname : '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{et ? et.name : '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{ex.examdate}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{ex.totalquestions}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {ex.subjects
                        ? Object.entries(ex.subjects)
                            .map(([sid, count]) => `${subjectsById[sid]?.name || sid} (${count})`)
                            .join(', ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(ex)
                            setFormMode('edit')
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(ex)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ExamFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        branches={branches}
        streams={streams}
        years={years}
        academicYears={academicYears}
        examTypes={examTypes}
        onClose={() => {
          setFormMode(null)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        title="Delete exam"
        itemLabel={deleting?.examname}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
