import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
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

export default function ExamsPanel({ academicyearid }) {
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [subjectsById, setSubjectsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [cursorStack, setCursorStack] = useState([]) // Stack to track previous cursors for "Prev"
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async (currentCursor = null, searchTerm = '', ayId = academicyearid) => {
    setLoading(true)
    setError(null)
    try {
      const res = await intExamsApi.list({
        cursor: currentCursor,
        search: searchTerm || undefined,
        academicyearid: ayId || undefined,
      })
      setItems(res.items || [])
      setHasMore(res.hasMore || false)
      setPageSize(res.pageSize || 10)
      if (res.nextCursor) {
        setCursor(res.nextCursor)
      } else {
        setCursor(null)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [academicyearid])

  useEffect(() => {
    intBranchesApi.listAll().then((res) => setBranches(res.items || [])).catch(() => {})
    intStreamsApi.listAll().then((res) => setStreams(res.items || [])).catch(() => {})
    intYearsApi.listAll().then((res) => setYears(res.items || [])).catch(() => {})
    intAcademicYearsApi.listAll().then((res) => setAcademicYears(res.items || [])).catch(() => {})
    intExamTypesApi.listAll().then((res) => setExamTypes(res.items || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setCursorStack([])
    setCursor(null)
    setSearch('')
    setSearchInput('')
    load(null, '', academicyearid)
  }, [academicyearid])

  // Fetch subject names for all subject IDs referenced by current exams
  useEffect(() => {
    const ids = [...new Set(items.flatMap((ex) => Object.keys(ex.subjects || {})))]
    if (!ids.length) return
    intSubjectsApi
      .byIds(ids)
      .then((res) => {
        const map = {}
        for (const s of res.items || []) map[s.id] = s
        setSubjectsById(map)
      })
      .catch(() => {})
  }, [items])

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

  const handleNextPage = () => {
    if (!hasMore || !cursor) return
    setCursorStack((prev) => [...prev, cursorStack.length === 0 ? null : cursor])
    load(cursor, search, academicyearid)
  }

  const handlePrevPage = () => {
    if (cursorStack.length === 0) return
    const newStack = [...cursorStack]
    const prevCursor = newStack.pop()
    setCursorStack(newStack)
    load(prevCursor, search, academicyearid)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setCursorStack([])
    setCursor(null)
    load(null, searchInput, academicyearid)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setCursorStack([])
    setCursor(null)
    load(null, '', academicyearid)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="mb-3 text-sm text-gray-500">
            Manage exams for different branches, streams, and years.
          </p>
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search exams by name..."
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </form>
        </div>
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

      {search && !loading && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Showing search results for "<strong>{search}</strong>" · {items.length} exam{items.length !== 1 ? 's' : ''} found
        </div>
      )}

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
                const branchIds = Array.isArray(ex.branchid) ? ex.branchid : ex.branchid ? [ex.branchid] : []
                const branchLabels = branchIds.map((bid) => { const b = lookup(branches, bid); return b ? (b.code || b.name) : bid }).join(', ')
                const s = lookup(streams, ex.streamid)
                const y = lookup(years, ex.yearid)
                const et = lookup(examTypes, ex.examtypeid)
                return (
                  <tr key={ex.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{ex.examname}</td>
                    <td className="px-3 py-2 text-gray-700">{branchLabels || '—'}</td>
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

      {/* Pagination Controls */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={cursorStack.length === 0}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasMore}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{items.length}</span> exam{items.length !== 1 ? 's' : ''} per page
                {pageSize && <span className="text-gray-500"> (page size: {pageSize})</span>}
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={cursorStack.length === 0}
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
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
