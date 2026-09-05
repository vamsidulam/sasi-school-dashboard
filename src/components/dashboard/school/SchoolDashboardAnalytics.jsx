import { useCallback, useEffect, useMemo, useState } from 'react'
import Overview from './Overview.jsx'
import Rankings from './Rankings.jsx'
import BranchAnalysis from './BranchAnalysis.jsx'
import TestTrend from './TestTrend.jsx'
import StudentModal from './StudentModal.jsx'
import { dashboardApi } from '../../../lib/sasiApi.js'
import * as intBoardApi from '../../../lib/intermediateboardApi.js'
import { useAcademicYear } from '../../../contexts/AcademicYearContext.jsx'

const TAB_DEFS = [
  ['overview', 'Overview'],
  ['rankings', 'Rankings'],
  ['branch', 'Branch Analysis'],
  ['trend', 'Test Trend'],
]

export default function SchoolDashboardAnalytics({ onBack, label = 'School' }) {
  const { selectedYear } = useAcademicYear()
  const isIntermediate = label === 'Intermediate'
  const api = isIntermediate ? intBoardApi.dashboardApi : dashboardApi

  const [tab, setTab] = useState('overview')
  const [modalStudent, setModalStudent] = useState(null)

  const [filters, setFilters] = useState(null)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [filtersErr, setFiltersErr] = useState(null)

  const [programId, setProgramId] = useState('')
  const [classStandardId, setClassStandardId] = useState('')
  const [examId, setExamId] = useState('')
  const [branchId, setBranchId] = useState('')

  const academicYearId = selectedYear?.id || ''

  useEffect(() => {
    let cancelled = false
    setLoadingFilters(true)
    api.filters(programId || undefined, academicYearId || undefined)
      .then((data) => {
        if (cancelled) return
        setFilters(data)
        setFiltersErr(null)
        if (!programId && data.programs?.length) {
          setProgramId(data.programs[0].id)
        }
        if (programId && !classStandardId && data.classStandards?.length) {
          setClassStandardId(data.classStandards[0].id)
        }
      })
      .catch((e) => { if (!cancelled) setFiltersErr(e.message) })
      .finally(() => { if (!cancelled) setLoadingFilters(false) })
    return () => { cancelled = true }
  }, [programId, academicYearId])

  useEffect(() => {
    setClassStandardId('')
    setExamId('')
  }, [programId])

  useEffect(() => {
    if (filters?.classStandards?.length && !classStandardId) {
      setClassStandardId(filters.classStandards[0].id)
    }
  }, [filters?.classStandards])

  const programs = filters?.programs || []
  const classStandards = filters?.classStandards || []
  const exams = filters?.exams || []
  const branches = filters?.branches || []

  const filteredExams = useMemo(() => {
    if (!branchId) return exams
    return exams.filter((e) => !e.branches?.length || e.branches.includes(branchId))
  }, [exams, branchId])

  const studentsCount = filters?.studentsCount || '—'
  const testsCount = filteredExams.length

  const handleStudentClick = (studentCode) => {
    setModalStudent({ student: studentCode })
  }

  if (filtersErr && !filters) {
    return (
      <div className="space-y-6">
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard Selection
          </button>
        )}
        <div className="rounded-xl border border-gray-200 bg-white py-20 text-center shadow-sm">
          <div className="mb-1 font-serif text-xl text-gray-800">Unable to load filters</div>
          <div className="text-sm text-gray-500">{filtersErr}</div>
        </div>
      </div>
    )
  }

  if (loadingFilters && !filters) {
    return (
      <div className="space-y-6">
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard Selection
          </button>
        )}
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white py-24 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
          <div className="font-mono text-xs tracking-[0.2em] text-gray-400">LOADING FILTERS…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard Selection
        </button>
      )}

      {onBack && (
        <div className="mb-6">
          <h1 className="mb-2 font-serif text-3xl font-semibold text-gray-900">
            {label} Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Student performance analytics and branch comparison
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
        {/* Header with filters */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Program</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={loadingFilters}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[140px] disabled:opacity-50"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Class</label>
              <select
                value={classStandardId}
                onChange={(e) => setClassStandardId(e.target.value)}
                disabled={loadingFilters || !programId}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[120px] disabled:opacity-50"
              >
                <option value="">All Classes</option>
                {classStandards.map((cs) => (
                  <option key={cs.id} value={cs.id}>{cs.standardName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Exam</label>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                disabled={loadingFilters || !programId}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[160px] disabled:opacity-50"
              >
                <option value="">All Exams</option>
                {filteredExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loadingFilters}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[140px] disabled:opacity-50"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1" />
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500">
              {testsCount} Exams
            </span>
            {loadingFilters && (
              <span className="text-[10px] text-gray-400">Updating…</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6">
          <nav className="flex gap-1">
            {TAB_DEFS.map(([key, lbl]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`border-b-2 px-4 py-3 text-xs font-semibold tracking-wide transition-colors ${
                  tab === key
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-7">
          <main className="pb-12 pt-6">
            {tab === 'overview' && (
              <Overview
                onStudentClick={handleStudentClick}
                label={label}
                classStandardId={classStandardId}
                examId={examId}
                branchId={branchId}
              />
            )}
            {tab === 'rankings' && (
              <Rankings
                onStudentClick={handleStudentClick}
                classStandardId={classStandardId}
                examId={examId}
                branchId={branchId}
                label={label}
              />
            )}
            {tab === 'branch' && (
              <BranchAnalysis
                classStandardId={classStandardId}
                examId={examId}
                label={label}
              />
            )}
            {tab === 'trend' && (
              <TestTrend
                classStandardId={classStandardId}
                branchId={branchId}
                label={label}
              />
            )}
          </main>
        </div>
      </div>

      {modalStudent && (
        <StudentModal
          student={modalStudent}
          onClose={() => setModalStudent(null)}
        />
      )}
    </div>
  )
}
