import { useState } from 'react'
import { GraduationCap, FolderTree, BookOpen, Layers, Zap } from 'lucide-react'
import SchoolIntermediateTabs from '../components/common/SchoolIntermediateTabs.jsx'
import SubTabs from '../components/common/SubTabs.jsx'
import ObjectivePrograms from '../components/intermediate-pages/IntermediatePrograms.jsx'
import ProgramsPanel from '../components/programs/ProgramsPanel.jsx'
import ClassStandardsPanel from '../components/programs/ClassStandardsPanel.jsx'
import SectionsPanel from '../components/programs/SectionsPanel.jsx'
import SubjectsPanel from '../components/programs/SubjectsPanel.jsx'
import SkillSubjectsPanel from '../components/programs/SkillSubjectsPanel.jsx'
import * as intApi from '../lib/intermediateboardApi.js'

const SCHOOL_SUB_TABS = [
  { key: 'programs', label: 'Programs', icon: GraduationCap },
  { key: 'classes', label: 'Class Standards', icon: Layers },
  { key: 'sections', label: 'Sections', icon: FolderTree },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'skill-subjects', label: 'Skill Subjects', icon: Zap },
]

function SchoolPrograms({ label = 'School', apis = null }) {
  const [sub, setSub] = useState('programs')

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{label} Programs</h2>
          <p className="text-sm text-gray-500">
            Manage programs, sections, and subjects for {label.toLowerCase()} education.
          </p>
        </div>
        <SubTabs tabs={SCHOOL_SUB_TABS} active={sub} onChange={setSub} />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {sub === 'programs' && <ProgramsPanel {...(apis ? { api: apis.programsApi } : {})} />}
        {sub === 'classes' && <ClassStandardsPanel {...(apis ? { classStandardsApi: apis.classStandardsApi, programsApi: apis.programsApi, fetchAll: apis.fetchAll } : {})} />}
        {sub === 'sections' && <SectionsPanel {...(apis ? { programSectionsApi: apis.programSectionsApi, programsApi: apis.programsApi, classStandardsApi: apis.classStandardsApi, fetchAll: apis.fetchAll } : {})} />}
        {sub === 'subjects' && <SubjectsPanel {...(apis ? { subjectsApi: apis.subjectsApi, classStandardsApi: apis.classStandardsApi, classStandardSubjectsApi: apis.classStandardSubjectsApi, programsApi: apis.programsApi, fetchAll: apis.fetchAll } : {})} />}
        {sub === 'skill-subjects' && <SkillSubjectsPanel {...(apis ? { skillSubjectsApi: apis.skillSubjectsApi } : {})} />}
      </section>
    </div>
  )
}

export default function Programs() {
  const [tab, setTab] = useState('school')

  return (
    <div className="space-y-6">
      {/* <header>
        <h1 className="text-xl font-semibold text-gray-900">Programs</h1>
        <p className="text-sm text-gray-500">
          Manage school programs, intermediate programs, or objective streams and years.
        </p>
      </header> */}

      <SchoolIntermediateTabs active={tab} onChange={setTab} />

      {tab === 'school' && <SchoolPrograms label="School" />}
      {tab === 'intermediate' && <SchoolPrograms label="Intermediate" apis={intApi} />}
      {tab === 'objective' && <ObjectivePrograms />}
    </div>
  )
}
