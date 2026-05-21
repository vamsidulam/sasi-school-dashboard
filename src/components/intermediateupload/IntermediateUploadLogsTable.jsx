import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import IntermediateStatusBadge from './IntermediateStatusBadge.jsx'

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const hasError = Boolean(log.errorLog)

  return (
    <>
      <tr className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50">
        <td className="px-3 py-2">
          {hasError ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label={expanded ? 'Collapse error log' : 'Expand error log'}
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
      {expanded && hasError ? (
        <tr className="bg-red-50/40">
          <td />
          <td colSpan={6} className="px-3 py-2">
            <pre className="whitespace-pre-wrap rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {log.errorLog}
            </pre>
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
