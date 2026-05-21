import { useState } from 'react'
import { ClipboardList, BookOpen, Tag } from 'lucide-react'
import SubTabs from '../common/SubTabs.jsx'
import ExamsPanel from './exams/ExamsPanel.jsx'
import SubjectsPanel from './exams/SubjectsPanel.jsx'
import ExamTypesPanel from './exams/ExamTypesPanel.jsx'

const SUB_TABS = [
  { key: 'exams', label: 'Exams', icon: ClipboardList },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'examtypes', label: 'Exam Types', icon: Tag },
]

export default function IntermediateExams() {
  const [sub, setSub] = useState('exams')
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Intermediate exams</h2>
          <p className="text-sm text-gray-500">Manage exams, subjects, and exam types.</p>
        </div>
        <SubTabs tabs={SUB_TABS} active={sub} onChange={setSub} />
      </div>
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {sub === 'exams' ? <ExamsPanel /> : null}
        {sub === 'subjects' ? <SubjectsPanel /> : null}
        {sub === 'examtypes' ? <ExamTypesPanel /> : null}
      </section>
    </div>
  )
}
