// Generic branch-rank mini-table used by the state matrix and subject-rank grids.
// rows must already be sorted in display order.
export default function BranchRankTable({
  title,
  rows = [],
  valueKey = 'pct',
  valueLabel = '%',
  valueFormatter = (v) => v.toFixed(2),
  accent = 'text-emerald-700',
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className={`border-b border-gray-200 px-3 py-2 text-sm font-semibold ${accent}`}>
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-4 text-xs text-gray-400">No data</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              <th className="px-3 py-1.5">Br</th>
              <th className="px-3 py-1.5 text-right">Rnk</th>
              <th className="px-3 py-1.5 text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={row.branch + i} className="odd:bg-white even:bg-gray-50/40">
                <td className="px-3 py-1.5 font-medium text-gray-900">{row.branch}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-gray-600">{i + 1}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium text-gray-900">
                  {valueFormatter(Number(row[valueKey] ?? 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
