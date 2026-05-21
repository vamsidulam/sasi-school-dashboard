import { useState } from 'react'
import { School, GraduationCap } from 'lucide-react'
import UploadButton from '../components/upload/UploadButton.jsx'
import UploadModal from '../components/upload/UploadModal.jsx'
import UploadLogsTable from '../components/upload/UploadLogsTable.jsx'
import { DUMMY_UPLOAD_LOGS } from '../components/upload/dummyLogs.js'
import IntermediateUpload from './IntermediateUpload.jsx'

const TABS = [
  { key: 'school', label: 'School', icon: School },
  { key: 'intermediate', label: 'Intermediate', icon: GraduationCap },
]

export default function Upload() {
  const [activeTab, setActiveTab] = useState('school')
  const [modalOpen, setModalOpen] = useState(false)
  const [logs] = useState(DUMMY_UPLOAD_LOGS)

  const handleUploaded = (payload) => {
    console.log('[Upload] Completed upload:', payload)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>

      {activeTab === 'school' ? (
        <>
          <header className="flex items-start justify-between gap-4">
            {/* <div>
              <h1 className="text-xl font-semibold text-gray-900">Uploads</h1>
              <p className="text-sm text-gray-500">
                Upload exam result files and review the latest processing logs.
              </p>
            </div> */}
            <UploadButton onClick={() => setModalOpen(true)} />
          </header>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Upload error logs</h2>
              <span className="text-xs text-gray-500">{logs.length} entries</span>
            </div>
            <UploadLogsTable logs={logs} />
          </section>

          <UploadModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onUploaded={handleUploaded}
          />
        </>
      ) : (
        <IntermediateUpload />
      )}
    </div>
  )
}
