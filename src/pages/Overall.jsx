import { useState, useCallback } from 'react'
import { Search, Users } from 'lucide-react'
import { dashboardApi as schoolDashboardApi } from '../lib/sasiApi.js'
import { dashboardApi as intermediateDashboardApi } from '../lib/intermediateboardApi.js'
import { intAnalyticsApi } from '../lib/intermediateAnalyticsApi.js'
import { useAcademicYear } from '../contexts/AcademicYearContext.jsx'
import StudentModal from '../components/dashboard/school/StudentModal.jsx'
import StudentModalApi from '../components/dashboard/objective/StudentModalApi.jsx'

const PAGE_SIZE = 20

export default function Overall() {
  const { selectedYear } = useAcademicYear()
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const fetchStudents = useCallback(async (query) => {
    if (!query.trim()) {
      setStudents([])
      return
    }
    setLoading(true)
    try {
      const academicFilter = selectedYear && selectedYear !== 'ALL' ? { academicyearid: selectedYear } : {}
      const [schoolRes, intermediateRes, objectiveRes] = await Promise.allSettled([
        schoolDashboardApi.studentSearch(query.trim(), undefined, PAGE_SIZE),
        intermediateDashboardApi.studentSearch(query.trim(), undefined, PAGE_SIZE),
        intAnalyticsApi.studentSearch(query.trim(), undefined, PAGE_SIZE, academicFilter),
      ])

      const allStudents = []

      if (schoolRes.status === 'fulfilled' && schoolRes.value?.items) {
        allStudents.push(
          ...schoolRes.value.items.map((s) => ({
            ...s,
            source: 'school',
            displayName: s.studentName || s.name || '-',
            displayCode: s.rollNo || s.code || s.id,
            displayBranch: s.branchName || '-',
          }))
        )
      }

      if (intermediateRes.status === 'fulfilled' && intermediateRes.value?.items) {
        allStudents.push(
          ...intermediateRes.value.items.map((s) => ({
            ...s,
            source: 'intermediate',
            displayName: s.studentName || s.name || '-',
            displayCode: s.rollNo || s.code || s.id,
            displayBranch: s.branchName || '-',
          }))
        )
      }

      if (objectiveRes.status === 'fulfilled' && objectiveRes.value?.items) {
        allStudents.push(
          ...objectiveRes.value.items.map((s) => ({
            ...s,
            source: 'objective',
            displayName: s.name || '-',
            displayCode: s.code || s.id,
            displayBranch: s.branchName || '-',
          }))
        )
      }

      setStudents(allStudents)
      setHasMore(
        (schoolRes.status === 'fulfilled' && schoolRes.value?.hasMore) ||
        (intermediateRes.status === 'fulfilled' && intermediateRes.value?.hasMore) ||
        (objectiveRes.status === 'fulfilled' && objectiveRes.value?.hasMore)
      )
    } catch (err) {
      console.error('[Overall] fetch error', err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = () => {
    setSearchQuery(search)
    fetchStudents(search)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const sourceLabel = (source) => {
    switch (source) {
      case 'school': return 'School'
      case 'intermediate': return 'Intermediate'
      case 'objective': return 'Objective'
      default: return source
    }
  }

  const sourceBadgeColor = (source) => {
    switch (source) {
      case 'school': return 'bg-blue-100 text-blue-700'
      case 'intermediate': return 'bg-purple-100 text-purple-700'
      case 'objective': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const closeModal = () => {
    setSelectedStudent(null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900">All Students</h1>
        </div>
        <div className="text-sm text-gray-500">
          {!loading && students.length > 0 && `${students.length} students found`}
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !search.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm">
              {searchQuery ? 'No students found matching your search' : 'Enter a name or code to search'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Branch</th>
                <th className="px-6 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, i) => (
                <tr
                  key={`${student.source}-${student.displayCode}-${i}`}
                  onClick={() => setSelectedStudent(student)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {student.displayName}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{student.displayCode}</td>
                  <td className="px-6 py-3 text-gray-600">{student.displayBranch}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadgeColor(student.source)}`}
                    >
                      {sourceLabel(student.source)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {selectedStudent && selectedStudent.source === 'school' && (
        <StudentModal
          student={{ student: selectedStudent.displayCode }}
          onClose={closeModal}
        />
      )}
      {selectedStudent && selectedStudent.source === 'intermediate' && (
        <StudentModal
          student={{ student: selectedStudent.displayCode }}
          onClose={closeModal}
          useIntermediateApi
        />
      )}
      {selectedStudent && selectedStudent.source === 'objective' && (
        <StudentModalApi
          studentCode={selectedStudent.displayCode}
          allFilters={{ streamid: selectedStudent.streamid, academicyearid: selectedYear && selectedYear !== 'ALL' ? selectedYear : undefined }}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
