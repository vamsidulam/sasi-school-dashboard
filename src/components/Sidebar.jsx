import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  GraduationCap,
  ClipboardList,
  Users,
  Upload,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

const NAV = [
  { to: '/dashboard', label: 'Analysis', icon: BarChart3 },
  { to: '/branches', label: 'Branches', icon: Building2 },
  { to: '/programs', label: 'Programs', icon: GraduationCap },
  { to: '/exams', label: 'Exams', icon: ClipboardList },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/academic-years', label: 'Academic Years', icon: CalendarRange },
  { to: '/upload', label: 'Upload', icon: Upload },
]

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const { user, signOut } = useAuth()

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md overflow-hidden bg-white">
              <img
                src="/sasi-logo.png"
                alt="SASI Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">SASI</div>
              <div className="text-xs text-gray-500">Dashboard</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md overflow-hidden bg-white">
            <img
              src="/sasi-logo.png"
              alt="SASI Logo"
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : ''}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200">
        {user && !collapsed && (
          <div className="border-b border-gray-100 p-4">
            <div className="mb-1 truncate text-sm font-medium text-gray-900">
              {user.displayName || 'User'}
            </div>
            <div className="truncate text-xs text-gray-500">{user.email}</div>
          </div>
        )}

        {user && (
          <button
            type="button"
            onClick={signOut}
            title={collapsed ? 'Sign out' : ''}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center border-t border-gray-200 py-3 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  )
}
