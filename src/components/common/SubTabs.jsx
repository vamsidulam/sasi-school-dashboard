/**
 * Compact sub-tab strip.
 *   tabs    — [{ key, label, icon?: LucideIcon }]
 *   active  — current key
 *   onChange — (key) => void
 */
export default function SubTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-gray-200 bg-gray-50 p-1">
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
            }`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {label}
          </button>
        )
      })}
    </div>
  )
}
