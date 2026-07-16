import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner.jsx'
import ConfirmDeleteDialog from '../common/ConfirmDeleteDialog.jsx'
import StudentFormModal from './students/StudentFormModal.jsx'
import { downloadCsv } from '../../utils/exportCsv.js'
import { useAcademicYear } from '../../contexts/AcademicYearContext.jsx'
import {
  intStudentsApi,
  intBranchesApi,
  intAcademicYearsApi,
  intStreamsApi,
  intYearsApi,
} from '../../lib/intermediateApi.js'

export default function IntermediateStudents() {
  const { selectedYear } = useAcademicYear()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursorStack, setCursorStack] = useState([])

  // Filter options
  const [branches, setBranches] = useState([])
  const [streams, setStreams] = useState([])
  const [years, setYears] = useState([])
  const [localAcademicYears, setLocalAcademicYears] = useState([])

  // Active filters
  const [branchid, setBranchid] = useState('')
  const [streamid, setStreamid] = useState('')
  const [yearid, setYearid] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // CRUD state
  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [exporting, setExporting] = useState(false)

  const academicYearRef = useRef(selectedYear)
  academicYearRef.current = selectedYear

  // Load filter options once
  useEffect(() => {
    intBranchesApi.listAll().then((res) => setBranches(res.items || [])).catch(() => {})
    intStreamsApi.listAll().then((res) => setStreams(res.items || [])).catch(() => {})
    intYearsApi.listAll().then((res) => setYears(res.items || [])).catch(() => {})
    intAcademicYearsApi.listAll().then((res) => setLocalAcademicYears(res.items || [])).catch(() => {})
  }, [])

  // Fetch students with explicit params
  const doFetch = async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await intStudentsApi.list(params)
      setItems(res.items || [])
      setHasMore(Boolean(res.hasMore))
      setCursor(res.nextCursor || null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Reload when academic year or local filters change
  useEffect(() => {
    setCursorStack([])
    doFetch({
      branchid: branchid || undefined,
      streamid: streamid || undefined,
      yearid: yearid || undefined,
      academicyearid: selectedYear || undefined,
      search: search || undefined,
    })
  }, [selectedYear, branchid, streamid, yearid, search])

  const handleNextPage = () => {
    if (!hasMore || !cursor) return
    setCursorStack((prev) => [...prev, items[0]?.id || null])
    doFetch({
      cursor,
      branchid: branchid || undefined,
      streamid: streamid || undefined,
      yearid: yearid || undefined,
      academicyearid: academicYearRef.current || undefined,
      search: search || undefined,
    })
  }

  const handlePrevPage = () => {
    if (cursorStack.length === 0) return
    const newStack = [...cursorStack]
    const prevCursor = newStack.pop()
    setCursorStack(newStack)
    doFetch({
      cursor: prevCursor === cursorStack[0] ? undefined : prevCursor,
      branchid: branchid || undefined,
      streamid: streamid || undefined,
      yearid: yearid || undefined,
      academicyearid: academicYearRef.current || undefined,
      search: search || undefined,
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  const openCreate = () => { setEditing(null); setFormMode('create') }
  const openEdit = (item) => { setEditing(item); setFormMode('edit') }
  const closeForm = () => { setFormMode(null); setEditing(null) }

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

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {
        branchid: branchid || undefined,
        streamid: streamid || undefined,
        yearid: yearid || undefined,
        academicyearid: academicYearRef.current || undefined,
        search: search || undefined,
      }
      const all = []
      let cursor
      for (let i = 0; i < 100; i++) {
        const res = await intStudentsApi.list({ ...params, cursor })
        all.push(...(res.items || []))
        if (!res.hasMore || !res.nextCursor) break
        cursor = res.nextCursor
      }
      const columns = [
        { label: 'Code', key: 'code' },
        { label: 'Name', key: 'name' },
        { label: 'Phone', key: 'phone' },
        { label: 'Parent Name', key: 'parentname' },
        { label: 'Branch', key: (r) => r.branchName || branches.find((b) => b.id === r.branchid)?.name || '' },
        { label: 'Stream', key: (r) => streams.find((s) => s.id === r.streamid)?.name || '' },
        { label: 'Year', key: (r) => years.find((y) => y.id === r.yearid)?.yearname || '' },
        { label: 'Academic Year', key: (r) => localAcademicYears.find((a) => a.id === r.academicyearid)?.name || '' },
      ]
      downloadCsv(all, columns, 'objective-students.csv')
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const fieldCls = 'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Objective students</h2>
          <p className="text-sm text-gray-500">Only <strong>code</strong> is required. Code must be unique.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New student
        </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Branch
          <select value={branchid} onChange={(e) => setBranchid(e.target.value)} className={fieldCls}>
            <option value="">All</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}{b.code ? ` (${b.code})` : ''}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Stream
          <select value={streamid} onChange={(e) => setStreamid(e.target.value)} className={fieldCls}>
            <option value="">All</option>
            {streams.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Year
          <select value={yearid} onChange={(e) => setYearid(e.target.value)} className={fieldCls}>
            <option value="">All</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.yearname || y.name}</option>
            ))}
          </select>
        </label>
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Search
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Code or name..."
                className={`${fieldCls} pl-8 w-48`}
              />
            </div>
          </label>
          <button type="submit" className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Go</button>
          {search && (
            <button type="button" onClick={handleClearSearch} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Clear</button>
          )}
        </form>
      </div>

      {/* Table */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load.'}
            <button type="button" onClick={() => doFetch({ academicyearid: academicYearRef.current || undefined })} className="ml-2 underline hover:no-underline">Retry</button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading students…" />
        ) : !items.length ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            No students found.
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
                    <th className="px-3 py-2">Academic Year</th>
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
                      <td className="px-3 py-2 text-gray-700">
                        {(localAcademicYears.find((x) => x.id === s.academicyearid)?.name) || '—'}
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

            {/* Arrow Pagination */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500">{items.length} students · Page {cursorStack.length + 1}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Page {cursorStack.length + 1}</span>
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={cursorStack.length === 0}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <StudentFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initial={editing}
        branches={branches}
        academicYears={localAcademicYears}
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
