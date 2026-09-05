import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import IntermediateDashboard from '../components/dashboard/objective/IntermediateDashboard.jsx'
import { useAcademicYear } from '../contexts/AcademicYearContext.jsx'

const VALID_SECTIONS = ['overview', 'branch', 'rankings', 'topics', 'difficulty', 'trend']

export default function DashboardObjective() {
  const navigate = useNavigate()
  const { section } = useParams()
  const { setSidebarCollapsed } = useOutletContext()
  const { setSource } = useAcademicYear()

  const activeSection = VALID_SECTIONS.includes(section) ? section : 'overview'

  useEffect(() => {
    setSidebarCollapsed(true)
    setSource('objective')
    return () => setSidebarCollapsed(false)
  }, [])

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleSectionChange = (newSection) => {
    if (newSection === 'overview') {
      navigate('/dashboard/objective')
    } else {
      navigate(`/dashboard/objective/${newSection}`)
    }
  }

  return (
    <IntermediateDashboard
      onBack={handleBack}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
  )
}
