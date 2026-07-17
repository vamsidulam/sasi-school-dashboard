import { useState } from 'react'
import Overview from './Overview.jsx'
import Rankings from './Rankings.jsx'
import BranchAnalysis from './BranchAnalysis.jsx'
import TestTrend from './TestTrend.jsx'
import StudentModal from './StudentModal.jsx'
import { DUMMY_STUDENTS } from './dummyData.js'

const TAB_DEFS = [
  ['overview', 'Overview'],
  ['rankings', 'Rankings'],
  ['branch', 'Branch Analysis'],
  ['trend', 'Test Trend'],
]

export default function SchoolDashboardAnalytics({ onBack, label = 'School' }) {
  const [tab, setTab] = useState('overview')
  const [modalStudent, setModalStudent] = useState(null)

  const handleStudentClick = (studentCode) => {
    const s = DUMMY_STUDENTS.find((st) => st.student === studentCode)
    if (s) setModalStudent(s)
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
        {/* Header with filters placeholder */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Program</label>
              <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[140px]">
                <option>All Programs</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Exam</label>
              <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[160px]">
                <option>All Exams</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Class</label>
              <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[120px]">
                <option>All Classes</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Branch</label>
              <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none min-w-[140px]">
                <option>All Branches</option>
              </select>
            </div>
            <div className="flex-1" />
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500">
              1267 Students · 4 Tests
            </span>
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
            {tab === 'overview' && <Overview onStudentClick={handleStudentClick} />}
            {tab === 'rankings' && <Rankings onStudentClick={handleStudentClick} />}
            {tab === 'branch' && <BranchAnalysis />}
            {tab === 'trend' && <TestTrend />}
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
