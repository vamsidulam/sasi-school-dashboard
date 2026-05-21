import { Users, FileBarChart2, ListChecks } from 'lucide-react'

const TABS = [
  { key: 'students', label: 'Students', icon: Users },
  { key: 'examresults', label: 'Exam Results', icon: FileBarChart2 },
  { key: 'topics', label: 'Question Topics', icon: ListChecks },
]

export default function IntermediateUploadTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-sm">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
