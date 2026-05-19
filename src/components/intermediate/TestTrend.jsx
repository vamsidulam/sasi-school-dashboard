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
import { TOOLTIP_STYLE, AXIS_TICK } from './utils.js'

export default function TestTrend({ trend }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
        ◆ Test-by-Test Performance · average score and class average %
      </h3>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={trend} margin={{ top: 10, right: 20, left: -6, bottom: 90 }}>
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
  )
}
