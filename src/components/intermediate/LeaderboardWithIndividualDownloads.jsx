import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, X, CheckCircle, AlertCircle, FileDown } from 'lucide-react'
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
 * Enhanced Progress Modal with Individual PDF Download Option
 */
function ProgressModal({ show, onClose, progress, downloadType }) {
  if (!show) return null

  const { status, current, total, message, errors, canClose, successfulDownloads } = progress

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {downloadType === 'zip' && status === 'downloading' && 'Downloading ZIP Archive...'}
              {downloadType === 'individual' && status === 'downloading' && 'Downloading Individual PDFs...'}
              {status === 'complete' && '✅ Download Complete!'}
              {status === 'error' && '❌ Download Failed'}
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
                {downloadType === 'zip'
                  ? `Processing batch ${current} of ${total}`
                  : `Downloaded ${current} of ${total} PDFs`}
              </span>
              <span className="font-mono text-brand-600">
                {Math.round((current / total) * 100)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
                style={{ width: `${(current / total) * 100}%` }}
              />
            </div>

            {/* Individual download stats */}
            {downloadType === 'individual' && successfulDownloads > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                ✅ {successfulDownloads} downloaded successfully
                {errors.length > 0 && ` • ❌ ${errors.length} failed`}
              </div>
            )}
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

        {/* Success Summary */}
        {status === 'complete' && successfulDownloads > 0 && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900">
                  Successfully downloaded {successfulDownloads} PDF{successfulDownloads !== 1 ? 's' : ''}!
                </h4>
                <p className="mt-1 text-xs text-green-700">
                  {downloadType === 'zip'
                    ? 'Check your downloads folder for the ZIP file.'
                    : 'Check your downloads folder for the individual PDF files.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <h4 className="mb-2 text-sm font-semibold text-red-900">
              ⚠️ {errors.length} error(s) occurred:
            </h4>
            <div className="max-h-48 overflow-y-auto">
              {errors.map((error, idx) => (
                <div key={idx} className="text-xs text-red-700 mb-1">
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
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {downloadType === 'individual'
                ? 'PDFs will download automatically. Please allow multiple downloads in your browser if prompted.'
                : 'This may take a few minutes. Please don\'t close this window.'}
            </p>
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
  const [downloadType, setDownloadType] = useState('zip') // 'zip' or 'individual'
  const [progress, setProgress] = useState({
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
    errors: [],
    canClose: false,
    successfulDownloads: 0,
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

  /**
   * Download as ZIP (traditional method)
   */
  const handleZipDownload = async () => {
    try {
      const studentCodes = ranked.map(s => s.student)

      if (studentCodes.length === 0) {
        alert('No students to download')
        return
      }

      // Confirm for large batches
      if (studentCodes.length > 20) {
        const confirmed = confirm(
          `You are about to download ${studentCodes.length} PDFs as a ZIP file.\n\n` +
          `This may take a few minutes.\n\n` +
          `Continue?`
        )
        if (!confirmed) return
      }

      setDownloadType('zip')
      setShowProgress(true)
      setProgress({
        status: 'downloading',
        current: 0,
        total: 1,
        message: `Generating ZIP file with ${studentCodes.length} PDFs...`,
        errors: [],
        canClose: false,
        successfulDownloads: 0,
      })

      console.log(`📦 Downloading ${studentCodes.length} students as ZIP`)

      try {
        const blob = await intAnalyticsApi.bulkDownloadStudentsPdf(studentCodes, filters)

        // Validate blob
        if (!blob || blob.size === 0) {
          throw new Error('Received empty ZIP file')
        }

        // Check if blob is JSON error
        if (blob.type.includes('application/json')) {
          const text = await blob.text()
          const errorData = JSON.parse(text)
          throw new Error(errorData.msg || 'Server returned an error')
        }

        // Download ZIP
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const timestamp = new Date().toISOString().split('T')[0]
        a.download = `student-diagnostics-${timestamp}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        console.log(`✅ ZIP downloaded successfully`)

        setProgress({
          status: 'complete',
          current: 1,
          total: 1,
          message: `ZIP file downloaded successfully!`,
          errors: [],
          canClose: true,
          successfulDownloads: 1,
        })

      } catch (error) {
        console.error(`❌ ZIP download failed:`, error)
        setProgress({
          status: 'error',
          current: 0,
          total: 1,
          message: 'ZIP download failed',
          errors: [error.message],
          canClose: true,
          successfulDownloads: 0,
        })
      }

    } catch (error) {
      console.error('Download error:', error)
      setProgress({
        status: 'error',
        current: 0,
        total: 0,
        message: 'Download failed',
        errors: [error.message],
        canClose: true,
        successfulDownloads: 0,
      })
    }
  }

  /**
   * Download PDFs individually (NEW - no ZIP)
   */
  const handleIndividualDownload = async () => {
    try {
      const studentCodes = ranked.map(s => s.student)

      if (studentCodes.length === 0) {
        alert('No students to download')
        return
      }

      // Warn for large batches
      if (studentCodes.length > 50) {
        const confirmed = confirm(
          `You are about to download ${studentCodes.length} individual PDF files.\n\n` +
          `Your browser may ask for permission to download multiple files.\n` +
          `This will download one PDF at a time.\n\n` +
          `For large batches (50+), we recommend using ZIP download instead.\n\n` +
          `Continue?`
        )
        if (!confirmed) return
      }

      setDownloadType('individual')
      setShowProgress(true)
      setProgress({
        status: 'downloading',
        current: 0,
        total: studentCodes.length,
        message: `Preparing to download ${studentCodes.length} individual PDFs...`,
        errors: [],
        canClose: false,
        successfulDownloads: 0,
      })

      console.log(`📄 Downloading ${studentCodes.length} students individually`)

      const errors = []
      let successCount = 0

      // Download each student one by one
      for (let i = 0; i < studentCodes.length; i++) {
        const studentCode = studentCodes[i]

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          message: `Downloading PDF ${i + 1}/${studentCodes.length}: ${studentCode}`,
        }))

        try {
          // Call single-student endpoint
          const response = await fetch(
            `${import.meta.env.VITE_INTERMEDIATE_ANALYTICS_URL}/bulk-download/single-student-pdf`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentCode, filters }),
            }
          )

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const blob = await response.blob()

          if (blob.size === 0) {
            throw new Error('Received empty PDF')
          }

          // Download the PDF
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `student-${studentCode}-report.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          successCount++
          setProgress(prev => ({ ...prev, successfulDownloads: successCount }))

          console.log(`✅ [${i + 1}/${studentCodes.length}] Downloaded ${studentCode}`)

          // Small delay to avoid overwhelming browser
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          console.error(`❌ [${i + 1}/${studentCodes.length}] Failed ${studentCode}:`, error.message)
          errors.push(`${studentCode}: ${error.message}`)

          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${studentCode}: ${error.message}`],
          }))

          // Ask to continue on first error
          if (errors.length === 1) {
            const continueDownload = confirm(
              `Failed to download PDF for ${studentCode}:\n${error.message}\n\n` +
              `Continue with remaining students?`
            )
            if (!continueDownload) break
          }
        }
      }

      // Complete
      setProgress({
        status: successCount > 0 ? 'complete' : 'error',
        current: studentCodes.length,
        total: studentCodes.length,
        message: errors.length === 0
          ? `All ${successCount} PDFs downloaded successfully!`
          : `Downloaded ${successCount}/${studentCodes.length} PDFs. ${errors.length} failed.`,
        errors: errors,
        canClose: true,
        successfulDownloads: successCount,
      })

    } catch (error) {
      console.error('Individual download error:', error)
      setProgress({
        status: 'error',
        current: 0,
        total: 0,
        message: 'Download failed',
        errors: [error.message],
        canClose: true,
        successfulDownloads: 0,
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
      successfulDownloads: 0,
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
          placeholder="Enter roll number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          {ranked.length} of {items.length} students
        </span>

        {/* ZIP Download Button */}
       
        {/* Individual Download Button */}
        <button
          type="button"
          onClick={handleIndividualDownload}
          disabled={progress.status === 'downloading' || ranked.length === 0 || ranked.length > 50}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          title={ranked.length > 50 ? "Use ZIP download for 50+ students" : "Download each PDF separately"}
        >
          {progress.status === 'downloading' && downloadType === 'individual' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress.current}/{progress.total}
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Individual {ranked.length <= 50 ? `(${ranked.length})` : '(50+ use ZIP)'}
            </>
          )}
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
        downloadType={downloadType}
      />
    </div>
  )
}
