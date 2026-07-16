import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import NewProgramButton from './NewProgramButton.jsx'
import ProgramsTable from './ProgramsTable.jsx'
import ProgramFormModal from './ProgramFormModal.jsx'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.jsx'
import LoadingSpinner from '../LoadingSpinner.jsx'
import { programsApi as defaultProgramsApi } from '../../lib/sasiApi.js'
import { usePaginatedList } from '../../lib/usePaginatedList.js'

export default function ProgramsPanel({ api = defaultProgramsApi }) {
  const {
    items: programs,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    addItem,
    replaceItem,
    removeItem,
  } = usePaginatedList(api)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const openCreate = () => {
    setEditing(null)
    setFormMode('create')
  }

  const openEdit = (program) => {
    setEditing(program)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditing(null)
  }

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await api.update(editing.id, values)
      replaceItem(editing.id, updated)
    } else {
      const created = await api.create(values)
      addItem(created)
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await api.remove(deleting.id)
    removeItem(deleting.id)
    setDeleting(null)
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">All Programs</h3>
          <p className="text-xs text-gray-500">{programs.length} programs loaded</p>
        </div>
        <NewProgramButton onClick={openCreate} />
      </div>

      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load programs.'}
          <button type="button" onClick={refresh} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading programs…" />
      ) : (
        <>
          <ProgramsTable programs={programs} onEdit={openEdit} onDelete={(p) => setDeleting(p)} />
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

      <ProgramFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        program={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
