// Horizontal "Count of Students - Written Exam" strip from the PDF.
export default function BranchCountStrip({ rows = [] }) {
  if (!rows.length) {
    return <div className="text-xs text-gray-400">No data</div>
  }
  const total = rows.reduce((sum, r) => sum + r.count, 0)
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">Branch</th>
            {rows.map((r) => (
              <th key={r.branch} className="px-3 py-2 text-center">
                {r.branch}
              </th>
            ))}
            <th className="px-3 py-2 text-center text-brand-700">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white">
            <td className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Count
            </td>
            {rows.map((r) => (
              <td
                key={r.branch}
                className="px-3 py-2 text-center text-sm font-semibold tabular-nums text-gray-900"
              >
                {r.count}
              </td>
            ))}
            <td className="px-3 py-2 text-center text-sm font-bold tabular-nums text-brand-700">
              {total}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
