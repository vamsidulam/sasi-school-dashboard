import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fmt, pct, AXIS_TICK } from './utils.js'
import { DUMMY_OVERVIEW, DUMMY_TREND, DUMMY_SUBJECT_PERFORMANCE, DUMMY_STUDENTS } from './dummyData.js'

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

export default function Overview({ onStudentClick }) {
  const data = DUMMY_OVERVIEW
  const trend = DUMMY_TREND
  const subjects = DUMMY_SUBJECT_PERFORMANCE
  const topPerformers = DUMMY_STUDENTS.slice(0, 8)

  const kcards = [
    {
      label: 'Avg Percentage',
      value: data.avgPercentage.toFixed(1) + '%',
      sub: `${data.totalStudents} students · ${data.totalExams} exams`,
      tone: 'red600',
      p: data.avgPercentage,
    },
    {
      label: 'Highest Avg',
      value: data.highestAvg.toFixed(1) + '%',
      sub: `Lowest ${data.lowestAvg.toFixed(1)}%`,
      tone: 'red700',
      p: 100,
    },
    {
      label: 'Top Branch',
      value: data.topBranch,
      sub: '72.5% avg',
      tone: 'red500',
      p: 72.5,
    },
    {
      label: 'Weakest Branch',
      value: data.weakestBranch,
      sub: '58.6% avg',
      tone: 'red400',
      p: 58.6,
    },
  ]

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kcards.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Score Trend Across Exams">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ ...AXIS_TICK, fontSize: 10 }}
                interval={0}
                angle={-32}
                textAnchor="end"
                height={70}
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
                          <div className="mt-0.5 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">{d.topperCode}</span>
                          </div>
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

        <Card title="Top Performers">
          <div className="max-h-[300px] overflow-auto pr-1">
            {topPerformers.map((s, i) => (
              <div
                key={s.student}
                onClick={() => onStudentClick?.(s.student)}
                className="mb-2.5 flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition hover:bg-brand-50"
              >
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i < 3 ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-xs font-semibold ${i < 3 ? 'text-brand-600' : 'text-gray-800'}`}>
                      {s.studentName}
                    </span>
                    {s.branchName && (
                      <span className="flex-shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                        {s.branchName}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-gray-400">{s.student}</div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${i < 3 ? 'bg-brand-600' : 'bg-brand-300'} transition-all`}
                      style={{ width: pct(s.percentage, topPerformers[0]?.percentage || 1) + '%' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="font-mono text-xs font-semibold text-gray-800">
                    {s.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Subject-wise Performance">
        {subjects.map((s) => (
          <div key={s.subject} className="mb-2.5 flex items-center gap-3">
            <div className="w-28 truncate text-right text-xs text-gray-600" title={s.subject}>
              {s.subject}
            </div>
            <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
              <div
                className="h-full rounded transition-all"
                style={{ width: s.avg + '%', background: `rgb(218, 52, 56)` }}
              />
            </div>
            <div className="w-14 text-right font-mono text-xs font-semibold text-gray-800">
              {s.avg.toFixed(1)}%
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
