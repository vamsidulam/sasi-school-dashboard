import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import { AcademicYearProvider } from '../contexts/AcademicYearContext.jsx'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <AcademicYearProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30">
            <Navbar />
          </div>
          <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
            <Outlet context={{ setSidebarCollapsed }} />
          </main>
        </div>
      </div>
    </AcademicYearProvider>
  )
}
