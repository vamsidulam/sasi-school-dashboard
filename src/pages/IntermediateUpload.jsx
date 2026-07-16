import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import IntermediateUploadHeader from '../components/intermediateupload/IntermediateUploadHeader.jsx'
import IntermediateUploadTabs from '../components/intermediateupload/IntermediateUploadTabs.jsx'
import IntermediateStudentsUpload from '../components/intermediateupload/IntermediateStudentsUpload.jsx'
import IntermediateExamResultsUpload from '../components/intermediateupload/IntermediateExamResultsUpload.jsx'
import IntermediateExamQuestionTopicsUpload from '../components/intermediateupload/IntermediateExamQuestionTopicsUpload.jsx'
import TopicsSubtopicsUpload from '../components/intermediateupload/TopicsSubtopicsUpload.jsx'
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
    warnings: item.warnings || [],
    skipped: item.skipped || null,
  }
}

// Map tab names to log types
const TAB_TO_LOG_TYPE = {
  students: 'students',
  examresults: 'examresults',
  examquestiontopics: 'examquestiontopics',
  topicssubtopics: ['topics', 'subtopics'], // Can show both types
}

export default function IntermediateUpload() {
  const [active, setActive] = useState('students')
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const loadLogs = useCallback(async (cursor = null, append = false) => {
    setLogsLoading(true)
    setLogsError(null)
    try {
      const logType = TAB_TO_LOG_TYPE[active]

      // For topicssubtopics tab, we need to fetch both types separately
      if (Array.isArray(logType)) {
        // Fetch both topics and subtopics logs
        const [topicsRes, subtopicsRes] = await Promise.all([
          intUploadApi.listLogs({ type: 'topics', cursor }),
          intUploadApi.listLogs({ type: 'subtopics', cursor }),
        ])

        // Combine and sort by uploadedAt
        const combined = [
          ...(topicsRes.items || []).map(adaptLog),
          ...(subtopicsRes.items || []).map(adaptLog),
        ].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))

        if (append) {
          setLogs((prev) => [...prev, ...combined])
        } else {
          setLogs(combined)
        }
        // For combined results, pagination is more complex - disable for now
        setHasMore(false)
        setNextCursor(null)
      } else {
        const res = await intUploadApi.listLogs({ type: logType, cursor })
        const newLogs = (res.items || []).map(adaptLog)

        if (append) {
          setLogs((prev) => [...prev, ...newLogs])
        } else {
          setLogs(newLogs)
        }
        setHasMore(res.hasMore || false)
        setNextCursor(res.nextCursor || null)
      }
    } catch (err) {
      setLogsError(err.message || 'Failed to load logs.')
    } finally {
      setLogsLoading(false)
    }
  }, [active])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleLoadMore = () => {
    if (nextCursor && !logsLoading) {
      loadLogs(nextCursor, true)
    }
  }

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
      {active === 'examquestiontopics' ? (
        <IntermediateExamQuestionTopicsUpload onUploaded={handleUploaded} />
      ) : null}
      {active === 'topicssubtopics' ? (
        <TopicsSubtopicsUpload onUploaded={handleUploaded} />
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              Upload logs
              {Array.isArray(TAB_TO_LOG_TYPE[active]) ? (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Topics & Subtopics)
                </span>
              ) : (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({active})
                </span>
              )}
            </h2>
            {logsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {logs.length} {hasMore ? '+' : ''} entries
            </span>
            <button
              type="button"
              onClick={() => loadLogs()}
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
        {hasMore && !logsLoading ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Load More
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
