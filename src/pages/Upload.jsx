import { useState, useEffect } from 'react'
import { School, GraduationCap, Users, FileSpreadsheet, Loader2, BookOpen, Award, ChevronDown, ChevronRight, AlertTriangle, XCircle, CheckCircle2, Info } from 'lucide-react'
import SchoolStudentsUploadModal from '../components/schoolupload/SchoolStudentsUploadModal.jsx'
import SchoolExamResultsUploadModal from '../components/schoolupload/SchoolExamResultsUploadModal.jsx'
import ObjectiveUpload from './IntermediateUpload.jsx'
import { uploadApi as schoolUploadApi } from '../lib/sasiApi.js'
import * as intApi from '../lib/intermediateboardApi.js'

const TABS = [
  { key: 'school', label: 'School', icon: School },
  { key: 'intermediate', label: 'Intermediate', icon: BookOpen },
  { key: 'objective', label: 'Objective', icon: Award },
]

const STATUS_COLORS = {
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  NO_INSERTS: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
}

function SchoolLogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const hasWarnings = log.warnings?.length > 0
  const hasErrors = (log.errors > 0) || log.errorLog
  const hasSkipped = log.skipped && Object.values(log.skipped).some(v => v > 0)
  const hasDetails = hasWarnings || hasErrors || hasSkipped

  return (
    <>
      <tr
        className={`hover:bg-gray-50 ${hasDetails ? 'cursor-pointer' : ''} ${expanded ? 'bg-gray-50' : ''}`}
        onClick={() => hasDetails && setExpanded(v => !v)}
      >
        <td className="px-3 py-2">
          {hasDetails ? (
            <button type="button" className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <span className="inline-block h-4 w-4" />}
        </td>
        <td className="px-3 py-2">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
            {log.type}
          </span>
        </td>
        <td className="px-3 py-2 text-xs text-gray-600 max-w-[150px] truncate">{log.fileName || '—'}</td>
        <td className="px-3 py-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-700'}`}>
            {log.status}
          </span>
        </td>
        <td className="px-3 py-2 text-center text-sm font-medium text-emerald-600">{log.inserted || 0}</td>
        <td className="px-3 py-2 text-center text-sm font-medium text-amber-600">{log.duplicates || 0}</td>
        <td className="px-3 py-2 text-xs text-gray-500">
          {log.createdAt?._seconds
            ? new Date(log.createdAt._seconds * 1000).toLocaleString()
            : '—'}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="bg-gray-50/60">
          <td />
          <td colSpan={6} className="px-3 py-3">
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-green-700 border border-green-200">
                  <CheckCircle2 className="h-3 w-3" /> Inserted: {log.inserted || 0}
                </span>
                {log.duplicates > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200">
                    <Info className="h-3 w-3" /> Duplicates: {log.duplicates}
                  </span>
                )}
                {hasSkipped && Object.entries(log.skipped).filter(([,v]) => v > 0).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-3 w-3" /> {k}: {v}
                  </span>
                ))}
              </div>

              {/* Warnings */}
              {hasWarnings && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Warnings ({log.warnings.length})
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {log.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700">{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {hasErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-800">
                    <XCircle className="h-3.5 w-3.5" />
                    Errors
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-red-700">
                    {log.errorLog || `${log.errors} error(s) occurred`}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function SchoolUpload({ api = schoolUploadApi, label = 'School', extraApis = null }) {
  const [studentsModalOpen, setStudentsModalOpen] = useState(false)
  const [examResultsModalOpen, setExamResultsModalOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsHasMore, setLogsHasMore] = useState(false)
  const [logsCursor, setLogsCursor] = useState(null)
  const [logsLoadingMore, setLogsLoadingMore] = useState(false)

  const loadLogs = async (cursor = null) => {
    try {
      const res = await api.logs({ cursor })
      if (cursor) {
        setLogs((prev) => [...prev, ...(res.items || [])])
      } else {
        setLogs(res.items || [])
      }
      setLogsHasMore(res.hasMore || false)
      setLogsCursor(res.nextCursor || null)
    } catch (err) {
      console.error('Failed to load upload logs:', err)
    }
  }

  useEffect(() => {
    setLogsLoading(true)
    loadLogs().finally(() => setLogsLoading(false))
  }, [])

  const handleUploaded = () => {
    // Refresh logs after upload
    loadLogs()
  }

  const handleLoadMore = async () => {
    if (!logsCursor) return
    setLogsLoadingMore(true)
    await loadLogs(logsCursor)
    setLogsLoadingMore(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{label} Uploads</h2>
          <p className="text-sm text-gray-500">
            Upload students or exam results from Excel/CSV files.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setStudentsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Users className="h-4 w-4" /> Upload Students
          </button>
          <button type="button" onClick={() => setExamResultsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            <FileSpreadsheet className="h-4 w-4" /> Upload Exam Results
          </button>
        </div>
      </header>

      {/* Upload Logs */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Upload Logs</h3>
          <button type="button" onClick={() => { setLogsLoading(true); loadLogs().finally(() => setLogsLoading(false)) }}
            className="text-xs text-brand-600 hover:underline">Refresh</button>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : logs.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            No upload logs yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 text-center font-semibold">Inserted</th>
                    <th className="px-3 py-2 text-center font-semibold">Duplicates</th>
                    <th className="px-3 py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <SchoolLogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
            {logsHasMore && (
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={handleLoadMore} disabled={logsLoadingMore}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                  {logsLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <SchoolStudentsUploadModal
        open={studentsModalOpen}
        onClose={() => setStudentsModalOpen(false)}
        onUploaded={handleUploaded}
        uploadApi={api}
      />

      <SchoolExamResultsUploadModal
        open={examResultsModalOpen}
        onClose={() => setExamResultsModalOpen(false)}
        onUploaded={handleUploaded}
        uploadApi={api}
        {...(extraApis ? {
          examsApi: extraApis.examsApi,
          programsApi: extraApis.programsApi,
          classStandardSubjectsApi: extraApis.classStandardSubjectsApi,
          classStandardsApi: extraApis.classStandardsApi,
          skillSubjectsApi: extraApis.skillSubjectsApi,
          fetchAll: extraApis.fetchAll,
        } : {})}
      />
    </div>
  )
}

export default function Upload() {
  const [activeTab, setActiveTab] = useState('school')

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

      {activeTab === 'school' && <SchoolUpload api={schoolUploadApi} label="School" />}
      {activeTab === 'intermediate' && <SchoolUpload api={intApi.uploadApi} label="Intermediate" extraApis={intApi} />}
      {activeTab === 'objective' && <ObjectiveUpload />}
    </div>
  )
}
