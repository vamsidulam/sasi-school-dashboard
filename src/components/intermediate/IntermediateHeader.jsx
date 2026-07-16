import { useState, useRef, useEffect } from 'react'

const STREAM_LABEL = { JSP: '· MPC', JSN: '· NEET' }

const TAB_DEFS = [
  ['overview', 'Overview'],
  ['branch', 'Branch Analysis'],
  ['diagnostics', 'Diagnostics'],
  ['leaderboard', 'Rankings'],
  ['topics', 'Topic Mastery'],
  ['difficulty', 'Difficulty & Type'],
  ['trend', 'Test Trend'],
]

function MultiSelectDropdown({ label: fieldLabel, items, value, onChange, allLabel, getItemLabel, disabled, minWidth = '160px' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = !value || value === 'ALL' ? [] : value.split(',').filter(Boolean)
  const allSelected = selected.length === 0

  const toggle = (id) => {
    if (allSelected) {
      onChange(id)
    } else if (selected.includes(id)) {
      const next = selected.filter((s) => s !== id)
      onChange(next.length ? next.join(',') : 'ALL')
    } else {
      onChange([...selected, id].join(','))
    }
  }

  const selectAll = () => onChange('ALL')

  const displayLabel = allSelected
    ? allLabel
    : selected.length === 1
      ? (getItemLabel(items.find((i) => i.id === selected[0])) || `1 selected`)
      : `${selected.length} selected`

  return (
    <div className="relative flex flex-col gap-1" style={{ minWidth }} ref={ref}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {fieldLabel}
      </span>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {displayLabel}
        <span className="float-right text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <label className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-900 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={selectAll}
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
            />
            {allLabel}
          </label>
          {items.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
              />
              {getItemLabel(item)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

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
  exams = [],
  exam,
  onExamChange,
  tab,
  onTabChange,
  studentsCount = 0,
  testsCount = 0,
  loadingFilters = false,
}) {
  return (
    <header className="rounded-t-xl border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-7">
        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-2.5 py-2.5">
          <MultiSelectDropdown
            label="Stream"
            items={streams}
            value={streamid}
            onChange={onStreamChange}
            allLabel="All streams"
            getItemLabel={(s) => s?.name ? `${s.name} ${STREAM_LABEL[s.name] || ''}`.trim() : s?.id}
            disabled={loadingFilters}
            minWidth="150px"
          />
          <MultiSelectDropdown
            label="Exam Type"
            items={examTypes}
            value={examtypeid}
            onChange={onExamTypeChange}
            allLabel="All exam types"
            getItemLabel={(t) => t?.name || t?.id}
            disabled={loadingFilters}
            minWidth="150px"
          />
          <MultiSelectDropdown
            label="Year"
            items={years}
            value={yearid}
            onChange={onYearChange}
            allLabel="All years"
            getItemLabel={(y) => y?.yearname || y?.name || y?.id}
            disabled={loadingFilters}
            minWidth="140px"
          />
          <MultiSelectDropdown
            label="Branch"
            items={branches}
            value={branchid}
            onChange={onBranchChange}
            allLabel="All branches"
            getItemLabel={(b) => b?.name || b?.id}
            disabled={loadingFilters}
            minWidth="160px"
          />
          <MultiSelectDropdown
            label="Exam"
            items={exams}
            value={exam}
            onChange={onExamChange}
            allLabel="All exams"
            getItemLabel={(e) => e?.label || e?.examname || e?.id}
            disabled={loadingFilters || !streamid || !yearid}
            minWidth="200px"
          />

          <div className="flex-1" />
          <span className="mb-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500">
            {studentsCount} Students · {testsCount} Tests
          </span>
          {loadingFilters && (
            <span className="pb-1 text-[10px] text-gray-400">Updating…</span>
          )}
        </div>

        {/* Tabs */}
        <div className="-mb-px flex flex-wrap gap-0 border-t border-gray-100">
          {TAB_DEFS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => onTabChange(k)}
              className={`border-b-2 px-3 py-2 text-xs font-medium transition ${
                tab === k
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
