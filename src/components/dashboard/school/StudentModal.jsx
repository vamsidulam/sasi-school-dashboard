import { useEffect, useState } from 'react'
import { X, Download, User, TrendingUp, BookOpen } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { AXIS_TICK } from './utils.js'
import { analysisApi } from '../../../lib/sasiApi.js'
import { analysisApi as intermediateAnalysisApi } from '../../../lib/intermediateboardApi.js'
import { generateSchoolStudentPDF } from '../../../utils/generateSchoolStudentPDF.js'

export default function StudentModal({ student, onClose, classStandardId, useIntermediateApi }) {
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const studentCode = student?.student || student?.rollNo || student?.code || ''

  useEffect(() => {
    if (!studentCode) return
    let cancelled = false
    setLoading(true)
    setErr(null)

    const api = useIntermediateApi ? intermediateAnalysisApi : analysisApi
    api
      .studentDetail(studentCode, classStandardId)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [studentCode, classStandardId, useIntermediateApi])

  const handleDownloadPDF = () => {
    if (data) generateSchoolStudentPDF(studentCode, data)
  }

  // Derive chart data from API response — sort by exam date
  const exams = [...(data?.exams || [])].sort((a, b) => {
    if (a.date && b.date) return String(a.date).localeCompare(String(b.date))
    if (a.date) return -1
    if (b.date) return 1
    return 0
  })
  const subjectSummary = data?.subjectSummary || []
  const summary = data?.summary || {}

  const trendData = exams.map((e) => ({
    name: e.examName?.length > 15 ? e.examName.slice(0, 15) + '…' : e.examName,
    full: e.examName,
    percentage: e.percentage,
    total: e.totalMarks,
  }))

  // All unique subject names across exams for bar chart
  const subjectNames = [...new Set(exams.flatMap((e) => e.subjects.map((s) => s.subjectName)))]

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {data?.studentName || student?.studentName || studentCode}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-mono">{studentCode}</span>
                {(data?.branchName || student?.branchName) && (
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">
                    {data?.branchName || student?.branchName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && !loading && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex gap-1">
            {[['overview', 'Overview'], ['exams', 'Exam-wise']].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                  tab === k
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {l}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">Loading...</div>
          )}
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{err}</div>
          )}

          {!loading && !err && data && tab === 'overview' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Avg %</div>
                  <div className="mt-1 text-2xl font-semibold text-brand-600">
                    {summary.avgPercentage != null ? summary.avgPercentage + '%' : '—'}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total Marks</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {summary.totalMarks || 0}
                    {summary.totalMax ? <span className="text-sm text-gray-400">/{summary.totalMax}</span> : ''}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Best Exam</div>
                  {exams.length > 0 ? (() => {
                    const best = exams.reduce((b, e) => (e.percentage > b.percentage ? e : b))
                    return (
                      <>
                        <div className="mt-1 text-lg font-semibold text-green-600">{best.percentage}%</div>
                        <div className="truncate text-[10px] text-gray-400">{best.examName}</div>
                      </>
                    )
                  })() : <div className="mt-1 text-lg text-gray-400">—</div>}
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Exams</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalExams || 0}</div>
                </div>
              </div>

              {/* Performance Trend */}
              {trendData.length > 1 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <TrendingUp className="h-3.5 w-3.5" /> Performance Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} />
                      <YAxis tick={AXIS_TICK} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ''}
                      />
                      <Line type="monotone" dataKey="percentage" stroke="#DA3438" strokeWidth={2.5} dot={{ r: 4, fill: '#DA3438' }} name="Percentage" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subject-wise Performance */}
              {subjectSummary.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <BookOpen className="h-3.5 w-3.5" /> Subject-wise Average
                  </h3>
                  <div className="space-y-2">
                    {subjectSummary.map((s) => (
                      <div key={s.subjectId} className="flex items-center gap-3">
                        <div className="w-24 truncate text-right text-xs text-gray-600">{s.subjectName}</div>
                        <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
                          <div
                            className="h-full rounded bg-brand-500 transition-all"
                            style={{ width: (s.avgPercentage || 0) + '%' }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                            {s.avgPercentage != null ? s.avgPercentage + '%' : s.avgMarks}
                          </span>
                        </div>
                        <div className="w-20 text-right text-[10px] text-gray-400">
                          H:{s.highest} L:{s.lowest}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !err && data && tab === 'exams' && (
            <div className="space-y-6">
              {/* Exam comparison bar chart */}
              {exams.length > 0 && subjectNames.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Subject Marks Per Exam
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={exams.map((e) => {
                        const row = { exam: e.examName?.length > 12 ? e.examName.slice(0, 12) + '…' : e.examName }
                        e.subjects.forEach((s) => { row[s.subjectName] = s.marks })
                        return row
                      })}
                      margin={{ top: 6, right: 14, left: -8, bottom: 4 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="exam" tick={{ ...AXIS_TICK, fontSize: 10 }} />
                      <YAxis tick={AXIS_TICK} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                      />
                      {subjectNames.map((name, i) => (
                        <Bar
                          key={name}
                          dataKey={name}
                          fill={['#DA3438', '#7F1A1C', '#F87171', '#FCA5A5', '#3B82F6', '#60A5FA', '#10B981', '#F59E0B'][i % 8]}
                          radius={[2, 2, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Exam-wise detailed table */}
              {exams.length > 0 && (
                <div className="overflow-auto rounded-lg border border-gray-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Exam</th>
                        {subjectNames.map((name) => (
                          <th key={name} className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            {name.length > 5 ? name.slice(0, 5) : name}
                          </th>
                        ))}
                        <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</th>
                        <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((e) => (
                        <tr key={e.examId}>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">{e.examName}</td>
                          {subjectNames.map((name) => {
                            const subj = e.subjects.find((s) => s.subjectName === name)
                            return (
                              <td key={name} className="border-b border-gray-100 px-2 py-2.5 text-center font-mono text-gray-700">
                                {subj ? subj.marks : '—'}
                              </td>
                            )
                          })}
                          <td className="border-b border-gray-100 px-3 py-2.5 text-center font-mono font-semibold text-gray-900">
                            {e.totalMarks}{e.maxMarks ? `/${e.maxMarks}` : ''}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 text-center font-mono font-semibold text-brand-600">
                            {e.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {exams.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No exam data found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
