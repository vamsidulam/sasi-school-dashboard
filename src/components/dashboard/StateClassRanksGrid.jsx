import BranchRankTable from './BranchRankTable.jsx'
import { STATE_CLASS_RANKS, CLASS_OPTIONS } from './dummyData.js'

// Mirrors PDF page 1: one mini rank-table per class, in a responsive grid.
export default function StateClassRanksGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {CLASS_OPTIONS.map((klass) => {
        const rows = STATE_CLASS_RANKS[klass]
        return (
          <BranchRankTable
            key={klass}
            title={`${formatClassLabel(klass)} % (BR Rank)`}
            rows={rows || []}
          />
        )
      })}
    </div>
  )
}

function formatClassLabel(klass) {
  if (klass === 'LKG' || klass === 'UKG') return klass
  const suffix = klass.match(/[A-Z]+$/)?.[0] || ''
  const num = klass.replace(/[A-Z]+$/, '')
  return `${num}${suffix.toLowerCase()} Class`
}
