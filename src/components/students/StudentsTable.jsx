import { Pencil, Trash2 } from 'lucide-react'

function StreamBadge({ isCollege }) {
  const cls = isCollege
    ? 'bg-brand-50 text-brand-700 border-brand-200'
    : 'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {isCollege ? 'College' : 'School'}
    </span>
  )
}

export default function StudentsTable({ students, onEdit, onDelete }) {
  if (!students.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No students yet — click "New student" to add one.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Roll no</th>
            <th className="px-3 py-2">Branch</th>
            <th className="px-3 py-2">Stream</th>
            <th className="px-3 py-2">Program</th>
            <th className="px-3 py-2 text-right">Academic Year</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((s) => (
            <tr key={s.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{s.rollNo}</td>
              <td className="px-3 py-2 text-gray-700">{s.branch}</td>
              <td className="px-3 py-2">
                <StreamBadge isCollege={s.isCollege} />
              </td>
              <td className="px-3 py-2 text-gray-700">{s.program}</td>
              <td className="px-3 py-2 text-right text-gray-700">{s.academicYear || '—'}</td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit?.(s)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    aria-label={`Edit ${s.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(s)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${s.name}`}
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
