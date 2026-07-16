import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import { downloadCsv } from '../utils/exportCsv.js'
import NewStudentButton from '../components/students/NewStudentButton.jsx'
import StudentsTable from '../components/students/StudentsTable.jsx'
import StudentFormModal from '../components/students/StudentFormModal.jsx'
import ConfirmDeleteDialog from '../components/students/ConfirmDeleteDialog.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import ObjectiveStudents from '../components/intermediate-pages/IntermediateStudents.jsx'
import { useAcademicYear } from '../contexts/AcademicYearContext.jsx'
import { studentsApi as schoolStudentsApi, programsApi as schoolProgramsApi, branchesApi as schoolBranchesApi, programSectionsApi as schoolProgramSectionsApi, classStandardsApi as schoolClassStandardsApi, academicYearsApi as schoolAcademicYearsApi, fetchAll as schoolFetchAll } from '../lib/sasiApi.js'
import { studentsApi as intermediateStudentsApi, programsApi as intermediateProgramsApi, branchesApi as intermediateBranchesApi, programSectionsApi as intermediateProgramSectionsApi, classStandardsApi as intermediateClassStandardsApi, academicYearsApi as intermediateAcademicYearsApi, fetchAll as intermediateFetchAll } from '../lib/intermediateboardApi.js'

