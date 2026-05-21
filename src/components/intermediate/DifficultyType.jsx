import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts'
import { heatColor, TOOLTIP_STYLE, AXIS_TICK } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

const LEVEL_ORDER = ['Easy', 'Moderate', 'Difficult', 'Hard', 'Unspecified']

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

export default function DifficultyType({ filters, ready }) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [level, setLevel] = useState([])
  const [qtype, setQtype] = useState([])
  const [meta, setMeta] = useState({ minQuestions: 4, taggedAnswers: 0, totalAnswers: 0 })

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    intAnalyticsApi
      .insightsDifficultyType(filters)
      .then((res) => {
        if (cancelled) return
        setLevel(res.level || [])
        setQtype(res.qtype || [])
        setMeta({
          minQuestions: res.minQuestions ?? 4,
          taggedAnswers: res.taggedAnswers ?? 0,
          totalAnswers: res.totalAnswers ?? 0,
        })
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

  const lvl = [...level].sort(
    (x, y) => LEVEL_ORDER.indexOf(x.label) - LEVEL_ORDER.indexOf(y.label),
  )
  const qtypeFiltered = qtype
  const minN = meta.minQuestions
  const hasData = lvl.length > 0 || qtypeFiltered.length > 0

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and test type to load difficulty &amp; type analytics.
      </div>
    )
  }

  if (err) {
    return (
      <div className="py-16 text-center">
        <div className="mb-1 font-serif text-xl text-gray-800">Unable to load difficulty &amp; type</div>
        <div className="text-sm text-gray-500">{err}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
        <div className="text-sm text-gray-500">Loading difficulty &amp; type…</div>
      </div>
    )
  }

  if (meta.taggedAnswers === 0 && meta.totalAnswers > 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Accuracy by Difficulty Level">
        {lvl.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <div className="text-sm text-gray-600">No data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={lvl} margin={{ top: 10, right: 14, left: -10, bottom: 4 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" tick={{ ...AXIS_TICK, fill: '#4b5563', fontSize: 12 }} />
              <YAxis tick={AXIS_TICK} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(218,52,56,.06)' }} />
              <Bar dataKey="acc" name="Accuracy %" radius={[5, 5, 0, 0]} fill="#DA3438">
                {lvl.map((e, i) => (
                  <Cell key={i} fill={heatColor(e.acc)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Accuracy by Question Type">
        {qtypeFiltered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <div className="text-sm text-gray-600">No data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={qtypeFiltered} outerRadius={115}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="label" tick={{ ...AXIS_TICK, fill: '#4b5563' }} />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ ...AXIS_TICK, fontSize: 10 }}
                stroke="#e5e7eb"
              />
              <Radar
                dataKey="acc"
                stroke="#DA3438"
                fill="#DA3438"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Breakdown Table" className="lg:col-span-2">
        <div className="overflow-auto rounded-md border border-gray-100">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Category', 'Responses', 'Right', 'Wrong', 'Left', 'Accuracy'].map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...lvl, ...qtypeFiltered].map((t, i) => (
                <tr key={i} className="transition hover:bg-brand-50/40">
                  <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                    {t.label}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-800">
                    {t.n}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-mono font-semibold text-white">
                      {t.R}
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded border border-brand-500 bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-brand-700">
                      {t.W}
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-600">
                      {t.L}
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-700">
                    {t.acc.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
