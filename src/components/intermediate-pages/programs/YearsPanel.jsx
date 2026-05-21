import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import LoadingSpinner from '../../LoadingSpinner.jsx'
import ConfirmDeleteDialog from '../../common/ConfirmDeleteDialog.jsx'
import YearFormModal from './YearFormModal.jsx'
import { intYearsApi } from '../../../lib/intermediateApi.js'

export default function YearsPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await intYearsApi.listAll()
      setItems(res.items || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await intYearsApi.update(editing.id, values)
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const created = await intYearsApi.create(values)
      setItems((prev) => [created, ...prev])
    }
    setFormMode(null)
    setEditing(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await intYearsApi.remove(deleting.id)
    setItems((prev) => prev.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          Class years (I, II) are global — they apply across all streams. Name must be unique.
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
          New year
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load.'}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading years…" />
      ) : !items.length ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No years yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Year name</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((y) => (
                <tr key={y.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{y.yearname}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(y)
                          setFormMode('edit')
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(y)}
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
      )}

      <YearFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={() => {
          setFormMode(null)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        title="Delete year"
        itemLabel={deleting?.yearname}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
