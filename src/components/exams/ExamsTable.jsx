import { Pencil, Trash2 } from 'lucide-react'

function TypeBadge({ type }) {
  const cls =
    type === 'Objective'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : 'bg-blue-50 text-blue-700 border-blue-200'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {type}
    </span>
  )
}

function BranchChips({ branches }) {
  if (!branches?.length) return <span className="text-xs text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {branches.map((b) => (
        <span
          key={b}
          className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700"
        >
          {b}
        </span>
      ))}
    </div>
  )
}

export default function ExamsTable({ exams, onEdit, onDelete }) {
  if (!exams.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No exams yet — click "New exam" to add one.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">Exam name</th>
            <th className="px-3 py-2">Program</th>
            <th className="px-3 py-2">Branches</th>
            <th className="px-3 py-2 text-right">Max marks</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {exams.map((e) => (
            <tr key={e.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-900">{e.name}</td>
              <td className="px-3 py-2 text-gray-700">{e.programName}</td>
              <td className="px-3 py-2">
                <BranchChips branches={e.branches} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{e.maxMarks}</td>
              <td className="px-3 py-2">
                <TypeBadge type={e.type} />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit?.(e)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    aria-label={`Edit ${e.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(e)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${e.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
