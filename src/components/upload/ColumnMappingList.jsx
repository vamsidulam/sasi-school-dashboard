import { Plus } from 'lucide-react'
import ColumnMappingRow from './ColumnMappingRow.jsx'
import { emptyMapping } from './mapping.js'

export default function ColumnMappingList({ mappings, onChange }) {
  const updateField = (index, key, value) => {
    const next = mappings.map((m, i) => (i === index ? { ...m, [key]: value } : m))
    onChange(next)
  }

  const addRow = () => onChange([...mappings, emptyMapping()])

  const removeRow = (index) => {
    if (mappings.length <= 1) return
    onChange(mappings.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Column mappings</h3>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Add mapping
        </button>
      </div>
      <div className="space-y-3">
        {mappings.map((mapping, index) => (
          <ColumnMappingRow
            key={index}
            index={index}
            mapping={mapping}
            onChange={(key, value) => updateField(index, key, value)}
            onRemove={() => removeRow(index)}
            canRemove={mappings.length > 1}
          />
        ))}
      </div>
    </div>
  )
}
