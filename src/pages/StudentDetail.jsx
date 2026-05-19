import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import BranchBarChart from '../components/BranchBarChart.jsx'
import { fetchStudent, fetchResultsForStudent } from '../lib/queries.js'
import { SUBJECT_ORDER, SUBJECT_LABELS } from '../lib/constants.js'
import {
  formatDate,
  formatNumber,
  formatPercent,
  pctColor,
  toDate,
} from '../lib/formatters.js'

export default function StudentDetail() {
  const { studentCode } = useParams()
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState('desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchStudent(studentCode), fetchResultsForStudent(studentCode)])
      .then(([s, r]) => {
        if (cancelled) return
        setStudent(s)
        setResults(r)
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
  }, [studentCode])

  // Trend data: oldest → newest, percentage by exam date.
  const trendData = useMemo(() => {
    return [...results]
      .filter((r) => !r.is_absent && r.percentage != null)
      .sort((a, b) => (toDate(a.exam_date)?.getTime() || 0) - (toDate(b.exam_date)?.getTime() || 0))
      .map((r) => ({
        label: r.exam_name || r.exam_id,
        date: formatDate(r.exam_date, 'd MMM'),
        percentage: Number(r.percentage) || 0,
      }))
  }, [results])

  const subjectAvgRows = useMemo(() => {
    const totals = {}
    const counts = {}
    results.forEach((r) => {
      if (r.is_absent || !r.subjects) return
      Object.entries(r.subjects).forEach(([subj, v]) => {
        const main = Number(v?.main)
        if (Number.isFinite(main)) {
          totals[subj] = (totals[subj] || 0) + main
          counts[subj] = (counts[subj] || 0) + 1
        }
      })
    })
    const subjects = Object.keys(totals)
    const ordered = SUBJECT_ORDER.filter((s) => subjects.includes(s)).concat(
      subjects.filter((s) => !SUBJECT_ORDER.includes(s)),
    )
    return ordered.map((s) => ({
      subject: SUBJECT_LABELS[s] || s,
      avg: Number((totals[s] / counts[s]).toFixed(2)),
    }))
  }, [results])

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const da = toDate(a.exam_date)?.getTime() || 0
      const dbt = toDate(b.exam_date)?.getTime() || 0
      return sort === 'asc' ? da - dbt : dbt - da
    })
  }, [results, sort])

  if (loading) return <LoadingSpinner label="Loading student…" />
  if (error) {
    return (
      <EmptyState
        title="Could not load student"
        description={error.message || 'Firestore returned an error.'}
      />
    )
  }
  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="No student record exists for this code."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/students"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          All students
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500">
              <span className="font-mono">{studentCode}</span> · {student.branch} · Section{' '}
              {student.section} · {student.program}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Class {student.class || '—'} · {student.academic_year || '—'} ·{' '}
              {student.gender === 'F' ? 'Female' : student.gender === 'M' ? 'Male' : '—'}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Percentage trend</h2>
        {trendData.length ? (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: 6, fontSize: 12, border: '1px solid #E5E7EB' }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ''}
                  formatter={(v) => [`${v}%`, 'Percentage']}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No exam history"
            description="No exam results recorded for this student yet."
          />
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">All exam results</h2>
          <button
            type="button"
            onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Sort: {sort === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
        {sortedResults.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Exam</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">%</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2 text-right">Sec rank</th>
                  <th className="px-3 py-2 text-right">Class rank</th>
                  <th className="px-3 py-2 text-right">Branch rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedResults.map((r) => (
                  <tr
                    key={r.id}
                    className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 text-gray-700">{formatDate(r.exam_date)}</td>
                    <td className="px-3 py-2 text-gray-900">
                      <Link
                        to={`/exams/${r.exam_id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {r.exam_name || r.exam_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {r.is_absent ? 'Absent' : formatNumber(r.total_marks)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums font-medium ${pctColor(r.percentage)}`}
                    >
                      {r.is_absent ? '—' : formatPercent(r.percentage)}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{r.grade || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {r.section_rank ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {r.class_rank ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {r.branch_rank ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No results" description="No exam results yet." />
        )}
      </section>

      {subjectAvgRows.length ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Subject-wise average across exams
          </h2>
          <BranchBarChart
            data={subjectAvgRows}
            xKey="subject"
            series="avg"
            yLabel="Marks"
            height={260}
          />
        </section>
      ) : null}
    </div>
  )
}
