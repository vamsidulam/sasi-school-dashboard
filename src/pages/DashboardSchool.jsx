import { useNavigate, useOutletContext } from 'react-router-dom'
import { useEffect } from 'react'
import { SchoolDashboardAnalytics } from '../components/dashboard/school/index.js'
import { useAcademicYear } from '../contexts/AcademicYearContext.jsx'

export default function DashboardSchool() {
  const navigate = useNavigate()
  const { setSidebarCollapsed } = useOutletContext()
  const { setSource } = useAcademicYear()

  useEffect(() => {
    setSidebarCollapsed(true)
    setSource('school')
    return () => setSidebarCollapsed(false)
  }, [])

  const handleBack = () => {
    navigate('/dashboard')
  }

  return <SchoolDashboardAnalytics onBack={handleBack} label="School" />
}
