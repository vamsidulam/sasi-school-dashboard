const SCHEME_FIELDS = [
  ['R', 'Right'],
  ['W', 'Wrong'],
  ['L', 'Left'],
  ['C', 'Bonus'],
]

function Label({ children, className = '' }) {
  return (
    <label
      className={`text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 ${className}`}
    >
      {children}
    </label>
  )
}

const inputClass =
  'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function FilterBar({
  subject,
  onSubjectChange,
  subjects,
  kind,
  scheme,
  onSchemeChange,
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 pt-5 pb-2">
      <div className="flex flex-col gap-1.5">
        <Label>Subject</Label>
        <select
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className={`${inputClass} min-w-[160px] cursor-pointer`}
        >
          <option value="ALL">All subjects (combined)</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Marking Scheme</Label>
        <div className="flex items-end gap-2">
          {SCHEME_FIELDS.map(([c, n]) => (
            <div key={c} className="flex flex-col gap-1.5">
              <Label className="text-center">{n}</Label>
              <input
                type="text"
                value={scheme[c]}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^-\d.]/g, '')
                  onSchemeChange((prev) => ({
                    ...prev,
                    [c]: v === '' || v === '-' ? 0 : parseFloat(v) || 0,
                  }))
                }}
                className={`${inputClass} w-16 min-w-0 text-center font-mono`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
