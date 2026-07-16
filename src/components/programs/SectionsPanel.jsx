import { useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner.jsx'
import SectionFormModal from './SectionFormModal.jsx'
import { programSectionsApi as defaultProgramSectionsApi, programsApi as defaultProgramsApi, classStandardsApi as defaultClassStandardsApi } from '../../lib/sasiApi.js'
import { usePaginatedList } from '../../lib/usePaginatedList.js'
import { fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'
import { useEffect } from 'react'

function ConfirmDeleteDialog({ open, section, onCancel, onConfirm }) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  if (!open || !section) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete Section</h3>
        <p className="mb-4 text-sm text-gray-600">
          Delete <span className="font-semibold">{section.sectionAbbreviation}</span> ({section.sectionName})?
          This cannot be undone.
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

function SectionsTable({ sections, programs, classStandards, onEdit, onDelete }) {
  if (!sections.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No sections yet. Click "New Section" to create one.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-3 py-2 font-semibold">Abbreviation</th>
            <th className="px-3 py-2 font-semibold">Section Name</th>
            <th className="px-3 py-2 font-semibold">Program / Class</th>
            <th className="px-3 py-2 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sections.map((section) => {
            const program = programs.find((p) => p.id === section.programId)
            const classStandard = classStandards.find((cs) => cs.id === section.classStandardId)
            return (
              <tr key={section.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center rounded-md bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                    {section.sectionAbbreviation}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{section.sectionName}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-700">
                    {program?.name || '—'} / {classStandard?.standardName || '—'}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(section)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(section)}
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
  )
}

export default function SectionsPanel({ programSectionsApi = defaultProgramSectionsApi, programsApi = defaultProgramsApi, classStandardsApi = defaultClassStandardsApi, fetchAll = defaultFetchAll }) {
  const {
    items: sections,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    addItem,
    replaceItem,
    removeItem,
  } = usePaginatedList(programSectionsApi)

  const [programs, setPrograms] = useState([])
  const [classStandards, setClassStandards] = useState([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [sectionFlash, setSectionFlash] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setProgramsLoading(true)
      try {
        const [programsData, classStandardsData] = await Promise.all([
          fetchAll(programsApi),
          fetchAll(classStandardsApi),
        ])
        setPrograms(programsData)
        setClassStandards(classStandardsData)
      } catch (err) {
        console.error('Failed to load programs/class standards:', err)
      } finally {
        setProgramsLoading(false)
      }
    }
    loadData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setSectionOpen(true)
    setSectionFlash(null)
  }

  const openEdit = (section) => {
    setEditing(section)
    setSectionOpen(true)
    setSectionFlash(null)
  }

  const closeSection = () => {
    setSectionOpen(false)
    setEditing(null)
  }

  const handleSectionSubmit = async (values) => {
    if (editing) {
      const updated = await programSectionsApi.update(editing.id, values)
      replaceItem(editing.id, updated)
      setSectionFlash(`Updated section "${updated.sectionAbbreviation}".`)
    } else {
      const created = await programSectionsApi.create(values)
      addItem(created)
      setSectionFlash(`Created section "${created.sectionAbbreviation} — ${created.sectionName}".`)
    }
    closeSection()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await programSectionsApi.remove(deleting.id)
    removeItem(deleting.id)
    setDeleting(null)
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">All Sections</h3>
          <p className="text-xs text-gray-500">{sections.length} sections loaded</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Section
        </button>
      </div>

      {sectionFlash ? (
        <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {sectionFlash}
          <button type="button" onClick={() => setSectionFlash(null)} className="ml-2 underline hover:no-underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || 'Failed to load sections.'}
          <button type="button" onClick={refresh} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading sections…" />
      ) : (
        <>
          <SectionsTable
            sections={sections}
            programs={programs}
            classStandards={classStandards}
            onEdit={openEdit}
            onDelete={(s) => setDeleting(s)}
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

      <SectionFormModal
        open={sectionOpen}
        mode={editing ? 'edit' : 'create'}
        initial={editing}
        programs={programs}
        classStandards={classStandards}
        programsLoading={programsLoading}
        onClose={closeSection}
        onSubmit={handleSectionSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        section={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
