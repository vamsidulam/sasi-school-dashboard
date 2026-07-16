import { useState } from 'react'
import { Building2, GraduationCap, CalendarRange, Upload } from 'lucide-react'
import Branches from './Branches.jsx'
import Programs from './Programs.jsx'
import AcademicYears from './AcademicYears.jsx'
import UploadPage from './Upload.jsx'

const TABS = [
  { key: 'branches', label: 'Branches', icon: Building2 },
  { key: 'programs', label: 'Programs', icon: GraduationCap },
  { key: 'academic-years', label: 'Academic Years', icon: CalendarRange },
  { key: 'upload', label: 'Upload', icon: Upload },
]

export default function Settings() {
  const [tab, setTab] = useState('branches')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage branches, programs, academic years, and data uploads.</p>
      </header>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tab === 'branches' && <Branches />}
        {tab === 'programs' && <Programs />}
        {tab === 'academic-years' && <AcademicYears />}
        {tab === 'upload' && <UploadPage />}
      </div>
    </div>
  )
}
