import { useMemo, useRef, useState } from 'react'

export default function ProgramAutocomplete({
  value,
  onChange,
  programs = [],
  loading = false,
  placeholder = 'Type to search programs…',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return programs.slice(0, 8)
    return programs
      .filter((p) => {
        const name = (p.name || '').toLowerCase()
        const code = (p.code || '').toLowerCase()
        return name.includes(q) || code.includes(q)
      })
      .slice(0, 8)
  }, [value, programs])

  const exactMatch = programs.some(
    (p) => (p.name || '').toLowerCase() === value.trim().toLowerCase(),
  )
  const showDropdown = open && matches.length > 0 && !(exactMatch && matches.length === 1)

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {showDropdown ? (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {loading ? (
            <li className="px-2.5 py-1.5 text-xs text-gray-500">Loading…</li>
          ) : null}
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(p.name)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
              >
                <span className="text-gray-900">{p.name}</span>
                <span className="font-mono text-[11px] text-gray-500">{p.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
