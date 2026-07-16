import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { fmt } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'

const COLS = [
  ['rank', 'Rank'],
  ['student', 'Student Code'],
  ['total', 'Total'],
  ['right', 'Right'],
  ['wrong', 'Wrong'],
  ['left', 'Left'],
  ['accuracy', 'Accuracy %'],
  ['pctMark', 'Score %'],
  ['tests', 'Tests'],
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

/**
 * Progress Modal Component
 */
function ProgressModal({ show, onClose, progress }) {
  if (!show) return null

  const { status, current, total, message, errors, canClose } = progress

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {status === 'downloading' && 'Generating PDFs...'}
              {status === 'complete' && 'Download Complete!'}
              {status === 'error' && 'Download Failed'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {status === 'downloading' && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Processing {current} of {total} batches
              </span>
              <span className="font-mono text-brand-600">
                {Math.round((current / total) * 100)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${(current / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Icon */}
        <div className="mb-4 flex justify-center">
          {status === 'downloading' && (
            <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
          )}
          {status === 'complete' && (
            <CheckCircle className="h-12 w-12 text-green-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-12 w-12 text-red-600" />
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <h4 className="mb-2 text-sm font-semibold text-red-900">
              {errors.length} error(s) occurred:
            </h4>
            <div className="max-h-32 overflow-y-auto">
              {errors.map((error, idx) => (
                <div key={idx} className="text-xs text-red-700">
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {canClose && (
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}

        {/* Loading hint */}
        {status === 'downloading' && (
          <div className="mt-4 text-center text-xs text-gray-500">
            This may take a few minutes. Please don't close this window.
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
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('total')
  const [sortDir, setSortDir] = useState(-1)

  // Progress tracking
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState({
    status: 'idle', // 'idle' | 'downloading' | 'complete' | 'error'
    current: 0,
    total: 0,
    message: '',
    errors: [],
    canClose: false,
  })

  useEffect(() => {
    if (!ready || !filters?.streamid || !filters?.yearid || !filters?.examtypeid) {
      setLoading(false)
      setItems([])
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    intAnalyticsApi
      .rankingsLeaderboard(filters)
      .then((res) => {
        if (cancelled) return
        setItems(res.items || [])
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
  }, [filters, ready])

  const ranked = useMemo(() => {
    let a = [...items]
    if (search.trim()) {
      a = a.filter((x) => x.student.includes(search.trim()))
    }
    a.sort((x, y) => {
      const xv = x[sortKey]
      const yv = y[sortKey]
      return (xv < yv ? -1 : xv > yv ? 1 : 0) * sortDir
    })
    return a
  }, [items, search, sortKey, sortDir])

  function sortBy(k) {
    if (sortKey === k) setSortDir((d) => -d)
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }
  const sArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '')

  const handleBulkDownload = async () => {
    try {
      const studentCodes = ranked.map(s => s.student)

      if (studentCodes.length === 0) {
        alert('No students to download')
        return
      }

      // Confirm for large batches
      if (studentCodes.length > 50) {
        const confirmed = confirm(
          `You are about to download ${studentCodes.length} PDFs.\n\n` +
          `This will be split into ${Math.ceil(studentCodes.length / 100)} batch(es) of up to 100 students each.\n` +
          `Each batch will download as a separate ZIP file.\n\n` +
          `Continue?`
        )
        if (!confirmed) return
      }

      // Split into chunks of 100
      const BATCH_SIZE = 100
      const batches = []
      for (let i = 0; i < studentCodes.length; i += BATCH_SIZE) {
        batches.push(studentCodes.slice(i, i + BATCH_SIZE))
      }

      console.log(`📦 Downloading ${studentCodes.length} students in ${batches.length} batch(es)`)

      // Show progress modal
      setShowProgress(true)
      setProgress({
        status: 'downloading',
        current: 0,
        total: batches.length,
        message: `Preparing to download ${studentCodes.length} student reports...`,
        errors: [],
        canClose: false,
      })

      const batchErrors = []

      // Download each batch sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const batchNum = i + 1
        const totalBatches = batches.length

        setProgress(prev => ({
          ...prev,
          current: batchNum,
          message: `Generating batch ${batchNum}/${totalBatches} (${batch.length} students)...`,
        }))

        console.log(`📥 Downloading batch ${batchNum}/${totalBatches} (${batch.length} students)...`)

        try {
          const blob = await intAnalyticsApi.bulkDownloadStudentsPdf(batch, filters)

          // Validate blob
          if (!blob || blob.size === 0) {
            throw new Error('Received empty ZIP file')
          }

          // Check if blob is actually a JSON error response
          const blobType = blob.type
          if (blobType.includes('application/json')) {
            const text = await blob.text()
            const errorData = JSON.parse(text)
            throw new Error(errorData.msg || 'Server returned an error')
          }

          // Create download link with batch number if multiple batches
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const timestamp = new Date().toISOString().split('T')[0]
          a.download = totalBatches > 1
            ? `student-diagnostics-${timestamp}-batch${batchNum}of${totalBatches}.zip`
            : `student-diagnostics-${timestamp}.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          console.log(`✅ Batch ${batchNum}/${totalBatches} downloaded successfully`)

          // Small delay between batches to avoid overwhelming browser
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (error) {
          console.error(`❌ Batch ${batchNum}/${totalBatches} failed:`, error)
          batchErrors.push(`Batch ${batchNum}: ${error.message}`)

          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `Batch ${batchNum} failed: ${error.message}`],
          }))

          const retry = confirm(
            `Batch ${batchNum}/${totalBatches} failed: ${error.message}\n\n` +
            `Continue with remaining batches?`
          )
          if (!retry) break
        }
      }

      // Update progress to complete
      setProgress({
        status: batchErrors.length === batches.length ? 'error' : 'complete',
        current: batches.length,
        total: batches.length,
        message: batchErrors.length === 0
          ? `Successfully downloaded ${batches.length} ZIP file(s) containing ${studentCodes.length} student PDFs!`
          : `Downloaded ${batches.length - batchErrors.length}/${batches.length} batch(es). ${batchErrors.length} failed.`,
        errors: batchErrors,
        canClose: true,
      })

    } catch (error) {
      console.error('Bulk download error:', error)
      setProgress({
        status: 'error',
        current: 0,
        total: 0,
        message: 'Download failed',
        errors: [error.message],
        canClose: true,
      })
    }
  }

  const handleCloseProgress = () => {
    if (!progress.canClose) return
    setShowProgress(false)
    setProgress({
      status: 'idle',
      current: 0,
      total: 0,
      message: '',
      errors: [],
      canClose: false,
    })
  }

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
        <input
          type="text"
          placeholder="Enter roll number (e.g., 172309072)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          {ranked.length} of {items.length} students
        </span>
        
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
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                  {fmt(s.total)}
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
                  {s.pctMark.toFixed(1)}%
                </td>
                <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                  {s.tests}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Progress Modal */}
      <ProgressModal
        show={showProgress}
        onClose={handleCloseProgress}
        progress={progress}
      />
    </div>
  )
}
