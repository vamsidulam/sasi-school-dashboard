import { useState, useEffect } from 'react'
import { Loader2, Search } from 'lucide-react'
import NewExamButton from '../components/exams/NewExamButton.jsx'
import ExamsTable from '../components/exams/ExamsTable.jsx'
import ExamFormModal from '../components/exams/ExamFormModal.jsx'
import ExamSubjectConfigModal from '../components/exams/ExamSubjectConfigModal.jsx'
import ConfirmDeleteDialog from '../components/exams/ConfirmDeleteDialog.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import ObjectiveExams from '../components/intermediate-pages/IntermediateExams.jsx'
import { useAcademicYear } from '../contexts/AcademicYearContext.jsx'
import { examsApi as schoolExamsApi, programsApi as schoolProgramsApi, branchesApi as schoolBranchesApi, academicYearsApi as schoolAcademicYearsApi, examSubjectConfigApi as schoolExamSubjectConfigApi, classStandardsApi as schoolClassStandardsApi, classStandardSubjectsApi as schoolClassStandardSubjectsApi, fetchAll as schoolFetchAll } from '../lib/sasiApi.js'
import { examsApi as intermediateExamsApi, programsApi as intermediateProgramsApi, branchesApi as intermediateBranchesApi, academicYearsApi as intermediateAcademicYearsApi, examSubjectConfigApi as intermediateExamSubjectConfigApi, classStandardsApi as intermediateClassStandardsApi, classStandardSubjectsApi as intermediateClassStandardSubjectsApi, fetchAll as intermediateFetchAll } from '../lib/intermediateboardApi.js'

function SchoolExams({ api = schoolExamsApi, programsApiRef = schoolProgramsApi, branchesApiRef = schoolBranchesApi, academicYearsApiRef = schoolAcademicYearsApi, examSubjectConfigApiRef = schoolExamSubjectConfigApi, classStandardsApiRef = schoolClassStandardsApi, classStandardSubjectsApiRef = schoolClassStandardSubjectsApi, fetchAllFn = schoolFetchAll, label = 'School', academicYearId }) {
  const [exams, setExams] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [programs, setPrograms] = useState([])
  const [branches, setBranches] = useState([])
  const [formMode, setFormMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [configuringExam, setConfiguringExam] = useState(null)

  const fetchExams = async (cursor = null, searchTerm = '', ayId = academicYearId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.list({ cursor, search: searchTerm || undefined, academicYearId: ayId || undefined })
      setExams(res.items || [])
      setNextCursor(res.nextCursor || null)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await api.list({ cursor: nextCursor, search: search || undefined, academicYearId: academicYearId || undefined })
      setExams((prev) => [...prev, ...(res.items || [])])
      setNextCursor(res.nextCursor || null)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      setError(err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Load filter options once
  useEffect(() => {
    Promise.all([fetchAllFn(programsApiRef), fetchAllFn(branchesApiRef)])
      .then(([progs, brs]) => { setPrograms(progs); setBranches(brs) })
      .catch(() => {})
  }, [])

  // Reload exams when academicYearId changes
  useEffect(() => {
    setSearch('')
    setSearchInput('')
    fetchExams(null, '', academicYearId)
  }, [academicYearId])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    fetchExams(null, searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    fetchExams(null, '')
  }

  const addItem = (item) => setExams((prev) => [item, ...prev])
  const replaceItem = (id, item) => setExams((prev) => prev.map((p) => (p.id === id ? item : p)))
  const removeItem = (id) => setExams((prev) => prev.filter((p) => p.id !== id))

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
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{label} exams</h2>
          <p className="mb-3 text-sm text-gray-500">Browse and manage exams across programs and branches.</p>
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
        <NewExamButton onClick={openCreate} />
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All exams</h3>
          <span className="text-xs text-gray-500">{exams.length} loaded</span>
        </div>

        {search && !loading && (
          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Showing search results for "<strong>{search}</strong>" · {exams.length} exam{exams.length !== 1 ? 's' : ''} found
          </div>
        )}

        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Failed to load exams.'}
            <button type="button" onClick={() => fetchExams(null, search)} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading exams…" />
        ) : (
          <>
            <ExamsTable exams={exams} programs={programs} branches={branches} onEdit={openEdit} onDelete={(e) => setDeleting(e)} onConfigure={(e) => setConfiguringExam(e)} />
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
        programsApiRef={programsApiRef}
        branchesApiRef={branchesApiRef}
        academicYearsApiRef={academicYearsApiRef}
        fetchAllFn={fetchAllFn}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        exam={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />

      <ExamSubjectConfigModal
        open={configuringExam !== null}
        exam={configuringExam}
        onClose={() => setConfiguringExam(null)}
        examSubjectConfigApiRef={examSubjectConfigApiRef}
        classStandardsApiRef={classStandardsApiRef}
        classStandardSubjectsApiRef={classStandardSubjectsApiRef}
        fetchAllFn={fetchAllFn}
      />
    </div>
  )
}

export default function Exams() {
  const [tab, setTab] = useState('school')
  const { selectedYear, setSource } = useAcademicYear()

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setSource(newTab)
  }

  return (
    <div className="space-y-6">
      <SchoolIntermediateTabs active={tab} onChange={handleTabChange} />
      {tab === 'school' && <SchoolExams api={schoolExamsApi} programsApiRef={schoolProgramsApi} branchesApiRef={schoolBranchesApi} academicYearsApiRef={schoolAcademicYearsApi} examSubjectConfigApiRef={schoolExamSubjectConfigApi} classStandardsApiRef={schoolClassStandardsApi} classStandardSubjectsApiRef={schoolClassStandardSubjectsApi} fetchAllFn={schoolFetchAll} label="School" academicYearId={selectedYear} />}
      {tab === 'intermediate' && <SchoolExams api={intermediateExamsApi} programsApiRef={intermediateProgramsApi} branchesApiRef={intermediateBranchesApi} academicYearsApiRef={intermediateAcademicYearsApi} examSubjectConfigApiRef={intermediateExamSubjectConfigApi} classStandardsApiRef={intermediateClassStandardsApi} classStandardSubjectsApiRef={intermediateClassStandardSubjectsApi} fetchAllFn={intermediateFetchAll} label="Intermediate" academicYearId={selectedYear} />}
      {tab === 'objective' && <ObjectiveExams />}
    </div>
  )
}
