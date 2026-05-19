const STATUS_STYLES = {
  SUCCESS: 'bg-green-50 text-green-700 border-green-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status || 'UNKNOWN'}
    </span>
  )
}
