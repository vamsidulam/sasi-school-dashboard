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

function KpiCard({ label, value, sub, tone, p }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </div>
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
    </div>
  )
}

export default function Overview({ summary, trend, analytics, ranked, setModal }) {
  const kcards = [
    { label: 'Class Average', value: fmt(summary.avg), sub: `Median ${fmt(summary.med)}`,              tone: 'red600', p: pct(summary.avg, summary.top) },
    { label: 'Highest Score', value: fmt(summary.top), sub: `Lowest ${fmt(summary.low)}`,              tone: 'red700', p: 100 },
    { label: 'Accuracy',      value: summary.accuracy.toFixed(1) + '%', sub: 'of attempted questions', tone: 'red500', p: summary.accuracy },
    { label: 'Attempt Rate',  value: summary.attempt.toFixed(1) + '%',  sub: 'of all questions',       tone: 'red400', p: summary.attempt },
  ]

  const top5 = [...ranked].sort((a, b) => b.total - a.total).slice(0, 8)
  const weakTopics = [...(analytics?.topic || [])]
    .filter((t) => t.n >= 8)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 8)

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kcards.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Score Trend Across Tests">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-32} textAnchor="end" height={70} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
              <Line type="monotone" dataKey="avg" stroke="#DA3438" strokeWidth={2.5} dot={{ r: 3, fill: '#DA3438' }} name="Avg score" />
              <Line type="monotone" dataKey="top" stroke="#7F1A1C" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Topper" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top Performers">
          <div className="max-h-[300px] overflow-auto pr-1">
            {top5.map((s, i) => (
              <button
                key={s.student}
                type="button"
                onClick={() => setModal(s.student)}
                className="mb-2.5 flex w-full items-center gap-3 rounded-md p-1.5 text-left transition hover:bg-brand-50"
              >
                <div className={`w-28 truncate font-mono text-xs ${i < 3 ? 'text-brand-600 font-semibold' : 'text-gray-600'}`}>
                  #{i + 1} · {s.student}
                </div>
                <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className={`h-full rounded ${i < 3 ? 'bg-brand-600' : 'bg-brand-300'} transition-all`}
                    style={{ width: pct(s.total, top5[0]?.total || 1) + '%' }}
                  />
                </div>
                <div className="w-14 text-right font-mono text-xs font-semibold text-gray-800">
                  {fmt(s.total)}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Weakest Topics (lowest accuracy, min 8 questions)">
        {weakTopics.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            <div className="mb-1 text-base font-medium text-gray-700">Not enough data</div>
            Topic-level analytics need at least 8 questions per topic.
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
