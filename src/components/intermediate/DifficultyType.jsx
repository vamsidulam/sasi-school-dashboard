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

export default function DifficultyType({ a }) {
  const lvl = [...a.level].sort(
    (x, y) => LEVEL_ORDER.indexOf(x.label) - LEVEL_ORDER.indexOf(y.label),
  )
  const qtype = a.qtype.filter((t) => t.n >= 4)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Accuracy by Difficulty Level">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={lvl} margin={{ top: 10, right: 14, left: -10, bottom: 4 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" tick={{ ...AXIS_TICK, fill: '#4b5563', fontSize: 12 }} />
            <YAxis tick={AXIS_TICK} domain={[0, 100]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(218,52,56,.06)' }} />
            <Bar dataKey="acc" name="Accuracy %" radius={[5, 5, 0, 0]} fill="#DA3438">
              {lvl.map((e, i) => (<Cell key={i} fill={heatColor(e.acc)} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Accuracy by Question Type">
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={qtype} outerRadius={115}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="label" tick={{ ...AXIS_TICK, fill: '#4b5563' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ ...AXIS_TICK, fontSize: 10 }} stroke="#e5e7eb" />
            <Radar dataKey="acc" stroke="#DA3438" fill="#DA3438" fillOpacity={0.35} strokeWidth={2} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </RadarChart>
        </ResponsiveContainer>
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
              {[...lvl, ...a.qtype].map((t, i) => (
                <tr key={i} className="transition hover:bg-brand-50/40">
                  <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                    {t.label}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-800">{t.n}</td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-mono font-semibold text-white">{t.R}</span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded border border-brand-500 bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-brand-700">{t.W}</span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-600">{t.L}</span>
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
