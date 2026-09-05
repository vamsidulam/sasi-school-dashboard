import { useMemo, useState } from 'react'
import { fmt, pct } from './utils.js'

export default function GrandCombined({ S, kind, scheme, setModal }) {
  const [gExam, setGExam] = useState('ALL')
  const [sk, setSk] = useState('total')
  const [sd, setSd] = useState(-1)

  const subs = S.subjects
  const sval = (c) => scheme[c] ?? 0

  const grandExams = useMemo(() => {
    const cnt = {}
    subs.forEach((sub) =>
      ((S.responses[kind] && S.responses[kind][sub]) || []).forEach((r) => {
        cnt[r.exam] = cnt[r.exam] || new Set()
        cnt[r.exam].add(sub)
      }),
    )
    return Object.entries(cnt)
      .filter(([, st]) => st.size >= 2)
      .map(([e]) => e)
      .sort()
  }, [S, kind, subs])

  const rows = useMemo(() => {
    const exams = gExam === 'ALL' ? grandExams : [gExam]
    const m = {}
    exams.forEach((ex) => {
      subs.forEach((sub) => {
        ;((S.responses[kind] && S.responses[kind][sub]) || []).forEach((r) => {
          if (r.exam !== ex) return
          let sc = 0, R = 0, W = 0, L = 0, att = 0, n = 0
          Object.values(r.resp).forEach((v) => {
            sc += sval(v)
            n++
            if (v === 'R') R++
            else if (v === 'W') W++
            else if (v === 'L') L++
            if (v !== 'L') att++
          })
          if (!m[r.student]) {
            m[r.student] = { student: r.student, sub: {}, total: 0, R: 0, W: 0, L: 0, att: 0, n: 0, tests: new Set() }
          }
          const o = m[r.student]
          o.sub[sub] = (o.sub[sub] || 0) + sc
          o.total += sc; o.R += R; o.W += W; o.L += L; o.att += att; o.n += n
          o.tests.add(ex)
        })
      })
    })

    let arr = Object.values(m).map((o) => ({
      ...o,
      tests: o.tests.size,
      accuracy: o.att ? (100 * o.R) / o.att : 0,
    }))
    const byTot = [...arr].sort((a, b) => b.total - a.total)
    const rmap = {}
    byTot.forEach((o, i) => (rmap[o.student] = i + 1))
    arr = arr.map((o) => ({ ...o, rank: rmap[o.student] }))

    const getv = (o, k) => (k.startsWith('__') ? o.sub[k.slice(2)] || 0 : o[k])
    arr.sort((a, b) => {
      const x = getv(a, sk), y = getv(b, sk)
      return (x < y ? -1 : x > y ? 1 : 0) * sd
    })
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S, kind, gExam, grandExams, subs, scheme, sk, sd])

  const sortBy = (k) => {
    if (sk === k) setSd((d) => -d)
    else { setSk(k); setSd(-1) }
  }
  const arrow = (k) => (sk === k ? (sd < 0 ? ' ↓' : ' ↑') : '')

  const stats = useMemo(() => {
    if (!rows.length) return null
    const t = rows.map((r) => r.total)
    const subAvg = {}
    subs.forEach((s) => {
      const v = rows.map((r) => r.sub[s] || 0)
      subAvg[s] = v.reduce((a, b) => a + b, 0) / rows.length
    })
    return {
      n: rows.length,
      avg: t.reduce((a, b) => a + b, 0) / t.length,
      top: Math.max(...t),
      low: Math.min(...t),
      subAvg,
    }
  }, [rows, subs])

  if (!grandExams.length) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        <div className="mb-1 text-lg font-medium text-gray-700">No combined Grand tests</div>
        This stream/kind has no exam spanning multiple subjects.
      </div>
    )
  }

  const subAvgMax = stats ? Math.max(...subs.map((x) => stats.subAvg[x])) : 1
  const thBase =
    'cursor-pointer select-none border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 transition hover:text-brand-600'

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 pb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Grand Test
          </label>
          <select
            value={gExam}
            onChange={(e) => setGExam(e.target.value)}
            className="min-w-[300px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All Grand tests (aggregate)</option>
            {grandExams.map((e) => (<option key={e} value={e}>{e}</option>))}
          </select>
        </div>
        <div className="flex-1" />
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-mono text-gray-600">
          COMBINED = {subs.join(' + ')} · click row for drilldown
        </span>
      </div>

      {stats && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Students</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{stats.n}</div>
            <div className="mt-1 text-xs text-gray-500">in this Grand selection</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Combined Average</div>
            <div className="mt-2 text-3xl font-semibold text-brand-600">{fmt(stats.avg)}</div>
            <div className="mt-1 text-xs text-gray-500">across {subs.length} subjects</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Highest Combined</div>
            <div className="mt-2 text-3xl font-semibold text-brand-700">{fmt(stats.top)}</div>
            <div className="mt-1 text-xs text-gray-500">Lowest {fmt(stats.low)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Subject Avg Split</div>
            <div className="mt-2">
              {subs.map((s) => (
                <div key={s} className="mb-1.5 flex items-center gap-2">
                  <div className="w-10 text-left font-mono text-[11px] text-gray-600">{s}</div>
                  <div className="relative h-3 flex-1 overflow-hidden rounded bg-gray-100">
                    <div
                      className="h-full rounded bg-brand-500"
                      style={{ width: pct(stats.subAvg[s], subAvgMax) + '%' }}
                    />
                  </div>
                  <div className="w-10 text-right font-mono text-[11px] font-semibold text-gray-800">
                    {fmt(stats.subAvg[s])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-h-[640px] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={thBase} onClick={() => sortBy('rank')}>Rank{arrow('rank')}</th>
              <th className={thBase} onClick={() => sortBy('student')}>Student{arrow('student')}</th>
              {subs.map((s) => (
                <th key={s} className={thBase} onClick={() => sortBy('__' + s)}>{s}{arrow('__' + s)}</th>
              ))}
              <th className={thBase} onClick={() => sortBy('total')}>Combined{arrow('total')}</th>
              <th className={thBase} onClick={() => sortBy('accuracy')}>Accuracy{arrow('accuracy')}</th>
              <th className={thBase} onClick={() => sortBy('tests')}>Tests{arrow('tests')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.student}
                onClick={() => setModal(r.student)}
                className="cursor-pointer transition hover:bg-brand-50/60"
              >
                <td className="border-b border-gray-100 px-3 py-2.5 font-serif text-base font-semibold text-brand-600">{r.rank}</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-900">{r.student}</td>
                {subs.map((s) => (
                  <td key={s} className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                    {fmt(r.sub[s] || 0)}
                  </td>
                ))}
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-base font-bold text-brand-600">
                  {fmt(r.total)}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">{r.accuracy.toFixed(1)}%</td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">{r.tests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
