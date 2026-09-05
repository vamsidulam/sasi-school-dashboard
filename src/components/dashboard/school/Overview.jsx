import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { pct, AXIS_TICK } from './utils.js'
import { dashboardApi } from '../../../lib/sasiApi.js'
import * as intBoardApi from '../../../lib/intermediateboardApi.js'
import { useAcademicYear } from '../../../contexts/AcademicYearContext.jsx'

const KPI_COLORS = {
  red700: 'text-brand-700',
  red600: 'text-brand-600',
  red500: 'text-brand-500',
  red400: 'text-brand-400',
}
const KPI_BAR_BG = {
  red700: 'bg-brand-700',
  red600: 'bg-brand-600',
  red500: 'bg-brand-500',
  red400: 'bg-brand-400',
}
const SUBJECT_TONES = ['red500', 'red400', 'red600', 'red700', 'red500', 'red400']

function KpiCard({ label, value, sub, tone, p, loading }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 truncate">
        {label}
      </div>
      {loading ? (
        <div className="mt-3 h-8 animate-pulse rounded bg-gray-100" />
      ) : (
        <>
          <div className={`mt-1.5 text-xl font-semibold leading-none ${KPI_COLORS[tone]}`}>
            {value}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 truncate">{sub}</div>
          <div className="mt-auto pt-2 h-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${KPI_BAR_BG[tone]}`}
              style={{ width: Math.min(100, p || 0) + '%' }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {title ? (
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          ◆ {title}
        </h3>
      ) : null}
      {children}
    </div>
  )
}

function WidgetSkeleton({ height = 200 }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-gray-200 bg-gray-50"
      style={{ height }}
    />
  )
}

export default function Overview({ onStudentClick, classStandardId, examId, branchId, label }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const { selectedYear } = useAcademicYear()

  const isIntermediate = label === 'Intermediate'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)

    const api = isIntermediate ? intBoardApi.dashboardApi : dashboardApi
    api.overview(classStandardId, selectedYear?.id, examId, branchId)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setErr(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [classStandardId, selectedYear?.id, isIntermediate, examId, branchId])

  if (err) {
    return (
      <div className="py-16 text-center">
        <div className="mb-1 font-serif text-xl text-gray-800">Unable to load overview</div>
        <div className="text-sm text-gray-500">{err}</div>
      </div>
    )
  }

  if (!loading && (!data || !data.kpis)) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available. Upload exam results first.</div>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const trend = data?.trend || []
  const subjects = data?.subjects || []
  const topPerformers = data?.topPerformers || []

  const kcards = [
    {
      label: 'Avg Percentage',
      value: kpis.avgPercentage != null ? `${kpis.avgPercentage}%` : '—',
      sub: `${kpis.totalStudents || 0} students · ${kpis.totalExams || 0} exams`,
      tone: 'red600',
      p: kpis.avgPercentage || 0,
    },
    {
      label: 'Highest',
      value: kpis.highestPct != null ? `${kpis.highestPct}%` : '—',
      sub: `Lowest ${kpis.lowestPct != null ? kpis.lowestPct + '%' : '—'}`,
      tone: 'red700',
      p: kpis.highestPct || 0,
    },
  ]

  return (
    <div className="grid gap-4">
      {/* KPI cards — single line, auto-shrink */}
      <div className="flex gap-3">
        {kcards.map((k) => (
          <div key={k.label} className="flex-1 min-w-0">
            <KpiCard {...k} loading={loading} />
          </div>
        ))}
        {subjects.map((s, i) => (
          <div key={s.subject} className="flex-1 min-w-0">
            <KpiCard
              label={`${s.subject}`}
              value={loading ? '—' : `${s.avgPct}%`}
              sub={loading ? '—' : `${s.avgMarks} / ${s.maxMarks}`}
              tone={SUBJECT_TONES[i % SUBJECT_TONES.length]}
              p={s.avgPct ?? 0}
              loading={loading}
            />
          </div>
        ))}
      </div>

      {/* Trend chart + Top Performers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Score Trend Across Exams">
          {loading ? (
            <WidgetSkeleton height={300} />
          ) : trend.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">No trend data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ ...AXIS_TICK, fontSize: 10 }}
                  interval={0}
                  angle={-32}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={AXIS_TICK} domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    if (!d) return null
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg min-w-[220px]">
                        <div className="mb-2 text-xs font-bold text-gray-800">{d.full}</div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#DA3438]" />
                            <span className="font-medium text-gray-600">Avg</span>
                          </div>
                          <span className="font-bold text-[#DA3438]">{d.avgPct}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-[11px] text-gray-500">Marks</span>
                          <span className="text-xs font-medium text-gray-700">{d.avgMarks}{d.maxMarks ? ` / ${d.maxMarks}` : ''}</span>
                        </div>
                        {d.topperName && (
                          <div className="mt-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900 text-xs">{d.topperName}</span>
                              <span className="font-bold text-[#7F1A1C] text-sm">{d.topPct}%</span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between">
                              <span className="text-[11px] text-gray-500">{d.topperCode}</span>
                              <span className="text-[11px] text-gray-600">{d.topMarks}{d.maxMarks ? `/${d.maxMarks}` : ''}</span>
                            </div>
                            {d.topperBranch && (
                              <div className="mt-0.5 text-[10px] text-gray-400">{d.topperBranch}</div>
                            )}
                          </div>
                        )}
                        <div className="mt-2 text-[10px] text-gray-400">{d.students} students</div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPct"
                  stroke="#DA3438"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#DA3438' }}
                  name="Avg %"
                />
                <Line
                  type="monotone"
                  dataKey="topPct"
                  stroke="#7F1A1C"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  name="Topper %"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Top Performers">
          {loading ? (
            <WidgetSkeleton height={300} />
          ) : topPerformers.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">No data</div>
          ) : (
            <div className="max-h-[300px] overflow-auto pr-1">
              {topPerformers.map((s, i) => (
                <button
                  key={s.student}
                  type="button"
                  onClick={() => onStudentClick?.(s.student)}
                  className="mb-2.5 flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-brand-50"
                >
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i < 3 ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-xs font-semibold ${i < 3 ? 'text-brand-600' : 'text-gray-800'}`}>
                        {s.studentName || s.student}
                      </span>
                      {s.branchName && (
                        <span className="flex-shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                          {s.branchName}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-gray-400">{s.student}</div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${i < 3 ? 'bg-brand-600' : 'bg-brand-300'} transition-all`}
                        style={{ width: pct(s.avgPct, topPerformers[0]?.avgPct || 1) + '%' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="font-mono text-xs font-semibold text-gray-800">
                      {s.avgPct}%
                    </div>
                    <div className="text-[10px] text-gray-400">{s.exams} exams</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Branch Performance */}
      {!loading && kpis.topBranch && (
        <Card title="Branch Performance">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green-600">Top Branch</div>
              <div className="mt-1 text-xl font-semibold text-green-800">{kpis.topBranch}</div>
              <div className="mt-0.5 text-sm text-green-600">{kpis.topBranchPct}% avg</div>
            </div>
            {kpis.weakestBranch && (
              <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-600">Weakest Branch</div>
                <div className="mt-1 text-xl font-semibold text-orange-800">{kpis.weakestBranch}</div>
                <div className="mt-0.5 text-sm text-orange-600">{kpis.weakestBranchPct}% avg</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
