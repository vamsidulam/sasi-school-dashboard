import { fmt } from './utils.js'

const COLS = [
  ['rank', 'Rank'],
  ['student', 'Student Code'],
  ['total', 'Total'],
  ['right', 'Right'],
  ['wrong', 'Wrong'],
  ['left', 'Left'],
  ['accuracy', 'Accuracy %'],
  ['pctMark', 'Score %'],
  ['tests', 'Tests'],
]

// Pure red+white+neutral chips:
//   g (Right)  = filled red — "correct"
//   r (Wrong)  = outlined red — "needs attention"
//   a (Left)   = neutral gray — "skipped"
const CHIP = {
  g: 'bg-brand-600 text-white',
  r: 'bg-white border border-brand-500 text-brand-700',
  a: 'bg-gray-100 text-gray-600 border border-gray-200',
}

function Chip({ tone, children }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-mono font-semibold ${CHIP[tone]}`}>
      {children}
    </span>
  )
}

export default function Leaderboard({ ranked, sortBy, sArrow, search, setSearch, setModal }) {
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 pb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Search student code
          </label>
          <input
            type="text"
            placeholder="e.g. 172309072"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex-1" />
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-mono text-gray-600">
          Click any row for full student report ▸
        </span>
      </div>

      <div className="max-h-[640px] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {COLS.map(([k, l]) => (
                <th
                  key={k}
                  onClick={() => sortBy(k)}
                  className="cursor-pointer select-none border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 transition hover:text-brand-600"
                >
                  {l}
                  {sArrow(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((s) => (
              <tr
                key={s.student}
                onClick={() => setModal(s.student)}
                className="cursor-pointer transition hover:bg-brand-50/60"
              >
                <td className="border-b border-gray-100 px-3 py-2.5 font-serif text-base font-semibold text-brand-600">
                  {s.rank}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-900">
                  {s.student}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                  {fmt(s.total)}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5"><Chip tone="g">{s.right}</Chip></td>
                <td className="border-b border-gray-100 px-3 py-2.5"><Chip tone="r">{s.wrong}</Chip></td>
                <td className="border-b border-gray-100 px-3 py-2.5"><Chip tone="a">{s.left}</Chip></td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">{s.accuracy.toFixed(1)}%</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">{s.pctMark.toFixed(1)}%</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">{s.tests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
