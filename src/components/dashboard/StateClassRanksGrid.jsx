import BranchRankTable from './BranchRankTable.jsx'

export default function StateClassRanksGrid({ data }) {
  if (!data || !Object.keys(data).length) {
    return <p className="py-4 text-center text-sm text-gray-500">No class data available.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Object.entries(data).map(([className, rows]) => (
        <BranchRankTable
          key={className}
          title={`${className} % (BR Rank)`}
          rows={(rows || []).map((r) => ({ branch: r.branch, pct: r.avgPct }))}
        />
      ))}
    </div>
  )
}
