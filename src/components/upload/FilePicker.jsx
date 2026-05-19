import { useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

export default function FilePicker({ file, onFileChange, disabled }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const openPicker = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onFileChange(dropped)
  }

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-900">{file.name}</span>
          <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
        </div>
        <button
          type="button"
          onClick={() => onFileChange(null)}
          disabled={disabled}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={openPicker}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
        dragOver
          ? 'border-brand-500 bg-brand-50'
          : 'border-gray-300 bg-gray-50 hover:border-brand-400'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <UploadCloud className="mb-2 h-7 w-7 text-brand-500" />
      <p className="text-sm font-medium text-gray-900">
        Drop a file here or click to browse
      </p>
      <p className="mt-1 text-xs text-gray-500">.xlsx, .csv, .json — one file at a time</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
    </div>
  )
}
