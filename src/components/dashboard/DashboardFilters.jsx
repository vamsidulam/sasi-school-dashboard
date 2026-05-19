import { EXAM_OPTIONS, CLASS_OPTIONS } from './dummyData.js'

export default function DashboardFilters({ exam, onExamChange, klass, onClassChange }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Field label="Exam Name">
        <select
          value={exam}
          onChange={(e) => onExamChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {EXAM_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Class">
        <select
          value={klass}
          onChange={(e) => onClassChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {CLASS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>
      <div className="ml-auto text-xs text-gray-500">
        Generated on{' '}
        <span className="font-medium text-gray-700">
          {new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
        {label}
      </span>
      {children}
    </label>
  )
}
