import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { GraduationCap, Users, TrendingUp, Award } from 'lucide-react'
import SchoolDashboard from '../components/dashboard/SchoolDashboard.jsx'
import IntermediateDashboard from '../components/intermediate/IntermediateDashboard.jsx'

export default function DashboardHome() {
  const [selectedDashboard, setSelectedDashboard] = useState(null)
  const { setSidebarCollapsed } = useOutletContext()

  const handleBack = () => {
    setSelectedDashboard(null)
    setSidebarCollapsed(false)
  }

  if (selectedDashboard === 'school') {
    return <SchoolDashboard onBack={handleBack} />
  }

  if (selectedDashboard === 'intermediate') {
    return <IntermediateDashboard onBack={handleBack} />
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-serif text-3xl font-semibold text-gray-900">
          Select Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Choose the type of analysis you want to view
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* School Dashboard Card */}
        <button
          type="button"
          onClick={() => {
            setSelectedDashboard('school')
            setSidebarCollapsed(true)
          }}
          className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 text-left shadow-sm transition-all hover:border-brand-500 hover:shadow-xl"
        >
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-brand-50 opacity-50 transition-transform group-hover:scale-150" />

          <div className="relative">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-transform group-hover:scale-110">
              <GraduationCap className="h-7 w-7" />
            </div>

            <h2 className="mb-2 font-serif text-2xl font-semibold text-gray-900">
              School Dashboard
            </h2>

            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Performance analytics for school-level examinations including class-wise analysis,
              branch rankings, and subject performance metrics.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>Class Analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Branch Ranks</span>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
              <span>View Dashboard</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Intermediate Dashboard Card */}
        <button
          type="button"
          onClick={() => {
            setSelectedDashboard('intermediate')
            setSidebarCollapsed(true)
          }}
          className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 text-left shadow-sm transition-all hover:border-brand-500 hover:shadow-xl"
        >
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-red-50 opacity-50 transition-transform group-hover:scale-150" />

          <div className="relative">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-transform group-hover:scale-110">
              <Award className="h-7 w-7" />
            </div>

            <h2 className="mb-2 font-serif text-2xl font-semibold text-gray-900">
              Intermediate Dashboard
            </h2>

            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Advanced analytics for competitive exam preparation including OMR analysis, topic
              mastery, diagnostics, and performance trends.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                <span>Diagnostics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Topic Analysis</span>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
              <span>View Dashboard</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
