import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Users, ClipboardList, CalendarDays, TrendingUp } from 'lucide-react'
import KpiCard from '../components/KpiCard.jsx'
import BranchBarChart from '../components/BranchBarChart.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import {
  fetchLatestAggregate,
  fetchTotals,
  fetchRecentUploads,
} from '../lib/queries.js'
import { formatDate, formatDateTime, formatNumber, formatPercent } from '../lib/formatters.js'

export default function Overview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const branchFilter = searchParams.get('branch') || ''

  const [totals, setTotals] = useState(null)
  const [latest, setLatest] = useState(null)
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchTotals(), fetchLatestAggregate(), fetchRecentUploads(10)])
      .then(([t, agg, ups]) => {
        if (cancelled) return
        setTotals(t)
        setLatest(agg)
        setUploads(ups)
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
  }, [])

  const branchData = useMemo(() => {
    if (!latest?.branch_stats) return []
    const entries = Object.entries(latest.branch_stats).map(([branch, stats]) => ({
      branch,
      avg_pct: Number(stats?.avg_pct ?? 0),
      count: Number(stats?.count ?? 0),
    }))
    if (branchFilter) {
      return entries.filter((row) => row.branch === branchFilter)
    }
    return entries
  }, [latest, branchFilter])

  const branchOptions = useMemo(() => {
    if (!latest?.branch_stats) return []
    return Object.keys(latest.branch_stats).sort()
  }, [latest])

  if (loading) return <LoadingSpinner label="Loading overview…" />

  if (error) {
    return (
      <EmptyState
        title="Could not load overview"
        description={error.message || 'Firestore returned an error.'}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">
          Snapshot of latest exam performance across SASI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total students"
          value={formatNumber(totals?.totalStudents)}
          subtitle="Across all branches"
          icon={Users}
        />
        <KpiCard
          title="Total exams loaded"
          value={formatNumber(totals?.totalExams)}
          subtitle="All time"
          icon={ClipboardList}
        />
        <KpiCard
          title="Latest exam date"
          value={latest?.exam_date ? formatDate(latest.exam_date) : '—'}
          subtitle={latest?.exam_name || '—'}
          icon={CalendarDays}
        />
        <KpiCard
          title="Overall average %"
          value={latest?.overall_avg != null ? formatPercent(latest.overall_avg) : '—'}
          subtitle={latest?.total_students ? `${latest.total_students} students` : '—'}
          icon={TrendingUp}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Branch averages</h2>
            <p className="text-xs text-gray-500">
              {latest?.exam_name ? `From ${latest.exam_name}` : 'Latest exam'}
            </p>
          </div>
          {branchOptions.length ? (
            <div>
              <label className="sr-only" htmlFor="branchFilter">
                Filter by branch
              </label>
              <select
                id="branchFilter"
                value={branchFilter}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams)
                  if (e.target.value) next.set('branch', e.target.value)
                  else next.delete('branch')
                  setSearchParams(next)
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All branches</option>
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        {branchData.length ? (
          <BranchBarChart data={branchData} />
        ) : (
          <EmptyState
            title="No aggregate yet"
            description="No data — upload an exam to get started."
          />
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Recent uploads</h2>
        {uploads.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">By</th>
                  <th className="px-3 py-2 text-right">Rows</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uploads.map((u) => (
                  <tr key={u.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{formatDateTime(u.uploaded_at)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-700">{u.file_name}</td>
                    <td className="px-3 py-2 text-gray-700">{u.uploaded_by || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {u.rows_processed != null ? formatNumber(u.rows_processed) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <UploadStatusBadge status={u.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No uploads yet"
            description="No data — upload an exam to get started."
            action={
              <Link
                to="/upload"
                className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Go to upload
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}

function UploadStatusBadge({ status }) {
  const map = {
    SUCCESS: 'bg-green-50 text-green-700 border-green-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const cls = map[status] || 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status || 'UNKNOWN'}
    </span>
  )
}
