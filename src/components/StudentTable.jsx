import { Link } from 'react-router-dom'
import { formatNumber, formatPercent, pctColor } from '../lib/formatters.js'

// Generic rank/student/score table. `rows` shape:
//   { rank, code, name, branch, total, percentage, grade? }
// `linkRows` controls whether name/code link to the student detail page.
export default function StudentTable({ rows = [], linkRows = true, showGrade = true }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2 text-right">Rank</th>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Branch</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">%</th>
            {showGrade ? <th className="px-3 py-2">Grade</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const code = row.code || row.student_code
            const name = row.name || row.student_name
            const total = row.total ?? row.total_marks
            const pct = row.percentage
            return (
              <tr
                key={`${code}-${i}`}
                className="bg-white hover:bg-gray-50 odd:bg-white even:bg-gray-50/40"
              >
                <td className="px-3 py-2 text-right font-medium text-gray-900">
                  {row.rank ?? i + 1}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">
                  {linkRows ? (
                    <Link to={`/students/${code}`} className="text-brand-600 hover:underline">
                      {code}
                    </Link>
                  ) : (
                    code
                  )}
                </td>
                <td className="px-3 py-2 text-gray-900">{name || '—'}</td>
                <td className="px-3 py-2 text-gray-600">{row.branch || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                  {formatNumber(total)}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${pctColor(pct)}`}>
                  {formatPercent(pct)}
                </td>
                {showGrade ? (
                  <td className="px-3 py-2 text-gray-600">{row.grade || '—'}</td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
