import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { fmt } from './utils.js'
import { DUMMY_STUDENTS } from './dummyData.js'

const COLS = [
  ['rank', 'Rank'],
  ['student', 'Roll No'],
  ['studentName', 'Student Name'],
  ['branchName', 'Branch'],
  ['percentage', 'Avg %'],
  ['totalMarks', 'Total Marks'],
  ['exams', 'Exams'],
]

const CHIP = {
  g: 'bg-brand-600 text-white',
  r: 'bg-white border border-brand-500 text-brand-700',
  a: 'bg-gray-100 text-gray-600 border border-gray-200',
}

export default function Rankings({ onStudentClick }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('percentage')
  const [sortDir, setSortDir] = useState(-1)

  const ranked = useMemo(() => {
    let items = [...DUMMY_STUDENTS]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (s) => s.student.toLowerCase().includes(q) || s.studentName.toLowerCase().includes(q)
      )
    }
    items.sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return -1 * sortDir
      if (a[sortKey] > b[sortKey]) return 1 * sortDir
      return 0
    })
    const byPct = [...DUMMY_STUDENTS].sort((a, b) => b.percentage - a.percentage)
    const rankMap = {}
    byPct.forEach((o, i) => (rankMap[o.student] = i + 1))
    return items.map((o) => ({ ...o, rank: rankMap[o.student] }))
  }, [search, sortKey, sortDir])

  function sortBy(k) {
    if (sortKey === k) setSortDir((d) => -d)
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }
  const sArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <label className="text-sm font-semibold text-gray-700">Search Roll Number:</label>
        <div className="flex flex-1 max-w-md gap-2">
          <input
            type="text"
            placeholder="Enter roll number (e.g., 2301001)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          {ranked.length} students
        </span>
      </div>

      <div className="max-h-[640px] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {COLS.map(([k, l]) => (
                <th
                  key={k}
                  onClick={() => sortBy(k)}
                  className="cursor-pointer select-none border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 transition hover:text-brand-600"
                >
                  {l}
                  {sArrow(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((s) => (
              <tr
                key={s.student}
                onClick={() => onStudentClick?.(s.student)}
                className="cursor-pointer transition hover:bg-brand-50/60"
              >
                <td className="border-b border-gray-100 px-3 py-2.5 font-serif text-base font-semibold text-brand-600">
                  {s.rank}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-900">
                  {s.student}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 text-gray-800">
                  {s.studentName}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 text-gray-600">
                  {s.branchName}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                  {s.percentage.toFixed(1)}%
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.totalMarks}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.exams}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
