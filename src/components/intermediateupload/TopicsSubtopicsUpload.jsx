import { useState } from 'react'
import { FolderTree, Tag } from 'lucide-react'
import TopicsUploadModal from './TopicsUploadModal.jsx'
import SubtopicsUploadModal from './SubtopicsUploadModal.jsx'

const UPLOAD_TYPES = [
  { key: 'topics', label: 'Topics', icon: FolderTree },
  { key: 'subtopics', label: 'Subtopics', icon: Tag },
]

export default function TopicsSubtopicsUpload({ onUploaded }) {
  const [activeType, setActiveType] = useState('topics')
  const [topicsModalOpen, setTopicsModalOpen] = useState(false)
  const [subtopicsModalOpen, setSubtopicsModalOpen] = useState(false)

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Upload Topics & Subtopics</h2>
        <p className="text-sm text-gray-500">
          Manage your topic hierarchy and set weightage for analytics calculations.
        </p>
      </div>

      {/* Toggle between Topics and Subtopics */}
      <div className="flex flex-wrap gap-1 rounded-md border border-gray-200 bg-gray-50 p-1">
        {UPLOAD_TYPES.map(({ key, label, icon: Icon }) => {
          const isActive = activeType === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveType(key)}
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

      {activeType === 'topics' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Upload Topics</h3>
              <p className="mt-1 text-xs text-gray-600">
                Upload a list of topics with their weightage values. Weightage indicates the
                importance/frequency of each topic in exams (used in analytics calculations).
              </p>
              <div className="mt-2 rounded border border-amber-300 bg-white px-2 py-1.5 text-xs text-gray-700">
                <strong>Required columns:</strong> Topic Name, Weightage (numeric, e.g., 1-10 or 0-100)
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTopicsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              <FolderTree className="h-4 w-4" />
              Upload Topics
            </button>
          </div>
        </div>
      )}

      {activeType === 'subtopics' && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Upload Subtopics</h3>
              <p className="mt-1 text-xs text-gray-600">
                Upload subtopics under a parent topic. Select the topic first, then upload the
                list of subtopic names.
              </p>
              <div className="mt-2 rounded border border-blue-300 bg-white px-2 py-1.5 text-xs text-gray-700">
                <strong>Required:</strong> Select parent topic, then upload file with Subtopic Name column
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubtopicsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              <Tag className="h-4 w-4" />
              Upload Subtopics
            </button>
          </div>
        </div>
      )}

      <TopicsUploadModal
        open={topicsModalOpen}
        onClose={() => setTopicsModalOpen(false)}
        onUploaded={(payload) => {
          onUploaded?.(payload)
          if (payload?.status === 'SUCCESS') setTopicsModalOpen(false)
        }}
      />

      <SubtopicsUploadModal
        open={subtopicsModalOpen}
        onClose={() => setSubtopicsModalOpen(false)}
        onUploaded={(payload) => {
          onUploaded?.(payload)
          if (payload?.status === 'SUCCESS') setSubtopicsModalOpen(false)
        }}
      />
    </section>
  )
}
