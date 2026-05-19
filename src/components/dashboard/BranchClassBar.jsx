import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BRANCH_COLORS } from './dummyData.js'

// Branch-wise class % bar — mirrors the PDF "Branch Wise Class %" panel.
export default function BranchClassBar({ data = [], height = 260 }) {
  if (!data.length) {
    return <div className="text-xs text-gray-400">No data</div>
  }
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="branch" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" domain={[0, 100]} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, '%']}
            contentStyle={{ borderRadius: 6, fontSize: 12, border: '1px solid #E5E7EB' }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.branch} fill={BRANCH_COLORS[d.branch] || '#6366F1'} />
            ))}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v) => Number(v).toFixed(1)}
              style={{ fontSize: 11, fill: '#374151' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
