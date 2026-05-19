import { useState } from 'react'
import { heatColor } from './utils.js'

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

export default function TopicMastery({ a }) {
  const [sub, setSub] = useState(false)
  const list = (sub ? a.subtopic : a.topic).filter((t) => t.n >= 4)

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
            Only {sub ? 'subtopics' : 'topics'} with ≥4 responses shown
          </span>
        </div>
      </div>
    </div>
  )
}
