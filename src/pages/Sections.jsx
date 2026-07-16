import { useState } from 'react'
import { Loader2, BookOpen } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SectionSubjectsModal from '../components/programs/SectionSubjectsModal.jsx'
import { programSectionsApi } from '../lib/sasiApi.js'
import { usePaginatedList } from '../lib/usePaginatedList.js'

function SectionsTable({ sections, onManageSubjects }) {
  if (!sections.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No sections found. Create sections from the Programs page.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Abbreviation</th>
            <th className="px-4 py-3 font-semibold">Section Name</th>
            <th className="px-4 py-3 text-center font-semibold">Subjects</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sections.map((section) => (
            <tr key={section.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-md bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                  {section.sectionAbbreviation}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{section.sectionName}</div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {section.subjectCount || 0}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onManageSubjects(section)}
                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Manage Subjects
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Sections() {
  const {
    items: sections,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = usePaginatedList(programSectionsApi)

  const [managingSection, setManagingSection] = useState(null)

  const handleManageSubjects = (section) => {
    setManagingSection(section)
  }

  const handleCloseSubjects = () => {
    setManagingSection(null)
    refresh() // Refresh to get updated totals
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Sections</h1>
        <p className="text-sm text-gray-500">
          Manage subjects for each section. Each section can have different subjects with specific max marks.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All Sections</h3>
          <span className="text-xs text-gray-500">{sections.length} loaded</span>
        </div>

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
            <SectionsTable sections={sections} onManageSubjects={handleManageSubjects} />
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

      <SectionSubjectsModal
        open={managingSection !== null}
        section={managingSection}
        onClose={handleCloseSubjects}
      />
    </div>
  )
}
