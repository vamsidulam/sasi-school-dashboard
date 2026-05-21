import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import IntermediateUploadHeader from '../components/intermediateupload/IntermediateUploadHeader.jsx'
import IntermediateUploadTabs from '../components/intermediateupload/IntermediateUploadTabs.jsx'
import IntermediateStudentsUpload from '../components/intermediateupload/IntermediateStudentsUpload.jsx'
import IntermediateExamResultsUpload from '../components/intermediateupload/IntermediateExamResultsUpload.jsx'
import IntermediateExamQuestionTopicsUpload from '../components/intermediateupload/IntermediateExamQuestionTopicsUpload.jsx'
import IntermediateUploadLogsTable from '../components/intermediateupload/IntermediateUploadLogsTable.jsx'
import { intUploadApi } from '../lib/intermediateApi.js'

function formatTimestamp(ts) {
  if (!ts) return ''
  // Firestore timestamps come back as { _seconds, _nanoseconds }
  const seconds =
    typeof ts === 'object' && ts._seconds !== undefined ? ts._seconds : null
  const d = seconds ? new Date(seconds * 1000) : new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function adaptLog(item) {
  return {
    id: item.id,
    type: item.type,
    fileName: item.fileName || 'unknown',
    uploadedBy: item.uploadedBy || '—',
    uploadedAt: formatTimestamp(item.uploadedAt),
    rowsProcessed: item.inserted ?? 0,
    status: item.status || 'UNKNOWN',
    errorLog:
      item.errorLog ||
      (item.errors?.length
        ? item.errors
            .slice(0, 10)
            .map((e) => `row ${e.rowIndex}: ${e.message}`)
            .join('\n')
        : null),
  }
}

export default function IntermediateUpload() {
  const [active, setActive] = useState('students')
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState(null)

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    setLogsError(null)
    try {
      const res = await intUploadApi.listLogs()
      setLogs((res.items || []).map(adaptLog))
    } catch (err) {
      setLogsError(err.message || 'Failed to load logs.')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleUploaded = () => {
    // Re-fetch logs so the new entry written by the backend shows up
    loadLogs()
  }

  return (
    <div className="space-y-6">
      <IntermediateUploadHeader />

      <IntermediateUploadTabs active={active} onChange={setActive} />

      {active === 'students' ? (
        <IntermediateStudentsUpload onUploaded={handleUploaded} />
      ) : null}
      {active === 'examresults' ? (
        <IntermediateExamResultsUpload onUploaded={handleUploaded} />
      ) : null}
      {active === 'topics' ? (
        <IntermediateExamQuestionTopicsUpload onUploaded={handleUploaded} />
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Upload logs</h2>
            {logsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{logs.length} entries</span>
            <button
              type="button"
              onClick={loadLogs}
              disabled={logsLoading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>
        {logsError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {logsError}
          </div>
        ) : null}
        <IntermediateUploadLogsTable logs={logs} />
      </section>
    </div>
  )
}