function SchoolStudents({ api = schoolStudentsApi, programsApiRef = schoolProgramsApi, branchesApiRef = schoolBranchesApi, programSectionsApiRef = schoolProgramSectionsApi, classStandardsApiRef = schoolClassStandardsApi, academicYearsApiRef = schoolAcademicYearsApi, fetchAllFn = schoolFetchAll, label = 'School', academicYearId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursorStack, setCursorStack] = useState([])

  // Filter options
  const [programs, setPrograms] = useState([])
  const [branches, setBranches] = useState([])
  const [classStandards, setClassStandards] = useState([])
  const [sections, setSections] = useState([])

  // Active filters
  const [programId, setProgramId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [classStandardId, setClassStandardId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // CRUD state
  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Keep a ref to always have latest academicYearId
  const academicYearRef = useRef(academicYearId)
  academicYearRef.current = academicYearId

  // Load filter options once
  useEffect(() => {
    fetchAllFn(programsApiRef).then(setPrograms).catch(() => {})
    fetchAllFn(branchesApiRef).then(setBranches).catch(() => {})
    fetchAllFn(classStandardsApiRef).then(setClassStandards).catch(() => {})
    fetchAllFn(programSectionsApiRef).then(setSections).catch(() => {})
  }, [])

  // Filter sections by selected class standard (client-side cascade)
  const filteredSections = classStandardId
    ? sections.filter((s) => s.classStandardId === classStandardId)
    : sections

  // Filter class standards by selected program (client-side cascade)
  const filteredClassStandards = programId
    ? classStandards.filter((cs) => cs.programId === programId)
    : classStandards

  // Fetch students — uses explicit params, no closure dependency
  const doFetch = async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.list(params)
      setItems(res.items || [])
      setHasMore(Boolean(res.hasMore))
      setCursor(res.nextCursor || null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Reload whenever academicYearId or local filters change
  useEffect(() => {
    setCursorStack([])
    doFetch({
      programId: programId || undefined,
      branchId: branchId || undefined,
      sectionId: sectionId || undefined,
      academicYearId: academicYearId || undefined,
      search: search || undefined,
    })
  }, [academicYearId, programId, branchId, sectionId, search])

  const handleNextPage = () => {
    if (!hasMore || !cursor) return
    setCursorStack((prev) => [...prev, items[0]?.id || null])
    doFetch({
      cursor,
      programId: programId || undefined,
      branchId: branchId || undefined,
      sectionId: sectionId || undefined,
      academicYearId: academicYearRef.current || undefined,
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
      programId: programId || undefined,
      branchId: branchId || undefined,
      sectionId: sectionId || undefined,
      academicYearId: academicYearRef.current || undefined,
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
  const openEdit = (student) => { setEditing(student); setFormMode('edit') }
  const closeForm = () => { setFormMode(null); setEditing(null) }

  const handleSubmit = async (values) => {
    if (formMode === 'edit' && editing) {
      const updated = await api.update(editing.id, values)
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const created = await api.create(values)
      setItems((prev) => [created, ...prev])
    }
    closeForm()
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    await api.remove(deleting.id)
    setItems((prev) => prev.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {
        programId: programId || undefined,
        branchId: branchId || undefined,
        sectionId: sectionId || undefined,
        academicYearId: academicYearRef.current || undefined,
        search: search || undefined,
      }
      const all = []
      let cursor
      for (let i = 0; i < 100; i++) {
        const res = await api.list({ ...params, cursor })
        all.push(...(res.items || []))
        if (!res.hasMore || !res.nextCursor) break
        cursor = res.nextCursor
      }
      const columns = [
        { label: 'Roll No', key: 'rollNumber' },
        { label: 'Name', key: 'name' },
        { label: 'Father Name', key: 'fatherName' },
        { label: 'Phone', key: 'phone' },
        { label: 'Program', key: (r) => programs.find((p) => p.id === r.programId)?.name || r.programId || '' },
        { label: 'Branch', key: (r) => branches.find((b) => b.id === r.branchId)?.name || r.branchId || '' },
        { label: 'Class', key: (r) => classStandards.find((c) => c.id === r.classStandardId)?.standardName || r.classStandardId || '' },
        { label: 'Section', key: (r) => sections.find((s) => s.id === r.sectionId)?.sectionName || r.sectionId || '' },
      ]
      downloadCsv(all, columns, `${label.toLowerCase()}-students.csv`)
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
          <h2 className="text-lg font-semibold text-gray-900">{label} students</h2>
          <p className="text-sm text-gray-500">Manage student records.</p>
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
          <NewStudentButton onClick={openCreate} />
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Program
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={fieldCls}>
            <option value="">All</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.program ? `${p.program} ${p.standard || ''} ${p.group || ''}`.trim() : p.name || p.id}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Branch
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={fieldCls}>
            <option value="">All</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}{b.code ? ` (${b.code})` : ''}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Class
          <select value={classStandardId} onChange={(e) => { setClassStandardId(e.target.value); setSectionId('') }} className={fieldCls}>
            <option value="">All</option>
            {filteredClassStandards.map((cs) => (
              <option key={cs.id} value={cs.id}>{cs.standardName}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Section
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={fieldCls}>
            <option value="">All</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>{s.sectionAbbreviation || s.sectionName || s.id}</option>
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
                placeholder="Name or Roll No..."
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
            <button type="button" onClick={() => doFetch({ academicYearId: academicYearRef.current || undefined })} className="ml-2 underline hover:no-underline">Retry</button>
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
            <StudentsTable students={items} onEdit={openEdit} onDelete={(s) => setDeleting(s)} />
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
        onClose={closeForm}
        onSubmit={handleSubmit}
        programsApiRef={programsApiRef}
        branchesApiRef={branchesApiRef}
        programSectionsApiRef={programSectionsApiRef}
        academicYearsApiRef={academicYearsApiRef}
        fetchAllFn={fetchAllFn}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        student={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default function Students() {
  const [tab, setTab] = useState('school')
  const { selectedYear, setSource } = useAcademicYear()

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setSource(newTab)
  }

  return (
    <div className="space-y-6">
      <SchoolIntermediateTabs active={tab} onChange={handleTabChange} />
      {tab === 'school' && <SchoolStudents api={schoolStudentsApi} programsApiRef={schoolProgramsApi} branchesApiRef={schoolBranchesApi} programSectionsApiRef={schoolProgramSectionsApi} classStandardsApiRef={schoolClassStandardsApi} academicYearsApiRef={schoolAcademicYearsApi} fetchAllFn={schoolFetchAll} label="School" academicYearId={selectedYear} />}
      {tab === 'intermediate' && <SchoolStudents api={intermediateStudentsApi} programsApiRef={intermediateProgramsApi} branchesApiRef={intermediateBranchesApi} programSectionsApiRef={intermediateProgramSectionsApi} classStandardsApiRef={intermediateClassStandardsApi} academicYearsApiRef={intermediateAcademicYearsApi} fetchAllFn={intermediateFetchAll} label="Intermediate" academicYearId={selectedYear} />}
      {tab === 'objective' && <ObjectiveStudents />}
    </div>
  )
}
