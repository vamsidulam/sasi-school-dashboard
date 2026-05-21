import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import LoadingSpinner from '../../LoadingSpinner.jsx'
import ConfirmDeleteDialog from '../../common/ConfirmDeleteDialog.jsx'
import SubjectFormModal from './SubjectFormModal.jsx'
import { intSubjectsApi, intStreamsApi, intYearsApi } from '../../../lib/intermediateApi.js'

export default function SubjectsPanel() {
  const [items, setItems] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await intSubjectsApi.list()
      setItems(res.items || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    intStreamsApi.listAll().then((res) => setStreams(res.items || [])).catch(() => {})
    intYearsApi.listAll().then((res) => setYears(res.items || [])).catch(() => {})
  }, [load])

  const lookup = (list, id) => list.find((x) => x.id === id)

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await intSubjectsApi.update(editing.id, values)
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const created = await intSubjectsApi.create(values)
      setItems((prev) => [created, ...prev])
    }
    setFormMode(null)
    setEditing(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await intSubjectsApi.remove(deleting.id)
    setItems((prev) => prev.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          Subjects belong to a (stream × year) pair.
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
          New subject
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load.'}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading subjects…" />
      ) : !items.length ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No subjects yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Stream</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((sub) => {
                const s = lookup(streams, sub.streamid)
                const y = lookup(years, sub.yearid)
                return (
                  <tr key={sub.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900 capitalize">{sub.name}</td>
                    <td className="px-3 py-2 text-gray-700">{s ? s.name : '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{y ? y.yearname : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(sub)
                            setFormMode('edit')
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(sub)}
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

      <SubjectFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        streams={streams}
        years={years}
        onClose={() => {
          setFormMode(null)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        title="Delete subject"
        itemLabel={deleting?.name}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
