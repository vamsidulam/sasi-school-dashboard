export default function DashboardFilters({
  programs,
  exams,
  classStandards,
  programId,
  onProgramChange,
  examId,
  onExamChange,
  classStandardId,
  onClassStandardChange,
  loading,
}) {
  // Filter exams by selected program
  const filteredExams = programId
    ? exams.filter((e) => e.programId === programId)
    : []

  // Filter class standards by selected program
  const filteredClassStandards = programId
    ? classStandards.filter((cs) => cs.programId === programId)
    : []

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Field label="Program">
        <select
          value={programId}
          onChange={(e) => onProgramChange(e.target.value)}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          <option value="">{loading ? 'Loading…' : 'Select program'}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Exam">
        <select
          value={examId}
          onChange={(e) => onExamChange(e.target.value)}
          disabled={!programId || loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          <option value="">{!programId ? 'Select program first' : 'Select exam'}</option>
          {filteredExams.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Class Standard">
        <select
          value={classStandardId}
          onChange={(e) => onClassStandardChange(e.target.value)}
          disabled={!programId || loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          <option value="">All Classes</option>
          {filteredClassStandards.map((cs) => (
            <option key={cs.id} value={cs.id}>{cs.standardName}</option>
          ))}
        </select>
      </Field>

      <div className="ml-auto text-xs text-gray-500">
        Generated on{' '}
        <span className="font-medium text-gray-700">
          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  )
}
