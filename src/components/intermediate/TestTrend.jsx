import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TOOLTIP_STYLE, AXIS_TICK, fmt } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

export default function TestTrend({ filters, ready, useLegacyData = false, legacyTrend = [] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    // If using legacy offline data, skip API call
    if (useLegacyData) {
      setTrendData(legacyTrend)
      return
    }

    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setTrendData([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      intAnalyticsApi.testTrend(filters),
      intAnalyticsApi.testTrendSummary(filters),
    ])
      .then(([trendRes, summaryRes]) => {
        if (cancelled) return
        setTrendData(trendRes.trend || [])
        setSummary(summaryRes)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          console.error('TestTrend error:', err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, ready, useLegacyData, legacyTrend])

  if (!ready && !useLegacyData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="py-16 text-center text-sm text-gray-500">
          Select stream, year, and test type to load test trend.
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="py-16 text-center">
          <div className="mb-1 font-serif text-xl text-gray-800">Unable to load test trend</div>
          <div className="text-sm text-gray-500">{error}</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
          <div className="font-mono text-xs tracking-[0.2em] text-gray-400">LOADING TREND…</div>
        </div>
      </div>
    )
  }

  if (!trendData.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && !useLegacyData && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">Total Tests</div>
            <div className="mt-1 text-2xl font-semibold text-brand-600">{summary.totalTests}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">Students</div>
            <div className="mt-1 text-2xl font-semibold text-brand-600">
              {summary.totalStudents}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">Overall Avg</div>
            <div className="mt-1 text-2xl font-semibold text-brand-600">
              {summary.overallAvg ? fmt(summary.overallAvg) : '—'}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">Avg Growth</div>
            <div
              className={`mt-1 text-2xl font-semibold ${summary.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {summary.avgGrowth != null ? `${summary.avgGrowth > 0 ? '+' : ''}${fmt(summary.avgGrowth)}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          ◆ Test-by-Test Performance · average score and class average %
        </h3>
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: -6, bottom: 90 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ ...AXIS_TICK, fontSize: 10 }}
              interval={0}
              angle={-40}
              textAnchor="end"
              height={110}
            />
            <YAxis yAxisId="l" tick={AXIS_TICK} />
            <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={AXIS_TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(218,52,56,.05)' }} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'ui-monospace, monospace' }} />
            <Bar
              yAxisId="l"
              dataKey="avg"
              name="Avg score"
              fill="#DA3438"
              radius={[4, 4, 0, 0]}
              maxBarSize={34}
            />
            <Line
              yAxisId="r"
              type="monotone"
              dataKey="avgPct"
              name="Avg %"
              stroke="#7F1A1C"
              strokeWidth={2}
              dot={{ r: 3, fill: '#7F1A1C' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
