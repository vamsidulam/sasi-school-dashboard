import { useEffect, useState } from 'react'
import { heatColor } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

function PillToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex gap-0.5 rounded-md border border-gray-200 bg-gray-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
            value === o.value
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function TopicMastery({ filters, ready }) {
  const [sub, setSub] = useState(false)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [topic, setTopic] = useState([])
  const [subtopic, setSubtopic] = useState([])
  const [meta, setMeta] = useState({ minQuestions: 4, taggedAnswers: 0, totalAnswers: 0 })

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    intAnalyticsApi
      .insightsTopicMastery(filters)
      .then((res) => {
        if (cancelled) return
        setTopic(res.topic || [])
        setSubtopic(res.subtopic || [])
        setMeta({
          minQuestions: res.minQuestions ?? 4,
          taggedAnswers: res.taggedAnswers ?? 0,
          totalAnswers: res.totalAnswers ?? 0,
        })
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

  const list = sub ? subtopic : topic
  const minN = meta.minQuestions

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and test type to load topic mastery.
      </div>
    )
  }

  if (err) {
    return (
      <div className="py-16 text-center">
        <div className="mb-1 font-serif text-xl text-gray-800">Unable to load topic mastery</div>
        <div className="text-sm text-gray-500">{err}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
        <div className="text-sm text-gray-500">Loading topic mastery…</div>
      </div>
    )
  }

  return (
    <div>
      <div className="pb-4">
        <PillToggle
          options={[
            { value: false, label: 'By Topic' },
            { value: true, label: 'By Subtopic' },
          ]}
          value={sub}
          onChange={setSub}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          ◆ {sub ? 'Subtopic' : 'Topic'} Mastery Heatmap — accuracy across all selected tests
        </h3>

        {meta.taggedAnswers === 0 && meta.totalAnswers > 0 ? (
          <div className="py-10 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <div className="text-sm text-gray-600">No data available</div>
          </div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <div className="text-sm text-gray-600">No data available</div>
          </div>
        ) : (
          <div className="grid gap-0">
            {list.map((t) => (
              <div key={t.label} className="mb-2.5 flex items-center gap-3">
                <div className="w-44 truncate text-right text-xs text-gray-600" title={t.label}>
                  {t.label}
                </div>
                <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: Math.max(2, t.acc) + '%', background: heatColor(t.acc) }}
                  />
                </div>
                <div className="w-12 text-right font-mono text-xs font-semibold text-gray-800">
                  {t.acc.toFixed(0)}%
                </div>
                <div className="flex w-28 shrink-0 gap-1.5">
                  <span className="rounded bg-brand-600 px-2 py-0.5 text-[10px] font-mono font-semibold text-white">
                    {t.R}R
                  </span>
                  <span className="rounded border border-brand-500 bg-white px-2 py-0.5 text-[10px] font-mono font-semibold text-brand-700">
                    {t.W}W
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded" style={{ background: heatColor(20) }} />
            &lt;40% critical
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded" style={{ background: heatColor(55) }} />
            40–70% developing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded" style={{ background: heatColor(85) }} />
            &gt;70% strong
          </span>
          <span className="text-gray-400">
            Only {sub ? 'subtopics' : 'topics'} with ≥{minN} responses shown
            {meta.taggedAnswers > 0
              ? ` · ${meta.taggedAnswers}/${meta.totalAnswers} answers tagged`
              : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
