import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import IntermediateExamResultsUploadModal from './IntermediateExamResultsUploadModal.jsx'

export default function IntermediateExamResultsUpload({ onUploaded }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Upload Exam Results</h2>
          <p className="text-sm text-gray-500">
            Select an exam, then upload the answer sheet. Pick column ranges per subject or
            map each question individually.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <UploadCloud className="h-4 w-4" />
          Upload Exam Results
        </button>
      </div>

      <IntermediateExamResultsUploadModal
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
