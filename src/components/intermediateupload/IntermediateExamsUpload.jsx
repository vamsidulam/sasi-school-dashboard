import { useState } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import IntermediateFilePicker from './IntermediateFilePicker.jsx'

const REQUIRED = ['examname', 'streamid', 'yearid', 'branchid', 'examdate', 'totalquestions']
const OPTIONAL = ['academicyearid', 'subjects (JSON: {subjectName: numberOfQuestions})']

export default function IntermediateExamsUpload({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async () => {
    if (!file) {
      setError('Pick an Exams file before uploading.')
      return
    }
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        type: 'exams',
        fileName: file.name,
        size: file.size,
      }
      // TODO: replace with real intermediate-dashboard upload call
      await new Promise((r) => setTimeout(r, 600))
      const fake = { inserted: 0, skipped: 0, message: 'Wire to API to perform real upload.' }
      setResult(fake)
      onUploaded?.({ ...payload, ...fake, status: 'SUCCESS' })
    } catch (err) {
      setError(err.message || 'Upload failed.')
      onUploaded?.({ type: 'exams', fileName: file.name, status: 'FAILED', errorLog: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Upload Exams</h2>
        <p className="text-sm text-gray-500">
          Bulk upload exam definitions. Each row creates one exam document.
        </p>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <div className="mb-1 font-semibold uppercase tracking-wide">Required</div>
          <div className="flex flex-wrap gap-1">
            {REQUIRED.map((f) => (
              <code key={f} className="rounded bg-white px-1">{f}</code>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
          <div className="mb-1 font-semibold uppercase tracking-wide">Optional</div>
          <div className="flex flex-wrap gap-1">
            {OPTIONAL.map((f) => (
              <code key={f} className="rounded bg-white px-1">{f}</code>
            ))}
          </div>
        </div>
      </div>

      <IntermediateFilePicker file={file} onFileChange={setFile} disabled={submitting} />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Inserted: {result.inserted ?? 0} · Skipped: {result.skipped ?? 0}
          {result.message ? <div className="mt-1 text-xs text-emerald-700">{result.message}</div> : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file || submitting}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {submitting ? 'Uploading…' : 'Upload Exams'}
        </button>
      </div>
    </section>
  )
}
