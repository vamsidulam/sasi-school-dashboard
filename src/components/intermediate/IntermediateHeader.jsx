const STREAM_LABEL = { JSP: '· MPC', JSN: '· NEET' }

const TAB_DEFS = [
  ['overview', 'Overview'],
  ['diagnostics', 'Diagnostics'],
  ['leaderboard', 'Rankings'],
  ['topics', 'Topic Mastery'],
  ['difficulty', 'Difficulty & Type'],
  ['trend', 'Test Trend'],
]

function PillGroup({ items, active, onChange, formatLabel, valueKey = 'value', labelKey = 'label' }) {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-md border border-white/30 bg-white/15 p-0.5">
      {items.map((it) => {
        const value = typeof it === 'string' ? it : it[valueKey]
        const label = formatLabel
          ? formatLabel(typeof it === 'string' ? it : it)
          : typeof it === 'string'
            ? it
            : it[labelKey]
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

const selectCls =
  'rounded-md border border-white/30 bg-white/15 px-2 py-1.5 text-xs font-medium text-white outline-none focus:border-white focus:ring-1 focus:ring-white/50'

export default function IntermediateHeader({
  streams = [],
  streamid,
  onStreamChange,
  examTypes = [],
  examtypeid,
  onExamTypeChange,
  years = [],
  yearid,
  onYearChange,
  branches = [],
  branchid,
  onBranchChange,
  academicYears = [],
  academicyearid,
  onAcademicYearChange,
  exams = [],
  exam,
  onExamChange,
  tab,
  onTabChange,
  studentsCount = 0,
  testsCount = 0,
  loadingFilters = false,
}) {
  const streamItems = streams.map((s) => ({
    value: s.id,
    label: `${s.name} ${STREAM_LABEL[s.name] || ''}`,
    name: s.name,
  }))

  const examTypeItems = examTypes.map((t) => ({
    value: t.id,
    label: t.name,
  }))

  return (
    <header className="bg-brand-500 border-b-2 border-brand-700 text-white shadow-md">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-7">
        <div className="flex flex-wrap items-center gap-3 py-3.5">
          {streamItems.length > 0 ? (
            <PillGroup
              items={streamItems}
              active={streamid}
              onChange={onStreamChange}
              valueKey="value"
              labelKey="label"
            />
          ) : null}

          {examTypeItems.length > 0 ? (
            <PillGroup
              items={examTypeItems}
              active={examtypeid}
              onChange={onExamTypeChange}
              valueKey="value"
              labelKey="label"
            />
          ) : null}

          <div className="flex-1" />

          <span className="rounded-md border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white">
            {studentsCount} STUDENTS · {testsCount} TESTS
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3 pb-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Year
            </span>
            <select
              value={yearid || ''}
              onChange={(e) => onYearChange(e.target.value)}
              className={selectCls}
              disabled={loadingFilters}
            >
              <option value="" className="text-gray-900">
                Select year
              </option>
              {years.map((y) => (
                <option key={y.id} value={y.id} className="text-gray-900">
                  {y.yearname}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Branch
            </span>
            <select
              value={branchid || ''}
              onChange={(e) => onBranchChange(e.target.value)}
              className={selectCls}
              disabled={loadingFilters}
            >
              <option value="" className="text-gray-900">
                All branches
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="text-gray-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Academic year
            </span>
            <select
              value={academicyearid || ''}
              onChange={(e) => onAcademicYearChange(e.target.value)}
              className={selectCls}
              disabled={loadingFilters}
            >
              <option value="" className="text-gray-900">
                All academic years
              </option>
              {academicYears.map((a) => (
                <option key={a.id} value={a.id} className="text-gray-900">
                  {a.label || a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Exam
            </span>
            <select
              value={exam || 'ALL'}
              onChange={(e) => onExamChange(e.target.value)}
              className={`${selectCls} min-w-[200px]`}
              disabled={loadingFilters || !streamid || !yearid}
            >
              <option value="ALL" className="text-gray-900">
                All exams
              </option>
              {exams.map((e) => (
                <option key={e.id} value={e.id} className="text-gray-900">
                  {e.label || e.examname}
                </option>
              ))}
            </select>
          </div>

          {loadingFilters ? (
            <span className="pb-1 text-[10px] text-white/60">Updating filters…</span>
          ) : null}
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
