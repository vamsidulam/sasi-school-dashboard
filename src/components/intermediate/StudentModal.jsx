import { fmt, pct, heatColor } from './utils.js'

// All-red tonal hierarchy: deeper red = more weight (total, wrong);
// lighter red = lighter weight (correct, accuracy); gray for skipped.
const STAT_TONE = {
  red700: 'text-brand-700',
  red600: 'text-brand-600',
  red500: 'text-brand-500',
  red400: 'text-brand-400',
  gray: 'text-gray-500',
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </div>
      <div className={`mt-1.5 font-serif text-2xl font-semibold leading-none ${STAT_TONE[tone]}`}>
        {value}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="mt-6 mb-3 border-b-2 border-gray-200 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
      {children}
    </div>
  )
}

export default function StudentModal({ s, computed, onClose, kind }) {
  const recs = computed.records.filter((r) => r.student === s)
  const tot = recs.reduce(
    (a, r) => ({
      score: a.score + r.score,
      R: a.R + r.right,
      W: a.W + r.wrong,
      L: a.L + r.left,
      att: a.att + r.att,
      nQ: a.nQ + r.nQ,
    }),
    { score: 0, R: 0, W: 0, L: 0, att: 0, nQ: 0 },
  )

  const tg = {}
  recs.forEach((r) =>
    Object.values(r.per).forEach((p) => {
      if (!p.meta) return
      const t = p.meta.topic || 'Unspecified'
      if (!tg[t]) tg[t] = { t, R: 0, n: 0 }
      tg[t].n++
      if (p.v === 'R') tg[t].R++
    }),
  )
  const topics = Object.values(tg)
    .map((o) => ({ ...o, acc: pct(o.R, o.n) }))
    .sort((a, b) => b.n - a.n)
  const weak = [...topics].filter((t) => t.n >= 2).sort((a, b) => a.acc - b.acc).slice(0, 5)
  const strong = [...topics].filter((t) => t.n >= 2).sort((a, b) => b.acc - a.acc).slice(0, 5)
  const sortedRecs = [...recs].sort((a, b) => a.exam.localeCompare(b.exam))

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto bg-gray-900/60 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="font-serif text-2xl font-semibold text-gray-900">Student {s}</div>
        <div className="mt-1 font-mono text-xs text-gray-500">
          {kind} · {recs.length} test record{recs.length > 1 ? 's' : ''} in current selection
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Total Score" value={fmt(tot.score)} tone="red700" />
          <Stat label="Accuracy" value={pct(tot.R, tot.att).toFixed(1) + '%'} tone="red600" />
          <Stat label="Correct" value={tot.R} tone="red500" />
          <Stat label="Wrong" value={tot.W} tone="red700" />
          <Stat label="Unattempted" value={tot.L} tone="gray" />
        </div>

        <SectionTitle>Strong Topics</SectionTitle>
        {strong.length === 0 ? (
          <div className="text-sm text-gray-500">Not enough topic-tagged data.</div>
        ) : (
          strong.map((t) => (
            <div key={t.t} className="mb-2.5 flex items-center gap-3">
              <div className="w-44 truncate text-right text-xs text-gray-600">{t.t}</div>
              <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
                <div className="h-full rounded" style={{ width: t.acc + '%', background: heatColor(t.acc) }} />
              </div>
              <div className="w-12 text-right font-mono text-xs font-semibold text-gray-800">{t.acc.toFixed(0)}%</div>
            </div>
          ))
        )}

        <SectionTitle>Focus Areas (weakest)</SectionTitle>
        {weak.map((t) => (
          <div key={t.t} className="mb-2.5 flex items-center gap-3">
            <div className="w-44 truncate text-right text-xs text-gray-600">{t.t}</div>
            <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
              <div className="h-full rounded" style={{ width: Math.max(2, t.acc) + '%', background: heatColor(t.acc) }} />
            </div>
            <div className="w-12 text-right font-mono text-xs font-semibold text-gray-800">{t.acc.toFixed(0)}%</div>
          </div>
        ))}

        <SectionTitle>Test-wise Breakdown</SectionTitle>
        <div className="overflow-auto rounded-md border border-gray-100">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Test', 'Subject', 'Score', 'R', 'W', 'L', 'Accuracy'].map((h) => (
                  <th key={h} className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecs.map((r, i) => (
                <tr key={i}>
                  <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-[11px] text-gray-900">{r.exam}</td>
                  <td className="border-b border-gray-100 px-3 py-2.5 text-gray-700">{r.subject}</td>
                  <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">{fmt(r.score)}</td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-mono font-semibold text-white">{r.right}</span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded border border-brand-500 bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-brand-700">{r.wrong}</span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5">
                    <span className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-600">{r.left}</span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">{pct(r.right, r.att).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
