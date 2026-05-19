const STREAM_LABEL = { JSP: '· MPC', JSN: '· NEET' }

const TAB_DEFS = [
  ['overview', 'Overview'],
  ['grand', 'Grand Combined'],
  ['leaderboard', 'Rankings'],
  ['topics', 'Topic Mastery'],
  ['difficulty', 'Difficulty & Type'],
  ['trend', 'Test Trend'],
]

function PillGroup({ items, active, onChange, formatLabel }) {
  return (
    <div className="flex gap-0.5 rounded-md border border-white/30 bg-white/15 p-0.5">
      {items.map((it) => {
        const value = typeof it === 'string' ? it : it.value
        const label = formatLabel ? formatLabel(value) : it
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`rounded px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
              active === value
                ? 'bg-white text-brand-600'
                : 'text-white/80 hover:text-white'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function IntermediateHeader({
  streams,
  stream,
  onStreamChange,
  kind,
  onKindChange,
  tab,
  onTabChange,
  studentsCount,
  testsCount,
}) {
  return (
    <header className="bg-brand-500 border-b-2 border-brand-700 text-white shadow-md">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-7">
        <div className="flex flex-wrap items-center gap-4 py-3.5">
          {/* <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-brand-600 font-bold text-lg shadow">
              S
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                SASI Educational Institutes
              </span>
              <span className="text-lg font-semibold">
                Test <span className="text-rose-100">Analytics</span> Console
              </span>
            </div>
          </div> */}

          <PillGroup
            items={streams}
            active={stream}
            onChange={onStreamChange}
            formatLabel={(s) => `${s} ${STREAM_LABEL[s] || ''}`}
          />

          <PillGroup
            items={['GRAND', 'INDIVIDUAL']}
            active={kind}
            onChange={onKindChange}
          />

          <div className="flex-1" />

          <span className="rounded-md border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white">
            {studentsCount} STUDENTS · {testsCount} TESTS
          </span>
        </div>

        <div className="flex flex-wrap gap-0 -mb-[2px]">
          {TAB_DEFS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => onTabChange(k)}
              className={`border-b-[3px] px-4 py-2.5 text-sm font-semibold tracking-wide transition ${
                tab === k
                  ? 'border-white text-white'
                  : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
