import { useState } from 'react'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import IntermediateAcademicYears from '../components/intermediate-pages/IntermediateAcademicYears.jsx'

// Dummy data — school side is placeholder until you wire a real API.
const DUMMY_SCHOOL_AYS = [
  { id: 'sy-2024-2025', name: '2024-2025' },
  { id: 'sy-2025-2026', name: '2025-2026' },
  { id: 'sy-2026-2027', name: '2026-2027' },
]

function SchoolAcademicYears() {
  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">School academic years</h2>
          <p className="text-sm text-gray-500">
            Showing placeholder data. Wire a real school-side API when ready.
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All academic years</h3>
          <span className="text-xs text-gray-500">{DUMMY_SCHOOL_AYS.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DUMMY_SCHOOL_AYS.map((y) => (
                <tr key={y.id} className="odd:bg-white even:bg-gray-50/40">
                  <td className="px-3 py-2 font-medium text-gray-900">{y.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default function AcademicYears() {
  const [tab, setTab] = useState('school')
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Academic Years</h1>
        <p className="text-sm text-gray-500">
          Manage school and intermediate academic year ranges.
        </p>
      </header>
      <SchoolIntermediateTabs active={tab} onChange={setTab} />
      {tab === 'school' ? <SchoolAcademicYears /> : <IntermediateAcademicYears />}
    </div>
  )
}
