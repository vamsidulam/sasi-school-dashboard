import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import NewProgramButton from '../components/programs/NewProgramButton.jsx'
import ProgramsTable from '../components/programs/ProgramsTable.jsx'
import ProgramFormModal from '../components/programs/ProgramFormModal.jsx'
import SectionFormModal from '../components/programs/SectionFormModal.jsx'
import ConfirmDeleteDialog from '../components/programs/ConfirmDeleteDialog.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { programsApi, programSectionsApi } from '../lib/sasiApi.js'
import { usePaginatedList } from '../lib/usePaginatedList.js'

export default function Programs() {
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
  } = usePaginatedList(programsApi)

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [sectionOpen, setSectionOpen] = useState(false)
  const [sectionInitialProgram, setSectionInitialProgram] = useState(null)
  const [sectionFlash, setSectionFlash] = useState(null)

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
      const updated = await programsApi.update(editing.id, values)
      replaceItem(editing.id, updated)
    } else {
      const created = await programsApi.create(values)
      addItem(created)
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await programsApi.remove(deleting.id)
    removeItem(deleting.id)
    setDeleting(null)
  }

  const openSection = (program = null) => {
    setSectionInitialProgram(program)
    setSectionOpen(true)
    setSectionFlash(null)
  }

  const closeSection = () => {
    setSectionOpen(false)
    setSectionInitialProgram(null)
  }

  const handleSectionSubmit = async (values) => {
    const created = await programSectionsApi.create(values)
    setSectionFlash(
      `Added section "${created.sectionAbbreviation} — ${created.sectionName}".`,
    )
    closeSection()
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500">
            Manage school and college programs offered by the institution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openSection(null)}
            className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            New section
          </button>
          <NewProgramButton onClick={openCreate} />
        </div>
      </header>

      {sectionFlash ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {sectionFlash}
          <button
            type="button"
            onClick={() => setSectionFlash(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">All programs</h2>
          <span className="text-xs text-gray-500">{programs.length} loaded</span>
        </div>

        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load programs.'}
            <button
              type="button"
              onClick={refresh}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading programs…" />
        ) : (
          <>
            <ProgramsTable
              programs={programs}
              onEdit={openEdit}
              onDelete={(p) => setDeleting(p)}
              onAddSection={openSection}
            />
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

      <ProgramFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <SectionFormModal
        open={sectionOpen}
        initialProgram={sectionInitialProgram}
        programs={programs}
        programsLoading={loading}
        onClose={closeSection}
        onSubmit={handleSectionSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        program={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
