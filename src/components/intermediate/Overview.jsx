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
import { fmt, pct, heatColor, TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, AXIS_TICK } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

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

function KpiCard({ label, value, sub, tone, p, loading }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </div>
      {loading ? (
        <div className="mt-3 h-8 animate-pulse rounded bg-gray-100" />
      ) : (
        <>
          <div className={`mt-2 text-3xl font-semibold leading-none ${KPI_COLORS[tone]}`}>
            {value}
          </div>
          <div className="mt-1 text-xs text-gray-500">{sub}</div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${KPI_BAR_BG[tone]}`}
              style={{ width: Math.min(100, p) + '%' }}
            />
          </div>
        </>
      )}
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

export default function Overview({ filters, setModal, ready }) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [testAvg, setTestAvg] = useState(null)
  const [scoreRange, setScoreRange] = useState(null)
  const [accuracyData, setAccuracyData] = useState(null)
  const [attemptData, setAttemptData] = useState(null)
  const [trend, setTrend] = useState([])
  const [performers, setPerformers] = useState([])
  const [weakTopics, setWeakTopics] = useState([])

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    Promise.all([
      intAnalyticsApi.overviewTestAverage(filters),
      intAnalyticsApi.overviewHighestScore(filters),
      intAnalyticsApi.overviewAccuracy(filters),
      intAnalyticsApi.overviewAttemptRate(filters),
      intAnalyticsApi.overviewScoreTrend(filters),
      intAnalyticsApi.overviewTopPerformers(filters),
      intAnalyticsApi.overviewWeakestTopics(filters),
    ])
      .then(([avg, range, acc, att, tr, top, weak]) => {
        if (cancelled) return
        setTestAvg(avg)
        setScoreRange(range)
        setAccuracyData(acc)
        setAttemptData(att)
        setTrend(tr.trend || [])
        setPerformers(top.performers || [])
        setWeakTopics(weak.topics || [])
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, ready])

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and test type to load overview.
      </div>
    )
  }

  if (err) {
    return (
      <div className="py-16 text-center">
        <div className="mb-1 font-serif text-xl text-gray-800">Unable to load overview</div>
        <div className="text-sm text-gray-500">{err}</div>
      </div>
    )
  }

  const hasStudents = (testAvg?.students ?? 0) > 0
  const topScore = scoreRange?.top ?? 0

  const kcards = [
    {
      label: 'Test Average',
      value: testAvg?.avg != null ? fmt(testAvg.avg) : '—',
      sub:
        testAvg?.med != null
          ? `Median ${fmt(testAvg.med)} · ${testAvg?.testRecords ?? 0} attempts`
          : '—',
      tone: 'red600',
      p: testAvg?.avg != null && topScore ? pct(testAvg.avg, topScore) : 0,
    },
    {
      label: 'Highest Score',
      value: scoreRange?.top != null ? fmt(scoreRange.top) : '—',
      sub:
        scoreRange?.low != null ? `Lowest ${fmt(scoreRange.low)}` : '—',
      tone: 'red700',
      p: 100,
    },
    {
      label: 'Accuracy',
      value:
        accuracyData?.accuracy != null
          ? accuracyData.accuracy.toFixed(1) + '%'
          : '—',
      sub: 'of attempted questions',
      tone: 'red500',
      p: accuracyData?.accuracy ?? 0,
    },
    {
      label: 'Attempt Rate',
      value:
        attemptData?.attempt != null ? attemptData.attempt.toFixed(1) + '%' : '—',
      sub: 'of all questions',
      tone: 'red400',
      p: attemptData?.attempt ?? 0,
    },
  ]

  if (!loading && !hasStudents) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kcards.map((k) => (
          <KpiCard key={k.label} {...k} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Score Trend Across Tests">
          {loading ? (
            <WidgetSkeleton height={300} />
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
                <YAxis tick={AXIS_TICK} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#DA3438"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#DA3438' }}
                  name="Avg score"
                />
                <Line
                  type="monotone"
                  dataKey="top"
                  stroke="#7F1A1C"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  name="Topper"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Top Performers">
          {loading ? (
            <WidgetSkeleton height={300} />
          ) : (
            <div className="max-h-[300px] overflow-auto pr-1">
              {performers.map((s, i) => (
                <button
                  key={s.student}
                  type="button"
                  onClick={() => setModal(s.student)}
                  className="mb-2.5 flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-brand-50"
                >
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i < 3 ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {s.rank}
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
                        style={{ width: pct(s.avg || s.total, performers[0]?.avg || performers[0]?.total || 1) + '%' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="font-mono text-xs font-semibold text-gray-800">
                      {fmt(s.avg != null ? s.avg : s.total)}
                    </div>
                    <div className="text-[10px] text-gray-400">{(s.accuracy || 0).toFixed(0)}% acc</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Weakest Topics (lowest accuracy, min 8 questions)">
        {loading ? (
          <WidgetSkeleton height={120} />
        ) : weakTopics.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <div className="text-sm text-gray-600">No data available</div>
          </div>
        ) : (
          weakTopics.map((t) => (
            <div key={t.label} className="mb-2.5 flex items-center gap-3">
              <div className="w-44 truncate text-right text-xs text-gray-600" title={t.label}>
                {t.label}
              </div>
              <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: t.acc + '%', background: heatColor(t.acc) }}
                />
              </div>
              <div className="w-14 text-right font-mono text-xs font-semibold text-gray-800">
                {t.acc.toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
