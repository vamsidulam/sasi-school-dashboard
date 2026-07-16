import BranchRankTable from './BranchRankTable.jsx'

// Grid of small subject-rank tables — one per subject.
// `subjects` is an object: { English: [{branch, avg, avgPct, maxMarks, ...}, ...], ... }
export default function SubjectRanksGrid({ subjects = {} }) {
  const entries = Object.entries(subjects)
  if (!entries.length) {
    return <div className="text-xs text-gray-400">No subject data</div>
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {entries.map(([subject, rows]) => {
        const hasPercent = rows.some((r) => r.avgPct != null)
        const maxMarks = rows[0]?.maxMarks
        const subtitle = maxMarks ? ` (max: ${maxMarks})` : ''

        return (
          <BranchRankTable
            key={subject}
            title={`${subject}${subtitle}`}
            rows={rows}
            valueKey={hasPercent ? 'avgPct' : 'avg'}
            valueLabel={hasPercent ? '%' : 'Avg'}
            accent="text-indigo-700"
          />
        )
      })}
    </div>
  )
}
