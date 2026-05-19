export default function SchoolCollegeToggle({ isCollege, onChange, disabled = false, size = 'md' }) {
  const dims =
    size === 'sm'
      ? { track: 'h-5 w-9', knob: 'h-4 w-4', translate: 'translate-x-4' }
      : { track: 'h-6 w-11', knob: 'h-5 w-5', translate: 'translate-x-5' }

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`text-xs font-medium ${isCollege ? 'text-gray-400' : 'text-gray-900'}`}>
        School
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isCollege}
        onClick={() => onChange?.(!isCollege)}
        disabled={disabled}
        className={`relative inline-flex ${dims.track} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          isCollege ? 'bg-brand-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block ${dims.knob} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isCollege ? dims.translate : 'translate-x-0'
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${isCollege ? 'text-gray-900' : 'text-gray-400'}`}>
        College
      </span>
    </div>
  )
}
