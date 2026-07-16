import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { academicYearsApi as schoolAcademicYearsApi } from '../lib/sasiApi.js'
import { academicYearsApi as intermediateAcademicYearsApi } from '../lib/intermediateboardApi.js'
import { intAcademicYearsApi as objectiveAcademicYearsApi } from '../lib/intermediateApi.js'

const AcademicYearContext = createContext(null)

const SOURCES = {
  school: {
    fetch: () => schoolAcademicYearsApi.listAll().then((res) => res.items || res || []),
    storageKey: 'sasi_academic_year',
  },
  intermediate: {
    fetch: () => intermediateAcademicYearsApi.listAll().then((res) => res.items || res || []),
    storageKey: 'sasi_academic_year_intermediate',
  },
  objective: {
    fetch: () => objectiveAcademicYearsApi.listAll().then((res) => res.items || res || []),
    storageKey: 'sasi_academic_year_objective',
  },
}

export function AcademicYearProvider({ children }) {
  const [source, setSourceState] = useState(() => {
    return localStorage.getItem('sasi_academic_year_source') || 'school'
  })
  const [academicYears, setAcademicYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(() => {
    const src = localStorage.getItem('sasi_academic_year_source') || 'school'
    const key = SOURCES[src]?.storageKey || 'sasi_academic_year'
    return localStorage.getItem(key) || ''
  })
  const [loading, setLoading] = useState(true)

  const loadYears = useCallback((src) => {
    const config = SOURCES[src]
    if (!config) return
    setLoading(true)
    config.fetch()
      .then((items) => {
        setAcademicYears(items)
        const storageKey = config.storageKey
        const saved = localStorage.getItem(storageKey)
        if (saved && items.find((ay) => ay.id === saved)) {
          setSelectedYear(saved)
        } else {
          setSelectedYear('')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadYears(source)
  }, [source, loadYears])

  const selectYear = (id) => {
    setSelectedYear(id)
    const config = SOURCES[source]
    if (config) {
      if (id) {
        localStorage.setItem(config.storageKey, id)
      } else {
        localStorage.removeItem(config.storageKey)
      }
    }
  }

  const setSource = (src) => {
    if (src === source) return
    setSourceState(src)
    localStorage.setItem('sasi_academic_year_source', src)
  }

  return (
    <AcademicYearContext.Provider value={{ academicYears, selectedYear, selectYear, loading, source, setSource }}>
      {children}
    </AcademicYearContext.Provider>
  )
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext)
  if (!ctx) throw new Error('useAcademicYear must be used within AcademicYearProvider')
  return ctx
}
