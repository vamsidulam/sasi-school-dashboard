import { Link } from 'react-router-dom'
import { Settings, CalendarRange } from 'lucide-react'
import { useAcademicYear } from '../contexts/AcademicYearContext.jsx'

export default function Navbar() {
  const { academicYears, selectedYear, selectYear, loading } = useAcademicYear()

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <CalendarRange className="h-4 w-4 text-gray-500" />
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Academic Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => selectYear(e.target.value)}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          {loading && <option value="">Loading…</option>}
          {!loading && <option value="">-- Select Year --</option>}
          {academicYears.map((ay) => (
            <option key={ay.id} value={ay.id}>
              {ay.name || ay.id}
            </option>
          ))}
        </select>
      </div>

      <Link
        to="/settings"
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
      </Link>
    </header>
  )
}
