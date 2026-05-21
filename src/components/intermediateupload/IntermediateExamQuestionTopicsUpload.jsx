import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import IntermediateExamQuestionTopicsUploadModal from './IntermediateExamQuestionTopicsUploadModal.jsx'

export default function IntermediateExamQuestionTopicsUpload({ onUploaded }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Upload Question Topics</h2>
          <p className="text-sm text-gray-500">
            Map per-question topic, subtopic, difficulty level, and question type for the
            selected exam. Re-uploads merge into the same doc.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <UploadCloud className="h-4 w-4" />
          Upload Question Topics
        </button>
      </div>

      <IntermediateExamQuestionTopicsUploadModal
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
