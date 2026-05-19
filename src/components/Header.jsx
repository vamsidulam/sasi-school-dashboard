import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export default function Header({ onMenuClick }) {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 lg:text-lg">
          SASI Performance Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user.displayName || user.email}
              </div>
              {user.displayName ? (
                <div className="text-xs text-gray-500">{user.email}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        ) : null}
      </div>
    </header>
  )
}
