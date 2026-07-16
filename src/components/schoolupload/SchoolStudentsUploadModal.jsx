import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import IntermediateFilePicker from '../intermediateupload/IntermediateFilePicker.jsx'
import { extractSchoolStudentsFromFile } from './extractSchoolFile.js'
import { uploadApi as defaultUploadApi } from '../../lib/sasiApi.js'
import { useAuth } from '../../hooks/useAuth.js'

const STUDENT_FIELDS = [
  { key: 'rollNo', label: 'Roll No', required: true, placeholder: 'e.g. A or RollNo' },
  { key: 'name', label: 'Student Name', required: true, placeholder: 'e.g. B or Name' },
  { key: 'branch', label: 'Branch (name/code)', placeholder: 'e.g. C or Branch' },
  { key: 'program', label: 'Program (name)', placeholder: 'e.g. D or Program' },
  { key: 'section', label: 'Section (abbreviation)', placeholder: 'e.g. E or Section' },
  { key: 'joiningYear', label: 'Joining Year', placeholder: 'e.g. F or JoiningYear' },
  { key: 'parentName', label: 'Parent Name', placeholder: 'e.g. G or ParentName' },
  { key: 'parentPhone', label: 'Parent Phone', placeholder: 'e.g. H or ParentPhone' },
]

const emptyMappings = () =>
  STUDENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})

export default function SchoolStudentsUploadModal({ open, onClose, onUploaded, uploadApi = defaultUploadApi }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [tabName, setTabName] = useState('')
  const [startRow, setStartRow] = useState('')
  const [endRow, setEndRow] = useState('')
  const [mappings, setMappings] = useState(emptyMappings)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setTabName('')
      setStartRow('')
      setEndRow('')
      setMappings(emptyMappings())
      setSubmitting(false)
      setError(null)
      setResult(null)
    }
  }, [open])

  if (!open) return null

  const setMapping = (key, value) =>
    setMappings((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setError(null)
    setResult(null)
    if (!file) {
      setError('Pick a file before uploading.')
      return
    }
    if (!mappings.rollNo.trim()) {
      setError('Roll No column mapping is required.')
      return
    }
    if (!mappings.name.trim()) {
      setError('Student Name column mapping is required.')
      return
    }
    let startN = null
    let endN = null
    if (startRow.trim()) {
      startN = Number(startRow)
      if (!Number.isInteger(startN) || startN < 2) {
        setError('Start row must be ≥ 2 (row 1 is the header).')
        return
      }
    }
    if (endRow.trim()) {
      endN = Number(endRow)
      if (!Number.isInteger(endN) || endN < 2) {
        setError('End row must be ≥ 2.')
        return
      }
    }
    if (startN !== null && endN !== null && endN < startN) {
      setError('End row must be ≥ Start row.')
      return
    }

    setSubmitting(true)
    try {
      const cleanMappings = Object.fromEntries(
        Object.entries(mappings)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      )

      const { students, warnings } = await extractSchoolStudentsFromFile(file, {
        tabName: tabName.trim() || null,
        startRow: startN,
        endRow: endN,
        mappings: cleanMappings,
      })

      if (!students.length) {
        throw new Error('No usable rows found. Check column mappings and that rows have rollNo values.')
      }

      const response = await uploadApi.students({
        students,
        fileName: file.name,
        uploadedBy: user?.email || null,
      })

      setResult({ ...response, warnings })
      onUploaded?.({ type: 'students', fileName: file.name, ...response, status: 'SUCCESS' })
    } catch (err) {
      setError(err.message || 'Upload failed.')
      onUploaded?.({ type: 'students', fileName: file.name, status: 'FAILED', errorLog: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">Upload Students</h2>
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">File</h3>
            <IntermediateFilePicker file={file} onFileChange={setFile} disabled={submitting} />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Sheet / Tab name
              <input type="text" value={tabName} onChange={(e) => setTabName(e.target.value)}
                disabled={submitting} placeholder="Leave empty for first sheet" className={inputCls} />
              <span className="text-[11px] font-normal text-gray-500">Excel only. Empty = first sheet.</span>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Start row (Excel #)
              <input type="number" min="2" step="1" value={startRow}
                onChange={(e) => setStartRow(e.target.value)} disabled={submitting}
                placeholder="2 = first data row" className={inputCls} />
              <span className="text-[11px] font-normal text-gray-500">Row 1 is header. Empty = 2.</span>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              End row (Excel #)
              <input type="number" min="2" step="1" value={endRow}
                onChange={(e) => setEndRow(e.target.value)} disabled={submitting}
                placeholder="Empty = last row" className={inputCls} />
              <span className="text-[11px] font-normal text-gray-500">Inclusive. Empty = read to end.</span>
            </label>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Column Mappings</h3>
            <p className="text-[11px] text-gray-500">
              Enter the column letter (e.g. <code>A</code>) or header name (e.g. <code>Roll No</code>) for each field.
            </p>
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <strong>Note:</strong> For Branch, Program, and Section — the sheet should contain the <strong>name or code</strong>. The system will look up and map these to the correct IDs. Rows with unmatched values will be skipped.
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STUDENT_FIELDS.map((f) => (
                <label key={f.key} className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                  <span>{f.label}{f.required ? <span className="ml-1 text-red-600">*</span> : null}</span>
                  <input type="text" value={mappings[f.key]} onChange={(e) => setMapping(f.key, e.target.value)}
                    disabled={submitting} placeholder={f.placeholder} className={inputCls} />
                </label>
              ))}
            </div>
          </section>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <div className="font-medium">Inserted: {result.inserted ?? 0}</div>
              {result.skipped ? (
                <div className="text-xs text-emerald-900/80">
                  Skipped — in-file dups: {result.skipped.inFile ?? 0} · already in DB: {result.skipped.inDb ?? 0} · invalid: {result.skipped.invalid ?? 0}
                </div>
              ) : null}
              {result.errors?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Errors ({result.errors.length})</summary>
                  <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-4">
                    {result.errors.slice(0, 50).map((e, i) => (
                      <li key={i}>{e.message || JSON.stringify(e)}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {result.warnings?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Warnings ({result.warnings.length})</summary>
                  <ul className="mt-1 list-disc pl-4">
                    {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Upload Students
          </button>
        </footer>
      </div>
    </div>
  )
}
