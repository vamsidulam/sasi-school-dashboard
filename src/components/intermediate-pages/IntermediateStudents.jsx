import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner.jsx'
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx'
import StudentFormModal from './students/StudentFormModal.jsx'
import {
  intStudentsApi,
  intBranchesApi,
  intAcademicYearsApi,
  intStreamsApi,
  intYearsApi,
} from '../../lib/intermediateApi.js'

export default function IntermediateStudents() {
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const [branches, setBranches] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const loadFirst = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await intStudentsApi.list()
      setItems(res.items || [])
      setNextCursor(res.nextCursor || null)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await intStudentsApi.list({ cursor: nextCursor })
      setItems((prev) => [...prev, ...(res.items || [])])
      setNextCursor(res.nextCursor || null)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      setError(err)
    } finally {
      setLoadingMore(false)
    }
  }, [nextCursor, loadingMore])

  useEffect(() => {
    loadFirst()
    intBranchesApi.listAll().then((res) => setBranches(res.items || [])).catch(() => {})
    intAcademicYearsApi.listAll().then((res) => setAcademicYears(res.items || [])).catch(() => {})
    intStreamsApi.listAll().then((res) => setStreams(res.items || [])).catch(() => {})
    intYearsApi.listAll().then((res) => setYears(res.items || [])).catch(() => {})
  }, [loadFirst])

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
      const updated = await intStudentsApi.update(editing.id, values)
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const created = await intStudentsApi.create(values)
      setItems((prev) => [created, ...prev])
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await intStudentsApi.remove(deleting.id)
    setItems((prev) => prev.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Intermediate students</h2>
          <p className="text-sm text-gray-500">
            Only <strong>code</strong> is required. Code must be unique.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New student
        </button>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All students</h3>
          <span className="text-xs text-gray-500">{items.length} loaded</span>
        </div>

        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load.'}
            <button type="button" onClick={loadFirst} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading students…" />
        ) : !items.length ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            No students yet — click "New student" to add one.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Parent</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Stream</th>
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((s) => (
                    <tr key={s.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">{s.code}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{s.name || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{s.phone || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{s.parentname || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {s.branchName ? `${s.branchName}${s.branchCode ? ` (${s.branchCode})` : ''}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {(streams.find((x) => x.id === s.streamid)?.name) || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {(years.find((x) => x.id === s.yearid)?.yearname) || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(s)}
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
            {hasMore ? (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Load more
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <StudentFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        branches={branches}
        academicYears={academicYears}
        streams={streams}
        years={years}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        title="Delete student"
        itemLabel={deleting ? `${deleting.code}${deleting.name ? ` — ${deleting.name}` : ''}` : null}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
