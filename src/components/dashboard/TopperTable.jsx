// One row per branch, showing the highest scorer in that branch.
export default function TopperTable({
  rows = [],
  valueLabel = '%',
  valueFormatter = (v) => Number(v).toFixed(2),
}) {
  if (!rows.length) {
    return <div className="text-xs text-gray-400">No data</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <th className="w-8 px-3 py-2 text-right">#</th>
            <th className="px-3 py-2">Br</th>
            <th className="px-3 py-2">Roll No</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr
              key={`${row.branch}-${i}`}
              className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50"
            >
              <td className="px-3 py-1.5 text-right tabular-nums text-gray-500">{i + 1}</td>
              <td className="px-3 py-1.5 font-medium text-gray-900">{row.branch}</td>
              <td className="px-3 py-1.5 font-mono text-xs text-gray-600">{row.rollNo || '—'}</td>
              <td className="px-3 py-1.5 text-gray-800">{row.name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-emerald-700">
                {valueFormatter(row.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
