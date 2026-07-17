import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { AXIS_TICK } from './utils.js'
import { DUMMY_TREND, DUMMY_BRANCHES } from './dummyData.js'

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {title ? (
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          ◆ {title}
        </h3>
      ) : null}
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="mt-6 mb-3 border-b border-gray-200 pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
      {children}
    </div>
  )
}

export default function TestTrend() {
  const trend = DUMMY_TREND

  const branchTrend = DUMMY_BRANCHES.map((b) => ({
    branch: b.branch,
    exam1: +(b.avgPercentage - 5 + Math.random() * 3).toFixed(1),
    exam2: +(b.avgPercentage - 2 + Math.random() * 3).toFixed(1),
    exam3: +(b.avgPercentage + Math.random() * 3).toFixed(1),
    exam4: +(b.avgPercentage + 2 + Math.random() * 2).toFixed(1),
  }))

  return (
    <div className="grid gap-4">
      <Card title="Overall Score Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ ...AXIS_TICK, fontSize: 10 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={AXIS_TICK} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                if (!d) return null
                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg min-w-[200px]">
                    <div className="mb-2 text-xs font-bold text-gray-800">{d.full}</div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#DA3438]" />
                        <span className="font-medium text-gray-600">Avg %</span>
                      </div>
                      <span className="font-bold text-[#DA3438]">{d.avg}%</span>
                    </div>
                    {d.topperName && (
                      <div className="mt-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 text-xs">{d.topperName}</span>
                          <span className="font-bold text-[#7F1A1C] text-sm">{d.top}%</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">{d.topperCode}</div>
                        {d.topperBranch && (
                          <div className="mt-0.5 text-[10px] text-gray-400">{d.topperBranch}</div>
                        )}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] text-gray-400">{d.students} students</div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#DA3438"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#DA3438' }}
              name="Avg %"
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
      </Card>

      <Card title="Branch-wise Comparison">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={branchTrend} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="branch" tick={{ ...AXIS_TICK, fontSize: 10 }} />
            <YAxis tick={AXIS_TICK} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="exam1" name="Unit Test 1" fill="#DA3438" radius={[2, 2, 0, 0]} />
            <Bar dataKey="exam2" name="Unit Test 2" fill="#7F1A1C" radius={[2, 2, 0, 0]} />
            <Bar dataKey="exam3" name="Mid Term" fill="#F87171" radius={[2, 2, 0, 0]} />
            <Bar dataKey="exam4" name="Unit Test 3" fill="#FCA5A5" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <SectionTitle>Exam Summary</SectionTitle>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Exam', 'Date', 'Avg %', 'Topper', 'Top %', 'Students'].map((h) => (
                <th key={h} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trend.map((t) => (
              <tr key={t.name}>
                <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">{t.full}</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-600">{t.date}</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">{t.avg}%</td>
                <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-700">{t.topperName}</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-gray-900">{t.top}%</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-600">{t.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
