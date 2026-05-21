import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fmt, pct, heatColor } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'
import { generateStudentPDF } from '../../utils/generateStudentPDF.js'

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

export default function StudentModalApi({ studentCode, filters, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    intAnalyticsApi
      .overviewStudentDetail(filters, studentCode)
      .then((j) => {
        if (cancelled) return
        setData(j)
        setErr(null)
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
  }, [studentCode, filters])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto bg-gray-900/60 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-5 top-5 flex gap-2">
          {data && !loading && (
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-md border border-brand-500 bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700"
              onClick={(e) => {
                e.preventDefault();
                console.log('PDF button clicked', { studentCode, data });
                generateStudentPDF(studentCode, data);
              }}
              aria-label="Download PDF"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="font-serif text-2xl font-semibold text-gray-900">
          Student {studentCode}
        </div>

        {loading && <div className="mt-8 text-sm text-gray-500">Loading…</div>}
        {err && <div className="mt-8 text-sm text-red-600">{err}</div>}

        {data && !loading && (
          <>
            <div className="mt-1 font-mono text-xs text-gray-500">
              {data.kind} · {data.records?.length || 0} test record
              {(data.records?.length || 0) !== 1 ? 's' : ''} in current selection
            </div>

            {data.totals && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="Total Score" value={fmt(data.totals.score)} tone="red700" />
                <Stat
                  label="Accuracy"
                  value={data.totals.accuracy.toFixed(1) + '%'}
                  tone="red600"
                />
                <Stat label="Correct" value={data.totals.right} tone="red500" />
                <Stat label="Wrong" value={data.totals.wrong} tone="red700" />
                <Stat label="Unattempted" value={data.totals.left} tone="gray" />
              </div>
            )}

            <SectionTitle>Strong Topics</SectionTitle>
            {(data.strongTopics || []).length === 0 ? (
              <div className="py-4 text-center">
                <div className="mb-2 text-2xl">📊</div>
                <div className="text-xs text-gray-600">No data available</div>
              </div>
            ) : (
              data.strongTopics.map((t) => (
                <div key={t.t} className="mb-2.5 flex items-center gap-3">
                  <div className="w-44 truncate text-right text-xs text-gray-600">{t.t}</div>
                  <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
                    <div
                      className="h-full rounded"
                      style={{ width: t.acc + '%', background: heatColor(t.acc) }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono text-xs font-semibold text-gray-800">
                    {t.acc.toFixed(0)}%
                  </div>
                </div>
              ))
            )}

            <SectionTitle>Focus Areas (weakest)</SectionTitle>
            {(data.weakTopics || []).map((t) => (
              <div key={t.t} className="mb-2.5 flex items-center gap-3">
                <div className="w-44 truncate text-right text-xs text-gray-600">{t.t}</div>
                <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded"
                    style={{ width: Math.max(2, t.acc) + '%', background: heatColor(t.acc) }}
                  />
                </div>
                <div className="w-12 text-right font-mono text-xs font-semibold text-gray-800">
                  {t.acc.toFixed(0)}%
                </div>
              </div>
            ))}

            <SectionTitle>Test-wise Breakdown</SectionTitle>
            <div className="overflow-auto rounded-md border border-gray-100">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {['Test', 'Subject', 'Score', 'R', 'W', 'L', 'Accuracy'].map((h) => (
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
                  {[...(data.records || [])]
                    .sort((a, b) => a.exam.localeCompare(b.exam))
                    .map((r, i) => (
                      <tr key={i}>
                        <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-[11px] text-gray-900">
                          {r.exam}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5 text-gray-700">
                          {r.subject}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                          {fmt(r.score)}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5">
                          <span className="rounded bg-brand-600 px-2 py-0.5 text-[11px] font-mono font-semibold text-white">
                            {r.right}
                          </span>
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5">
                          <span className="rounded border border-brand-500 bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-brand-700">
                            {r.wrong}
                          </span>
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5">
                          <span className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-600">
                            {r.left}
                          </span>
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                          {pct(r.right, r.att).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
