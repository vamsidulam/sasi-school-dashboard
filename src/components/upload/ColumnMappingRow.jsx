import { Trash2 } from 'lucide-react'

const FIELDS = [
  { key: 'tabName', label: 'Tab name', placeholder: 'e.g. Sheet1' },
  { key: 'columnHeading', label: 'Column heading', placeholder: 'e.g. E or NAME' },
  { key: 'collectionName', label: 'Collection name', placeholder: 'e.g. students' },
  { key: 'columnName', label: 'Column name', placeholder: 'e.g. Roll No' },
  { key: 'targetedAttribute', label: 'Targeted attribute', placeholder: 'e.g. rollNumber' },
]

export default function ColumnMappingRow({ index, mapping, onChange, onRemove, canRemove }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Mapping #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Remove mapping ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-gray-700">
            {field.label}
            <input
              type="text"
              value={mapping[field.key]}
              placeholder={field.placeholder}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
