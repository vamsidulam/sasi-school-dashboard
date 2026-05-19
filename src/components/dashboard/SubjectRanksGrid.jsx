import BranchRankTable from './BranchRankTable.jsx'

// Grid of small subject-rank tables — one per subject.
// `subjects` is an object: { English: [{branch, value}, ...], Telugu: [...], ... }
export default function SubjectRanksGrid({ subjects = {} }) {
  const entries = Object.entries(subjects)
  if (!entries.length) {
    return <div className="text-xs text-gray-400">No subject data</div>
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map(([subject, rows]) => (
        <BranchRankTable
          key={subject}
          title={`${subject} (BR Rank)`}
          rows={rows}
          valueKey="value"
          valueLabel="Avg"
          accent="text-indigo-700"
        />
      ))}
    </div>
  )
}
