import { format, parseISO } from 'date-fns'

// Convert anything that looks like a date (Firestore Timestamp, JS Date, ISO
// string, ms epoch) into a JS Date. Returns null on failure.
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    try {
      return parseISO(value)
    } catch {
      return null
    }
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }
  return null
}

export function formatDate(value, pattern = 'd MMM yyyy') {
  const d = toDate(value)
  if (!d) return '—'
  try {
    return format(d, pattern)
  } catch {
    return '—'
  }
}

export function formatDateTime(value) {
  return formatDate(value, 'd MMM yyyy, h:mm a')
}

export function formatNumber(value, opts = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN', opts).format(value)
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(digits)}%`
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Maps a percentage to a Tailwind text color: red below 30, gray 30–60, green above.
export function pctColor(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return 'text-gray-500'
  if (pct < 30) return 'text-red-600'
  if (pct >= 80) return 'text-green-600'
  return 'text-gray-700'
}
