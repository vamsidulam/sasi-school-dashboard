import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

export default function ConfirmDeleteDialog({ open, student, onCancel, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setDeleting(false)
      setError(null)
    }
  }, [open])

  if (!open || !student) return null

  const handleConfirm = async () => {
    setError(null)
    setDeleting(true)
    try {
      await onConfirm?.()
    } catch (err) {
      setError(err.message || 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-student-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={deleting ? undefined : onCancel}
    >
      <div
        className="flex w-full max-w-sm flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 id="confirm-delete-student-title" className="text-base font-semibold text-gray-900">
              Delete student
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-5 py-4 text-sm text-gray-700">
          <p>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{student.name}</span>{' '}
            <span className="font-mono text-xs text-gray-500">({student.rollNo})</span>?
          </p>
          <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>
          {error ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete
          </button>
        </footer>
      </div>
    </div>
  )
}
