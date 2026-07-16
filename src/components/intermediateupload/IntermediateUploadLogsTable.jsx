import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, XCircle, CheckCircle2, Info } from 'lucide-react'
import IntermediateStatusBadge from './IntermediateStatusBadge.jsx'

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = Boolean(log.errorLog) || (log.warnings?.length > 0) || log.skipped

  return (
    <>
      <tr
        className={`odd:bg-white even:bg-gray-50/40 hover:bg-gray-50 cursor-pointer ${expanded ? 'bg-gray-50' : ''}`}
        onClick={() => hasDetails && setExpanded((v) => !v)}
      >
        <td className="px-3 py-2">
          {hasDetails ? (
            <button
              type="button"
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="inline-block h-4 w-4" />
          )}
        </td>
        <td className="px-3 py-2 text-gray-700">{log.uploadedAt}</td>
        <td className="px-3 py-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {log.type}
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-xs text-gray-700">{log.fileName}</td>
        <td className="px-3 py-2 text-gray-700">{log.uploadedBy}</td>
        <td className="px-3 py-2 text-right tabular-nums text-gray-700">
          {log.rowsProcessed}
        </td>
        <td className="px-3 py-2">
          <IntermediateStatusBadge status={log.status} />
        </td>
      </tr>
      {expanded && hasDetails ? (
        <tr className="bg-gray-50/60">
          <td />
          <td colSpan={6} className="px-3 py-3">
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-green-700 border border-green-200">
                  <CheckCircle2 className="h-3 w-3" /> Inserted: {log.rowsProcessed}
                </span>
                {log.skipped && (
                  <>
                    {log.skipped.inFile > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-600 border border-gray-200">
                        <Info className="h-3 w-3" /> Skipped (in file): {log.skipped.inFile}
                      </span>
                    )}
                    {log.skipped.inDb > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-600 border border-gray-200">
                        <Info className="h-3 w-3" /> Skipped (in DB): {log.skipped.inDb}
                      </span>
                    )}
                    {log.skipped.invalid > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-red-600 border border-red-200">
                        <XCircle className="h-3 w-3" /> Invalid: {log.skipped.invalid}
                      </span>
                    )}
                    {log.skipped.studentNotFound > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Student not found: {log.skipped.studentNotFound}
                      </span>
                    )}
                    {log.skipped.subjectNotFound > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Subject not found: {log.skipped.subjectNotFound}
                      </span>
                    )}
                    {log.skipped.topicNotFound > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Topic not found: {log.skipped.topicNotFound}
                      </span>
                    )}
                    {log.skipped.subtopicNotFound > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Subtopic not found: {log.skipped.subtopicNotFound}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Warnings */}
              {log.warnings?.length > 0 && (
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
              {log.errorLog && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-800">
                    <XCircle className="h-3.5 w-3.5" />
                    Errors
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-red-700">
                    {log.errorLog}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

export default function IntermediateUploadLogsTable({ logs }) {
  if (!logs.length) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
        No uploads yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="w-8 px-3 py-2" />
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">File</th>
            <th className="px-3 py-2">By</th>
            <th className="px-3 py-2 text-right">Rows</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
