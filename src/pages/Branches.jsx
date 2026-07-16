import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import NewBranchButton from '../components/branches/NewBranchButton.jsx'
import BranchesTable from '../components/branches/BranchesTable.jsx'
import BranchFormModal from '../components/branches/BranchFormModal.jsx'
import ConfirmDeleteDialog from '../components/branches/ConfirmDeleteDialog.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import ObjectiveBranches from '../components/intermediate-pages/IntermediateBranches.jsx'
import { branchesApi as schoolBranchesApi } from '../lib/sasiApi.js'
import { branchesApi as intermediateBranchesApi } from '../lib/intermediateboardApi.js'
import { usePaginatedList } from '../lib/usePaginatedList.js'

function SchoolBranches({ api = schoolBranchesApi, label = 'School' }) {
  const {
    items: branches,
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
  const openEdit = (branch) => {
    setEditing(branch)
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
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{label} branches</h2>
          <p className="text-sm text-gray-500">Manage academic branches offered across programs.</p>
        </div>
        <NewBranchButton onClick={openCreate} />
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All branches</h3>
          <span className="text-xs text-gray-500">{branches.length} loaded</span>
        </div>

        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load branches.'}
            <button type="button" onClick={refresh} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading branches…" />
        ) : (
          <>
            <BranchesTable branches={branches} onEdit={openEdit} onDelete={(b) => setDeleting(b)} />
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

      <BranchFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        branch={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default function Branches() {
  const [tab, setTab] = useState('school')
  return (
    <div className="space-y-6">
      {/* <header>
        <h1 className="text-xl font-semibold text-gray-900">Branches</h1>
        <p className="text-sm text-gray-500">Manage school, intermediate, and objective branches.</p>
      </header> */}
      <SchoolIntermediateTabs active={tab} onChange={setTab} />
      {tab === 'school' && <SchoolBranches api={schoolBranchesApi} label="School" />}
      {tab === 'intermediate' && <SchoolBranches api={intermediateBranchesApi} label="Intermediate" />}
      {tab === 'objective' && <ObjectiveBranches />}
    </div>
  )
}
