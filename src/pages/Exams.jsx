import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import NewExamButton from '../components/exams/NewExamButton.jsx'
import ExamsTable from '../components/exams/ExamsTable.jsx'
import ExamFormModal from '../components/exams/ExamFormModal.jsx'
import ConfirmDeleteDialog from '../components/exams/ConfirmDeleteDialog.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import IntermediateExams from '../components/intermediate-pages/IntermediateExams.jsx'
import { examsApi } from '../lib/sasiApi.js'
import { usePaginatedList } from '../lib/usePaginatedList.js'

function SchoolExams() {
  const {
    items: exams,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    addItem,
    replaceItem,
    removeItem,
  } = usePaginatedList(examsApi)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const openCreate = () => {
    setEditing(null)
    setFormMode('create')
  }
  const openEdit = (exam) => {
    setEditing(exam)
    setFormMode('edit')
  }
  const closeForm = () => {
    setFormMode(null)
    setEditing(null)
  }

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await examsApi.update(editing.id, values)
      replaceItem(editing.id, updated)
    } else {
      const created = await examsApi.create(values)
      addItem(created)
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await examsApi.remove(deleting.id)
    removeItem(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">School exams</h2>
          <p className="text-sm text-gray-500">Browse and manage exams across programs and branches.</p>
        </div>
        <NewExamButton onClick={openCreate} />
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All exams</h3>
          <span className="text-xs text-gray-500">{exams.length} loaded</span>
        </div>

        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load exams.'}
            <button type="button" onClick={refresh} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading exams…" />
        ) : (
          <>
            <ExamsTable exams={exams} onEdit={openEdit} onDelete={(e) => setDeleting(e)} />
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

      <ExamFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        exam={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default function Exams() {
  const [tab, setTab] = useState('school')
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Exams</h1>
        <p className="text-sm text-gray-500">Manage school exams and intermediate exams/subjects.</p>
      </header>
      <SchoolIntermediateTabs active={tab} onChange={setTab} />
      {tab === 'school' ? <SchoolExams /> : <IntermediateExams />}
    </div>
  )
}
