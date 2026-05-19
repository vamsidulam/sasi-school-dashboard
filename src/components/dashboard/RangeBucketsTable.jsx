// Color-coded count buckets table — mirrors PDF "Student Overall % Avg - Count Between Range".
// `columns` is the bucket spec: [{ key, label, tone }] where tone is a tailwind bg class.
// `rows` is [{ branch, [key]: count, ... }].
const DEFAULT_DESC_COLUMNS = [
  { key: 'abv95', label: 'Abv 95%', tone: 'bg-emerald-100 text-emerald-800' },
  { key: 'abv90', label: 'Abv 90%', tone: 'bg-sky-100 text-sky-800' },
  { key: 'abv85', label: 'Abv 85%', tone: 'bg-pink-100 text-pink-800' },
  { key: 'abv80', label: 'Abv 80%', tone: 'bg-amber-100 text-amber-800' },
  { key: 'blw30', label: 'Blw 30%', tone: 'bg-red-100 text-red-800' },
]

const DEFAULT_SKILL_COLUMNS = [
  { key: 'abv90', label: 'Abv 90', tone: 'bg-emerald-100 text-emerald-800' },
  { key: 'abv80', label: 'Abv 80', tone: 'bg-sky-100 text-sky-800' },
  { key: 'abv70', label: 'Abv 70', tone: 'bg-pink-100 text-pink-800' },
  { key: 'abv60', label: 'Abv 60', tone: 'bg-amber-100 text-amber-800' },
  { key: 'abv50', label: 'Abv 50', tone: 'bg-orange-100 text-orange-800' },
]

export default function RangeBucketsTable({ rows = [], variant = 'desc', columns }) {
  if (!rows.length) {
    return <div className="text-xs text-gray-400">No data</div>
  }
  const cols =
    columns || (variant === 'skill' ? DEFAULT_SKILL_COLUMNS : DEFAULT_DESC_COLUMNS)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">Branch</th>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-center">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.branch} className="bg-white">
              <td className="px-3 py-1.5 font-medium text-gray-900">{row.branch}</td>
              {cols.map((c) => {
                const v = Number(row[c.key] ?? 0)
                return (
                  <td key={c.key} className="px-2 py-1.5">
                    <div
                      className={`mx-auto flex h-7 w-12 items-center justify-center rounded text-xs font-semibold tabular-nums ${
                        v === 0 ? 'bg-gray-50 text-gray-400' : c.tone
                      }`}
                    >
                      {v}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
