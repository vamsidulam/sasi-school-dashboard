import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import IntermediateStudentsUploadModal from './IntermediateStudentsUploadModal.jsx'

export default function IntermediateStudentsUpload({ onUploaded }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Upload Students</h2>
          <p className="text-sm text-gray-500">
            Bulk upload student records to the intermediate-dashboard. Click below to open the
            upload form &mdash; you can set the sheet name, row limit, and column mappings
            there.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <UploadCloud className="h-4 w-4" />
          Upload Students
        </button>
      </div>

      <IntermediateStudentsUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploaded={(payload) => {
          onUploaded?.(payload)
          if (payload?.status === 'SUCCESS') setModalOpen(false)
        }}
      />
    </section>
  )
}
