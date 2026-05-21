import { useEffect, useMemo, useState } from 'react'
import { fmt } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

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

const CHIP = {
  g: 'bg-brand-600 text-white',
  r: 'bg-white border border-brand-500 text-brand-700',
  a: 'bg-gray-100 text-gray-600 border border-gray-200',
}

function Chip({ tone, children }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-mono font-semibold ${CHIP[tone]}`}
    >
      {children}
    </span>
  )
}

export default function Leaderboard({ filters, ready, setModal }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('total')
  const [sortDir, setSortDir] = useState(-1)

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setLoading(false)
      setItems([])
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    intAnalyticsApi
      .rankingsLeaderboard(filters)
      .then((res) => {
        if (cancelled) return
        setItems(res.items || [])
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, ready])

  const ranked = useMemo(() => {
    let a = [...items]
    if (search.trim()) {
      a = a.filter((x) => x.student.includes(search.trim()))
    }
    a.sort((x, y) => {
      const xv = x[sortKey]
      const yv = y[sortKey]
      return (xv < yv ? -1 : xv > yv ? 1 : 0) * sortDir
    })
    return a
  }, [items, search, sortKey, sortDir])

  function sortBy(k) {
    if (sortKey === k) setSortDir((d) => -d)
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }
  const sArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '')

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and test type to load rankings.
      </div>
    )
  }

  if (err) {
    return (
      <div className="py-16 text-center">
        <div className="mb-1 font-serif text-xl text-gray-800">Unable to load rankings</div>
        <div className="text-sm text-gray-500">{err}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
        <div className="text-sm text-gray-500">Loading rankings…</div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <label className="text-sm font-semibold text-gray-700">Search Roll Number:</label>
        <input
          type="text"
          placeholder="Enter roll number (e.g., 172309072)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          {ranked.length} of {items.length} students
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
                <td className="border-b border-gray-100 px-3 py-2.5">
                  <Chip tone="g">{s.right}</Chip>
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5">
                  <Chip tone="r">{s.wrong}</Chip>
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5">
                  <Chip tone="a">{s.left}</Chip>
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.accuracy.toFixed(1)}%
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.pctMark.toFixed(1)}%
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.tests}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
