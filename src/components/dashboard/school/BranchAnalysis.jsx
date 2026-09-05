import { fmt, pct } from './utils.js'
import { DUMMY_BRANCHES, DUMMY_STUDENTS } from './dummyData.js'

function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</div>
      <div className="mt-1 font-serif text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="mt-6 mb-3 border-b border-gray-200 pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
      {children}
    </div>
  )
}

export default function BranchAnalysis() {
  const branches = DUMMY_BRANCHES
  const totalStudents = branches.reduce((s, b) => s + b.students, 0)
  const overallAvg = branches.reduce((s, b) => s + b.avgPercentage * b.students, 0) / totalStudents

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Students" value={totalStudents} />
        <KpiCard label="Overall Avg %" value={overallAvg.toFixed(1) + '%'} />
        <KpiCard
          label="Top Branch"
          value={branches[0]?.branch || '—'}
          sub={`${branches[0]?.avgPercentage}% avg`}
        />
        <KpiCard
          label="Weakest Branch"
          value={branches[branches.length - 1]?.branch || '—'}
          sub={`${branches[branches.length - 1]?.avgPercentage}% avg`}
        />
      </div>

      <SectionTitle>Branch-wise Average Percentage</SectionTitle>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-2.5">
          {branches.map((b, i) => {
            const maxAvg = branches[0]?.avgPercentage || 1
            const w = Math.max(5, (b.avgPercentage / maxAvg) * 100)
            return (
              <div key={b.branch} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs font-medium text-gray-700">{b.branch}</span>
                <div className="flex-1">
                  <div className="relative h-6 overflow-hidden rounded bg-gray-100">
                    <div
                      className={`h-full rounded transition-all ${i === 0 ? 'bg-green-500' : i === branches.length - 1 ? 'bg-red-400' : 'bg-blue-400'}`}
                      style={{ width: w + '%' }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-gray-700">
                      {b.avgPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <span className="w-20 text-right text-[11px] text-gray-500">{b.students} students</span>
              </div>
            )
          })}
        </div>
      </div>

      <SectionTitle>Branch Rankings</SectionTitle>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Rank', 'Branch', 'Students', 'Avg %', 'Top Student', 'Top %'].map((h) => (
                <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => (
              <tr key={b.branch} className={i === 0 ? 'bg-green-50/50' : ''}>
                <td className="border-b border-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-600">{i + 1}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-900">{b.branch}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-mono text-gray-600">{b.students}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-mono font-semibold text-gray-900">{b.avgPercentage.toFixed(1)}%</td>
                <td className="border-b border-gray-100 px-3 py-2 text-xs text-gray-700">{b.topStudent}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-mono font-semibold text-brand-600">{b.topPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>Topper in Each Branch</SectionTitle>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Rank', 'Branch', 'Roll No', 'Name', 'Avg %'].map((h) => (
                <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => {
              const topper = DUMMY_STUDENTS.find((s) => s.branchName === b.branch)
              return (
                <tr key={b.branch}>
                  <td className="border-b border-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-600">{i + 1}</td>
                  <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-900">{b.branch}</td>
                  <td className="border-b border-gray-100 px-3 py-2 font-mono text-gray-600">{topper?.student || '—'}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-800">{topper?.studentName || '—'}</td>
                  <td className="border-b border-gray-100 px-3 py-2 font-mono font-semibold text-brand-600">{b.topPct.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
