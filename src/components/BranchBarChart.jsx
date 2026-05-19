import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { colorFor } from '../lib/constants.js'

// `data` is an array of rows shaped for the chart, e.g.
//   [{ branch: 'VZH', avg_pct: 72.3 }, ...]
// `series` is the keys to plot from each row. If you pass a single string we
// render one series; if you pass an array we render grouped bars.
export default function BranchBarChart({
  data = [],
  xKey = 'branch',
  series = 'avg_pct',
  height = 300,
  yLabel = '%',
}) {
  const seriesList = Array.isArray(series) ? series : [series]
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 6, fontSize: 12, border: '1px solid #E5E7EB' }}
          />
          {seriesList.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {seriesList.map((key, i) => (
            <Bar key={key} dataKey={key} fill={colorFor(i)} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
