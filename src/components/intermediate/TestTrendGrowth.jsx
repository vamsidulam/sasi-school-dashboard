import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TOOLTIP_STYLE, AXIS_TICK, fmt } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

export default function TestTrendGrowth({ filters, ready }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [growthData, setGrowthData] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setGrowthData([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    intAnalyticsApi
      .testTrendGrowth(filters)
      .then((res) => {
        if (cancelled) return
        setGrowthData(res.growth || [])
        setSummary(res.summary || null)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          console.error('TestTrendGrowth error:', err)
        }
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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="py-16 text-center text-sm text-gray-500">
          Select filters to load growth analysis.
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="py-16 text-center">
          <div className="mb-1 font-serif text-xl text-gray-800">Unable to load growth data</div>
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
          <div className="font-mono text-xs tracking-[0.2em] text-gray-400">
            ANALYZING GROWTH…
          </div>
        </div>
      </div>
    )
  }

  if (!growthData.length) {
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
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">Avg Growth Rate</div>
            <div
              className={`mt-1 text-2xl font-semibold ${summary.avgGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {summary.avgGrowthRate > 0 ? '+' : ''}
              {fmt(summary.avgGrowthRate)}%
            </div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-xs font-medium text-green-700">Improving Tests</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {summary.improving}{' '}
              <span className="text-sm text-green-500">
                / {summary.totalComparisons}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-xs font-medium text-red-700">Declining Tests</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">
              {summary.declining}{' '}
              <span className="text-sm text-red-500">
                / {summary.totalComparisons}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Growth Rate Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          ◆ Growth Rate Between Consecutive Tests
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={growthData} margin={{ top: 10, right: 20, left: -6, bottom: 80 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ ...AXIS_TICK, fontSize: 10 }}
              interval={0}
              angle={-40}
              textAnchor="end"
              height={90}
            />
            <YAxis tick={AXIS_TICK} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: 'rgba(218,52,56,.05)' }}
              formatter={(value, name) => {
                if (name === 'Growth Rate') return `${value > 0 ? '+' : ''}${value}%`
                return value
              }}
            />
            <Bar dataKey="growthRate" name="Growth Rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {growthData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.improved ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Growth Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          ◆ Detailed Growth Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 pr-4 font-medium text-gray-600">Test</th>
                <th className="pb-2 pr-4 font-medium text-gray-600">vs Previous</th>
                <th className="pb-2 pr-4 text-right font-medium text-gray-600">Prev Avg</th>
                <th className="pb-2 pr-4 text-right font-medium text-gray-600">Curr Avg</th>
                <th className="pb-2 pr-4 text-right font-medium text-gray-600">Change</th>
                <th className="pb-2 text-right font-medium text-gray-600">Growth %</th>
              </tr>
            </thead>
            <tbody>
              {growthData.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <span className="font-mono text-xs font-medium text-gray-800">
                      {row.name}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-mono text-xs text-gray-500">{row.prevName}</span>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-xs text-gray-600">
                    {fmt(row.previousAvg)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-xs font-semibold text-gray-800">
                    {fmt(row.currentAvg)}
                  </td>
                  <td
                    className={`py-2 pr-4 text-right font-mono text-xs font-semibold ${row.improved ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {row.avgChange > 0 ? '+' : ''}
                    {fmt(row.avgChange)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono text-xs font-bold ${row.improved ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {row.growthRate > 0 ? '+' : ''}
                    {fmt(row.growthRate)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
