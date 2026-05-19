import { useState } from 'react'
import UploadButton from '../components/upload/UploadButton.jsx'
import UploadModal from '../components/upload/UploadModal.jsx'
import UploadLogsTable from '../components/upload/UploadLogsTable.jsx'
import { DUMMY_UPLOAD_LOGS } from '../components/upload/dummyLogs.js'

export default function Upload() {
  const [modalOpen, setModalOpen] = useState(false)
  const [logs] = useState(DUMMY_UPLOAD_LOGS)

  const handleUploaded = (payload) => {
    console.log('[Upload] Completed upload:', payload)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Uploads</h1>
          <p className="text-sm text-gray-500">
            Upload exam result files and review the latest processing logs.
          </p>
        </div>
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
    </div>
  )
}
