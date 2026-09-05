import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { BRANCH_COLORS } from './dummyData.js'

// Donut chart from the PDF: each branch is a slice, labels show the mean %.
// `data` is [{ branch, pct }, ...].
export default function BranchAvgDonut({ data = [], height = 280 }) {
  if (!data.length) {
    return <div className="text-xs text-gray-400">No data</div>
  }
  const avg = data.reduce((s, d) => s + d.pct, 0) / data.length

  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="pct"
            nameKey="branch"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            label={({ pct }) => pct.toFixed(2)}
            labelLine={false}
          >
            {data.map((d) => (
              <Cell key={d.branch} fill={BRANCH_COLORS[d.branch] || '#94A3B8'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
            contentStyle={{ borderRadius: 6, fontSize: 12, border: '1px solid #E5E7EB' }}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="-ml-8 text-center sm:-ml-12">
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            State Avg
          </div>
          <div className="text-xl font-bold text-gray-900 tabular-nums">
            {avg.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}
