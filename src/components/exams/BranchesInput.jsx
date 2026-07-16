import { useMemo, useState } from 'react'
import { X } from 'lucide-react'

export default function BranchesInput({ branches, onChange, suggestions = [] }) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  const addBranch = (id) => {
    if (!id) return
    if (branches.includes(id)) {
      setDraft('')
      return
    }
    onChange([...branches, id])
    setDraft('')
  }

  const removeBranch = (id) => onChange(branches.filter((x) => x !== id))

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
    } else if (e.key === 'Backspace' && !draft && branches.length) {
      onChange(branches.slice(0, -1))
    }
  }

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase()
    const pool = suggestions.filter((s) => !branches.includes(s.id))
    if (!q) return pool.slice(0, 8)
    return pool
      .filter((s) => {
        const code = (s.code || '').toLowerCase()
        const name = (s.name || '').toLowerCase()
        return code.includes(q) || name.includes(q)
      })
      .slice(0, 8)
  }, [draft, suggestions, branches])

  const showDropdown = open && matches.length > 0

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        {branches.map((branchId) => {
          const branch = suggestions.find((s) => s.id === branchId)
          const label = branch ? `${branch.code} - ${branch.name}` : branchId
          return (
            <span
              key={branchId}
              className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
            >
              {label}
              <button
                type="button"
                onClick={() => removeBranch(branchId)}
                className="rounded p-0.5 text-brand-700 hover:bg-brand-100"
                aria-label={`Remove branch ${label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )
        })}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          placeholder={branches.length ? '' : 'Type to search branches…'}
          className="flex-1 min-w-[10rem] bg-transparent py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {showDropdown ? (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addBranch(s.id)
                }}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
              >
                <span className="font-mono text-xs text-gray-700">{s.code}</span>
                <span className="text-gray-600">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
