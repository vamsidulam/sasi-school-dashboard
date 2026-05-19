import { X } from 'lucide-react'

// Compact bar of dropdown / date / select filters. Each `filter` is shaped:
//   { key, label, type: 'select' | 'date', value, options? }
// Filter state lives in the URL via the calling page; this component is
// purely presentational and notifies via `onChange(key, value)`.
export default function FilterBar({ filters = [], onChange, onClear }) {
  const hasAnyValue = filters.some((f) => f.value)

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
      {filters.map((f) => (
        <div key={f.key} className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={f.value || ''}
              onChange={(e) => onChange(f.key, e.target.value || null)}
              className="block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">{f.placeholder || 'All'}</option>
              {(f.options || []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              value={f.value || ''}
              onChange={(e) => onChange(f.key, e.target.value || null)}
              className="block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          )}
        </div>
      ))}
      {hasAnyValue && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      ) : null}
    </div>
  )
}
