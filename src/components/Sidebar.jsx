import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  GraduationCap,
  ClipboardList,
  Users,
  Upload,
  X,
} from 'lucide-react'

const NAV = [
  // { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard', label: 'Analysis', icon: BarChart3 },
  { to: '/branches', label: 'Branches', icon: Building2 },
  { to: '/programs', label: 'Programs', icon: GraduationCap },
  { to: '/exams', label: 'Exams', icon: ClipboardList },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/upload', label: 'Upload', icon: Upload },
]


export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 font-semibold text-white">
              S
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">SASI</div>
              <div className="text-xs text-gray-500">Performance Dashboard</div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
