import { Pencil, Trash2, Settings } from 'lucide-react'

function BranchChips({ branchIds, allBranches }) {
  if (!branchIds?.length) return <span className="text-xs text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {branchIds.map((id) => {
        const branch = allBranches?.find((b) => b.id === id)
        return (
          <span
            key={id}
            className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700"
          >
            {branch?.code || branch?.name || id}
          </span>
        )
      })}
    </div>
  )
}

export default function ExamsTable({ exams, programs, branches: allBranches, onEdit, onDelete, onConfigure }) {
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
            <th className="px-3 py-2">Exam Name</th>
            <th className="px-3 py-2">Program</th>
            <th className="px-3 py-2">Branches</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {exams.map((e) => {
            const program = programs?.find((p) => p.id === e.programId)
            return (
              <tr key={e.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">{e.name}</td>
                <td className="px-3 py-2 text-gray-700">{program?.name || e.programId || '—'}</td>
                <td className="px-3 py-2">
                  <BranchChips branchIds={e.branches} allBranches={allBranches} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onConfigure?.(e)}
                      className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                      aria-label={`Configure marks for ${e.name}`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Marks
                    </button>
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
