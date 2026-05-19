import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'

// Renders a bucketed distribution (e.g. >=95%, >=90%, ... <30%) as a bar chart.
// `data` is [{ label, value }, ...]. The last bucket gets a red fill to flag
// the below-30 cohort.
export default function DistributionChart({ data = [], height = 240, warnLastBucket = true }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 6, fontSize: 12, border: '1px solid #E5E7EB' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => {
              const isWarn = warnLastBucket && idx === data.length - 1
              return <Cell key={idx} fill={isWarn ? '#DC2626' : '#4F46E5'} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
