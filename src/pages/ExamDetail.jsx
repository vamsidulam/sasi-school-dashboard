import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import KpiCard from '../components/KpiCard.jsx'
import BranchBarChart from '../components/BranchBarChart.jsx'
import StudentTable from '../components/StudentTable.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { fetchExam, fetchAggregate } from '../lib/queries.js'
import { SUBJECT_ORDER, SUBJECT_LABELS } from '../lib/constants.js'
import { formatDate, formatNumber, formatPercent, pctColor } from '../lib/formatters.js'

export default function ExamDetail() {
  const { examId } = useParams()
  const [exam, setExam] = useState(null)
  const [agg, setAgg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchExam(examId), fetchAggregate(examId)])
      .then(([e, a]) => {
        if (cancelled) return
        setExam(e)
        setAgg(a)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [examId])

  // Branch ranking sorted by avg percentage (desc).
  const branchRanking = useMemo(() => {
    if (!agg?.branch_stats) return []
    return Object.entries(agg.branch_stats)
      .map(([branch, stats]) => ({
        branch,
        count: stats?.count ?? 0,
        avg_pct: stats?.avg_pct ?? 0,
        abv_95: stats?.abv_95 ?? 0,
        abv_90: stats?.abv_90 ?? 0,
        abv_85: stats?.abv_85 ?? 0,
        abv_80: stats?.abv_80 ?? 0,
        blw_30: stats?.blw_30 ?? 0,
        subject_avg: stats?.subject_avg || {},
      }))
      .sort((a, b) => b.avg_pct - a.avg_pct)
      .map((row, i) => ({ ...row, rank: i + 1 }))
  }, [agg])

  // Subject-wise data flat-shaped for grouped bars by branch.
  // Each row = { subject, VZH: 71, TNK: 68, ... }
  const subjectData = useMemo(() => {
    if (!branchRanking.length) return { rows: [], branches: [] }
    const branches = branchRanking.map((b) => b.branch)
    const subjectsSet = new Set()
    branchRanking.forEach((b) =>
      Object.keys(b.subject_avg || {}).forEach((s) => subjectsSet.add(s)),
    )
    const ordered = SUBJECT_ORDER.filter((s) => subjectsSet.has(s)).concat(
      [...subjectsSet].filter((s) => !SUBJECT_ORDER.includes(s)),
    )
    const rows = ordered.map((subj) => {
      const row = { subject: SUBJECT_LABELS[subj] || subj }
      branchRanking.forEach((b) => {
        row[b.branch] = Number(b.subject_avg?.[subj] ?? 0)
      })
      return row
    })
    return { rows, branches }
  }, [branchRanking])

  const top30 = agg?.top_30_students || []

  if (loading) return <LoadingSpinner label="Loading exam…" />
  if (error) {
    return (
      <EmptyState
        title="Could not load exam"
        description={error.message || 'Firestore returned an error.'}
      />
    )
  }
  if (!exam) {
    return (
      <EmptyState
        title="Exam not found"
        description="This exam ID doesn't exist in Firestore."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/exams"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          All exams
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{exam.name}</h1>
            <p className="text-sm text-gray-500">
              {formatDate(exam.date)} · {exam.program} · {exam.format}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">Max marks</div>
            <div className="text-lg font-semibold text-gray-900">{formatNumber(exam.max_marks)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total students"
          value={formatNumber(agg?.total_students ?? exam.student_count)}
        />
        <KpiCard
          title="Overall average"
          value={agg?.overall_avg != null ? formatPercent(agg.overall_avg) : '—'}
        />
        <KpiCard
          title="Branches appeared"
          value={formatNumber((exam.branches_appeared || []).length)}
          subtitle={(exam.branches_appeared || []).join(', ') || '—'}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Branch ranking</h2>
        {branchRanking.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-right">Rank</th>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2 text-right">Count</th>
                  <th className="px-3 py-2 text-right">Avg %</th>
                  <th className="px-3 py-2 text-right">≥ 95%</th>
                  <th className="px-3 py-2 text-right">≥ 90%</th>
                  <th className="px-3 py-2 text-right">&lt; 30%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branchRanking.map((b) => (
                  <tr key={b.branch} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{b.rank}</td>
                    <td className="px-3 py-2 text-gray-900">{b.branch}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {formatNumber(b.count)}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums font-medium ${pctColor(b.avg_pct)}`}>
                      {formatPercent(b.avg_pct)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {formatNumber(b.abv_95)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {formatNumber(b.abv_90)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-600">
                      {formatNumber(b.blw_30)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No aggregate data"
            description="No branch breakdown available for this exam yet."
          />
        )}
      </section>

      {branchRanking.length ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Branch averages</h2>
          <BranchBarChart data={branchRanking} xKey="branch" series="avg_pct" />
        </section>
      ) : null}

      {subjectData.rows.length && subjectData.branches.length ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Subject averages by branch</h2>
          <BranchBarChart
            data={subjectData.rows}
            xKey="subject"
            series={subjectData.branches}
            height={320}
          />
        </section>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Top 30 students</h2>
          {top30.length ? (
            <button
              type="button"
              onClick={() => downloadTopThirtyCsv(exam, top30)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          ) : null}
        </div>
        {top30.length ? (
          <StudentTable rows={top30} />
        ) : (
          <EmptyState title="No top performers" description="Top 30 not computed for this exam." />
        )}
      </section>
    </div>
  )
}

function downloadTopThirtyCsv(exam, rows) {
  const headers = ['rank', 'code', 'name', 'branch', 'total', 'percentage']
  const lines = [headers.join(',')]
  rows.forEach((r) => {
    lines.push(
      [
        r.rank ?? '',
        r.code ?? '',
        csvEscape(r.name ?? ''),
        r.branch ?? '',
        r.total ?? '',
        r.percentage ?? '',
      ].join(','),
    )
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `top30_${exam.id || 'exam'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function csvEscape(value) {
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}
