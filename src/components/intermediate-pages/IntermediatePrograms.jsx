import { useState } from 'react'
import { Layers, CalendarDays } from 'lucide-react'
import SubTabs from '../common/SubTabs.jsx'
import StreamsPanel from './programs/StreamsPanel.jsx'
import YearsPanel from './programs/YearsPanel.jsx'

const SUB_TABS = [
  { key: 'streams', label: 'Streams', icon: Layers },
  { key: 'years', label: 'Years', icon: CalendarDays },
]

export default function IntermediatePrograms() {
  const [sub, setSub] = useState('streams')
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Intermediate programs</h2>
          <p className="text-sm text-gray-500">Manage streams and class years.</p>
        </div>
        <SubTabs tabs={SUB_TABS} active={sub} onChange={setSub} />
      </div>
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {sub === 'streams' ? <StreamsPanel /> : <YearsPanel />}
      </section>
    </div>
  )
}
