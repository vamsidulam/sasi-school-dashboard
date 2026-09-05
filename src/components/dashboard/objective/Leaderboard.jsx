import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Download, Loader2, X, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { fmt } from './utils.js'
import { intAnalyticsApi } from '../../../lib/intermediateAnalyticsApi.js'

const COLS = [
  ['rank', 'Rank'],
  ['student', 'Student Code'],
  ['studentName', 'Student Name'],
  ['branchName', 'Branch'],
  ['avg', 'Avg Score'],
  ['right', 'Right'],
  ['wrong', 'Wrong'],
  ['left', 'Left'],
  ['accuracy', 'Accuracy %'],
  ['tests', 'Exams'],
]

const CHIP = {
  g: 'bg-brand-600 text-white',
  r: 'bg-white border border-brand-500 text-brand-700',
  a: 'bg-gray-100 text-gray-600 border border-gray-200',
}

function Chip({ tone, children }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-mono font-semibold ${CHIP[tone]}`}
    >
      {children}
    </span>
  )
}

function EmailModal({ show, onClose, onSubmit, studentCount, loading }) {
  const [email, setEmail] = useState('')
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bulk Download Reports</h3>
            <p className="mt-1 text-sm text-gray-600">
              Generate PDFs for {studentCount} students. The ZIP file will be emailed to you.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
            <Mail className="h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && onSubmit(email)}
              className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
          <p className="text-xs text-amber-800">
            Reports will be generated in the background. You can close this page — the ZIP will be emailed when ready.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(email)}
            disabled={!email.includes('@') || loading}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Start Download
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressModal({ show, onClose, progress }) {
  if (!show) return null
  const { status, completed, total, message, zipUrl } = progress
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {status === 'processing' && 'Generating Reports...'}
              {status === 'zipping' && 'Creating ZIP...'}
              {status === 'emailing' && 'Sending Email...'}
              {status === 'completed' && 'Download Complete!'}
              {status === 'error' && 'Download Failed'}
              {status === 'queued' && 'Queued...'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          {(status === 'completed' || status === 'error') && (
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {(status === 'processing' || status === 'zipping' || status === 'emailing') && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{completed} of {total} students</span>
              <span className="font-mono text-brand-600">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="mb-4 flex justify-center">
          {['processing', 'zipping', 'emailing', 'queued'].includes(status) && (
            <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
          )}
          {status === 'completed' && <CheckCircle className="h-12 w-12 text-green-600" />}
          {status === 'error' && <AlertCircle className="h-12 w-12 text-red-600" />}
        </div>
        {status === 'completed' && zipUrl && (
          <div className="mb-4 text-center">
            <a href={zipUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <Download className="h-4 w-4" /> Download ZIP
            </a>
          </div>
        )}
        {['processing', 'zipping', 'emailing', 'queued'].includes(status) && (
          <div className="mt-4 text-center text-xs text-gray-500">You can close this — the ZIP will be emailed when ready.</div>
        )}
        {(status === 'completed' || status === 'error') && (
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Leaderboard({ filters, ready, setModal }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('avg')
  const [sortDir, setSortDir] = useState(-1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  // Bulk download state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState({ status: 'queued', completed: 0, total: 0, message: '', zipUrl: null })
  const pollRef = useRef(null)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleBulkDownload = () => {
    const total = pagination?.totalStudents || items.length
    if (total === 0) { alert('No students to download'); return }
    setShowEmailModal(true)
  }

  const handleStartBulkDownload = async (email) => {
    try {
      setBulkLoading(true)
      const res = await intAnalyticsApi.bulkDownloadStart(filters, email, 'dashboard-user', null)
      setShowEmailModal(false)
      setBulkLoading(false)
      setProgress({ status: 'queued', completed: 0, total: res.studentCount, message: res.message, zipUrl: null })
      setShowProgress(true)
      const jobId = res.jobId
      pollRef.current = setInterval(async () => {
        try {
          const s = await intAnalyticsApi.bulkDownloadStatus(jobId)
          setProgress({ status: s.status, completed: s.progress?.completed || 0, total: s.progress?.total || res.studentCount, message: s.message, zipUrl: s.zipUrl || null })
          if (s.status === 'completed' || s.status === 'error') { clearInterval(pollRef.current); pollRef.current = null }
        } catch (e) { console.error('Poll error:', e) }
      }, 3000)
    } catch (error) {
      setBulkLoading(false)
      alert(`Failed to start bulk download: ${error.message}`)
    }
  }

  const handleCloseProgress = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setShowProgress(false)
  }

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.examtypeid) {
      setLoading(false)
      setItems([])
      setPagination(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    intAnalyticsApi
      .rankingsLeaderboard(filters, currentPage, 10, searchQuery)
      .then((res) => {
        if (cancelled) return
        setItems(res.items || [])
        setPagination(res.pagination || null)
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, ready, currentPage, searchQuery])

  const ranked = useMemo(() => {
    // Server-side search and pagination - just return items as-is
    return items
  }, [items])

  function sortBy(k) {
    if (sortKey === k) setSortDir((d) => -d)
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }
  const sArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '')


  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and test type to load rankings.
      </div>
    )
  }

  if (err) {
    return (
      <div className="py-16 text-center">
        <div className="mb-1 font-serif text-xl text-gray-800">Unable to load rankings</div>
        <div className="text-sm text-gray-500">{err}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
        <div className="text-sm text-gray-500">Loading rankings…</div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <div className="mb-3 text-4xl">📊</div>
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <label className="text-sm font-semibold text-gray-700">Search Roll Number:</label>
        <div className="flex flex-1 max-w-md gap-2">
          <input
            type="text"
            placeholder="Enter roll number (e.g., 172309072)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          {pagination ? `${pagination.totalStudents} students` : `${ranked.length} students`}
        </span>

        <button
          onClick={handleBulkDownload}
          className="ml-auto flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition"
        >
          <Download className="h-4 w-4" />
          Bulk Download
        </button>
      </div>

      <div className="max-h-[640px] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {COLS.map(([k, l]) => (
                <th
                  key={k}
                  onClick={() => sortBy(k)}
                  className="cursor-pointer select-none border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 transition hover:text-brand-600"
                >
                  {l}
                  {sArrow(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((s) => (
              <tr
                key={s.student}
                onClick={() => setModal(s.student)}
                className="cursor-pointer transition hover:bg-brand-50/60"
              >
                <td className="border-b border-gray-100 px-3 py-2.5 font-serif text-base font-semibold text-brand-600">
                  {s.rank}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-900">
                  {s.student}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 text-gray-800">
                  {s.studentName || '—'}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 text-gray-600">
                  {s.branchName || '—'}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                  {fmt(s.avg != null ? s.avg : s.total)}
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5">
                  <Chip tone="g">{s.right}</Chip>
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5">
                  <Chip tone="r">{s.wrong}</Chip>
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5">
                  <Chip tone="a">{s.left}</Chip>
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.accuracy.toFixed(1)}%
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.tests}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Modal */}
      <EmailModal
        show={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleStartBulkDownload}
        studentCount={pagination?.totalStudents || items.length}
        loading={bulkLoading}
      />

      {/* Progress Modal */}
      <ProgressModal
        show={showProgress}
        onClose={handleCloseProgress}
        progress={progress}
      />

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm text-gray-600">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalStudents} total students)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, current, and neighbors
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[40px] rounded-md px-3 py-2 text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'bg-brand-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === pagination.page - 2 ||
                  pageNum === pagination.page + 2
                ) {
                  return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
