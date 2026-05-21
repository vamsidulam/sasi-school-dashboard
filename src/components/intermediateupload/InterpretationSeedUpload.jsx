import { useState } from 'react'
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const BASE =
  import.meta.env.VITE_INTERMEDIATE_DASHBOARD_URL ||
  import.meta.env.VITE_INTERMEDIATE_ANALYTICS_URL

export default function InterpretationSeedUpload() {
  const [status, setStatus] = useState(null) // null | 'checking' | 'seeding' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [data, setData] = useState(null)

  const checkIfSeeded = async () => {
    if (!BASE) {
      setStatus('error')
      setMessage('API URL not configured. Check .env file.')
      return
    }

    setStatus('checking')
    setMessage('Checking if interpretation ranges are already seeded...')

    try {
      const res = await fetch(`${BASE}/seed/check-interpretations`)
      const json = await res.json()

      if (json.isSeeded) {
        setStatus('success')
        setMessage('✅ Interpretation ranges already seeded!')
        setData(json)
      } else {
        setStatus('error')
        setMessage(`Only ${json.total} / 20 documents found. Click "Seed Now" to populate.`)
        setData(json)
      }
    } catch (err) {
      setStatus('error')
      setMessage(`Failed to check: ${err.message}`)
    }
  }

  const seedInterpretations = async () => {
    if (!BASE) {
      setStatus('error')
      setMessage('API URL not configured. Check .env file.')
      return
    }

    setStatus('seeding')
    setMessage('Seeding interpretation ranges...')

    try {
      const res = await fetch(`${BASE}/seed/seed-interpretations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearExisting: true }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Seeding failed')
      }

      const json = await res.json()

      if (json.success) {
        setStatus('success')
        setMessage('✅ Successfully seeded interpretation ranges!')
        setData(json.breakdown)
      } else {
        setStatus('error')
        setMessage(`Seeding failed: ${json.message}`)
      }
    } catch (err) {
      setStatus('error')
      setMessage(`Failed to seed: ${err.message}`)
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Interpretation Ranges Setup
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            One-time setup required for diagnostics feature. Seeds 20 interpretation ranges
            (SIPI, CDAI, CombinedIndex, IntelligentLeaving) into the database.
          </p>
        </div>
        <Database className="h-8 w-8 flex-shrink-0 text-gray-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={checkIfSeeded}
          disabled={status === 'checking' || status === 'seeding'}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'checking' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Check Status
        </button>

        <button
          type="button"
          onClick={seedInterpretations}
          disabled={status === 'checking' || status === 'seeding'}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'seeding' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Seed Now
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : status === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {status === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            ) : status === 'error' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            ) : (
              <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">{message}</div>
              {data && (
                <div className="mt-2 space-y-1 text-xs">
                  {data.total !== undefined && (
                    <div>Total documents: <strong>{data.total}</strong></div>
                  )}
                  {data.byType && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(data.byType).map(([type, count]) => (
                        <span key={type}>
                          {type}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {data.SIPI !== undefined && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>SIPI: <strong>{data.SIPI}</strong></span>
                      <span>CDAI: <strong>{data.CDAI}</strong></span>
                      <span>CombinedIndex: <strong>{data.CombinedIndex}</strong></span>
                      <span>IntelligentLeaving: <strong>{data.IntelligentLeaving}</strong></span>
                      <span>Total: <strong>{data.total}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <div className="mb-1 font-semibold text-gray-700">What are Interpretation Ranges?</div>
        <ul className="ml-4 list-disc space-y-0.5">
          <li><strong>SIPI:</strong> Strategic Impact Priority Index (5 ranges)</li>
          <li><strong>CDAI:</strong> Cognitive Difficulty Adaptability Index (5 ranges)</li>
          <li><strong>CombinedIndex:</strong> For CMSI and Subtopic analysis (5 ranges)</li>
          <li><strong>IntelligentLeaving:</strong> Attempt strategy interpretation (5 ranges)</li>
        </ul>
        <div className="mt-2 text-gray-500">
          These are used by the diagnostics feature to interpret student performance scores.
        </div>
      </div>
    </section>
  )
}
