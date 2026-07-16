import { useEffect, useState } from 'react'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'
import { fmt, pct } from './utils.js'

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

export default function BranchAnalysis({ filters, ready }) {
  const [summary, setSummary] = useState(null)
  const [toppers, setToppers] = useState(null)
  const [buckets, setBuckets] = useState(null)
  const [subjectRanks, setSubjectRanks] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setErr(null)

    Promise.all([
      intAnalyticsApi.branchSummary(filters),
      intAnalyticsApi.branchToppers(filters),
      intAnalyticsApi.branchRangeBuckets(filters),
      intAnalyticsApi.branchSubjectRanks(filters),
      intAnalyticsApi.branchComparison(filters),
    ])
      .then(([sum, top, bkt, subRanks, comp]) => {
        if (cancelled) return
        setSummary(sum)
        setToppers(top)
        setBuckets(bkt)
        setSubjectRanks(subRanks)
        setComparison(comp)
      })
      .catch((e) => { if (!cancelled) setErr(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [filters, ready])

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and exam type to view branch analysis.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-700" />
        <div className="text-sm text-gray-500">Loading branch analysis…</div>
      </div>
    )
  }

  if (err) {
    return <div className="py-16 text-center text-sm text-red-600">{err}</div>
  }

  if (!summary?.branches?.length) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        No branch data available for the selected filters.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Students" value={summary.totalStudents} />
        <KpiCard label="Overall Avg Score" value={fmt(summary.overallAvg)} />
        <KpiCard
          label="Top Branch"
          value={summary.topBranch?.branch || '—'}
          sub={`Avg: ${fmt(summary.topBranch?.avgScore || 0)}`}
        />
        <KpiCard
          label="Weakest Branch"
          value={summary.weakestBranch?.branch || '—'}
          sub={`Avg: ${fmt(summary.weakestBranch?.avgScore || 0)}`}
        />
      </div>

      {/* Branch Comparison Bar Chart */}
      {comparison?.comparison?.length > 0 && (
        <>
          <SectionTitle>Branch-wise Average Score</SectionTitle>
          <div className="overflow-auto rounded-lg border border-gray-200 bg-white p-4">
            <div className="space-y-2.5">
              {comparison.comparison.map((b, i) => {
                const maxAvg = comparison.comparison[0]?.avgScore || 1
                const w = Math.max(5, (b.avgScore / maxAvg) * 100)
                return (
                  <div key={b.branch} className="flex items-center gap-3">
                    <span className="w-20 truncate text-xs font-medium text-gray-700">{b.branch}</span>
                    <div className="flex-1">
                      <div className="relative h-6 overflow-hidden rounded bg-gray-100">
                        <div
                          className={`h-full rounded transition-all ${i === 0 ? 'bg-green-500' : i === comparison.comparison.length - 1 ? 'bg-red-400' : 'bg-blue-400'}`}
                          style={{ width: w + '%' }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-gray-700">
                          {fmt(b.avgScore)}
                        </span>
                      </div>
                    </div>
                    <span className="w-16 text-right text-[11px] text-gray-500">{b.accuracy.toFixed(1)}% acc</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Branch Ranks Table */}
      <SectionTitle>Branch Rankings</SectionTitle>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Rank', 'Branch', 'Students', 'Avg Score', 'Accuracy'].map((h) => (
                <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.branches.map((b, i) => (
              <tr key={b.branch} className={i === 0 ? 'bg-green-50/50' : ''}>
                <td className="border-b border-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-600">{i + 1}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-900">{b.branch}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-mono text-gray-600">{b.students}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-mono font-semibold text-gray-900">{fmt(b.avgScore)}</td>
                <td className="border-b border-gray-100 px-3 py-2 font-mono text-gray-600">{b.accuracy.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Branch Toppers */}
      {toppers?.toppers?.length > 0 && (
        <>
          <SectionTitle>Topper in Each Branch</SectionTitle>
          <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Rank', 'Branch', 'Student Code', 'Name', 'Avg Score', 'Accuracy'].map((h) => (
                    <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toppers.toppers.map((t) => (
                  <tr key={t.branch}>
                    <td className="border-b border-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-600">{t.rank}</td>
                    <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-900">{t.branch}</td>
                    <td className="border-b border-gray-100 px-3 py-2 font-mono text-xs text-gray-600">{t.student}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-800">{t.studentName || t.student}</td>
                    <td className="border-b border-gray-100 px-3 py-2 font-mono font-semibold text-gray-900">{fmt(t.avg != null ? t.avg : t.total)}</td>
                    <td className="border-b border-gray-100 px-3 py-2 font-mono text-gray-600">{t.accuracy.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Range Buckets */}
      {buckets?.buckets?.length > 0 && (
        <>
          <SectionTitle>Student Score Distribution by Branch</SectionTitle>
          <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Branch', '≥90%', '80-89%', '70-79%', '60-69%', '50-59%', '<50%', 'Total'].map((h) => (
                    <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buckets.buckets.map((b) => (
                  <tr key={b.branch}>
                    <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-900">{b.branch}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center">
                      <span className="inline-block min-w-[24px] rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">{b.abv90}</span>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center">
                      <span className="inline-block min-w-[24px] rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800">{b.abv80}</span>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center">
                      <span className="inline-block min-w-[24px] rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800">{b.abv70}</span>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center">
                      <span className="inline-block min-w-[24px] rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">{b.abv60}</span>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center">
                      <span className="inline-block min-w-[24px] rounded bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-800">{b.abv50}</span>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center">
                      <span className="inline-block min-w-[24px] rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800">{b.blw50}</span>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-2 text-center font-mono font-bold text-gray-700">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Subject-wise Branch Ranks */}
      {subjectRanks?.subjects && Object.keys(subjectRanks.subjects).length > 0 && (
        <>
          <SectionTitle>Subject-wise Branch Rankings</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(subjectRanks.subjects).map(([sub, ranks]) => (
              <div key={sub} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-700">
                  {sub}
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500">#</th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500">Branch</th>
                      <th className="px-2 py-1.5 text-right text-[9px] font-semibold text-gray-500">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranks.map((r) => (
                      <tr key={r.branch} className={r.rank === 1 ? 'bg-green-50/50' : ''}>
                        <td className="border-t border-gray-50 px-2 py-1.5 font-mono font-bold text-gray-500">{r.rank}</td>
                        <td className="border-t border-gray-50 px-2 py-1.5 font-medium text-gray-800">{r.branch}</td>
                        <td className="border-t border-gray-50 px-2 py-1.5 text-right font-mono font-semibold text-gray-700">{fmt(r.avgScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
