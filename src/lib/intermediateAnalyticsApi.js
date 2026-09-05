// Prefer dedicated analytics URL; fall back to main Intermediate Dashboard URL
// (analytics routes are also mounted on IntermediateDashboard after deploy).
const BASE =
  import.meta.env.VITE_INTERMEDIATE_ANALYTICS_URL ||
  import.meta.env.VITE_INTERMEDIATE_DASHBOARD_URL

if (!BASE && import.meta.env.DEV) {
  console.warn(
    '[intermediateAnalyticsApi] Set VITE_INTERMEDIATE_DASHBOARD_URL or VITE_INTERMEDIATE_ANALYTICS_URL in .env',
  )
}

async function request(path, options = {}) {
  if (!BASE) {
    throw new Error(
      'VITE_INTERMEDIATE_DASHBOARD_URL is not configured. Add it to .env and restart the dev server.',
    )
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { msg: text }
  }
  if (!res.ok) {
    throw new Error(data?.msg || `Request failed (${res.status})`)
  }
  return data
}

/** Build query string from filter state (ids + optional subject/exam). */
export function buildFilterQuery(filters) {
  const qs = new URLSearchParams()
  const keys = [
    'streamid',
    'examtypeid',
    'branchid',
    'academicyearid',
    'subject',
    'exam',
    'schemeR',
    'schemeW',
    'schemeL',
    'schemeC',
  ]
  for (const k of keys) {
    const v = filters[k]
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  return qs.toString()
}

export const intAnalyticsApi = {
  studentSearch: (search, cursor, limit, filters = {}) => {
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (cursor) qs.set('cursor', cursor)
    if (limit) qs.set('limit', String(limit))
    if (filters.academicyearid) qs.set('academicyearid', filters.academicyearid)
    if (filters.streamid) qs.set('streamid', filters.streamid)
    if (filters.branchid) qs.set('branchid', filters.branchid)
    return request(`/students?${qs.toString()}`)
  },
  headerFilters: (params = {}) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/header/filters${suffix}`)
  },

  overviewAll: (filters) =>
    request(`/overview/all?${buildFilterQuery(filters)}`),
  overviewTestAverage: (filters) =>
    request(`/overview/test-average?${buildFilterQuery(filters)}`),
  rankingsLeaderboard: (filters, page = 1, limit = 10, search = '') => {
    const qs = buildFilterQuery(filters);
    const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    return request(`/rankings/leaderboard?${qs}&page=${page}&limit=${limit}${searchParam}`);
  },
  insightsTopicMastery: (filters) =>
    request(`/insights/topic-mastery?${buildFilterQuery(filters)}`),
  insightsDifficultyType: (filters) =>
    request(`/insights/difficulty-type?${buildFilterQuery(filters)}`),
  overviewHighestScore: (filters) =>
    request(`/overview/highest-score?${buildFilterQuery(filters)}`),
  overviewAccuracy: (filters) =>
    request(`/overview/accuracy?${buildFilterQuery(filters)}`),
  overviewAttemptRate: (filters) =>
    request(`/overview/attempt-rate?${buildFilterQuery(filters)}`),
  overviewSubjectWise: (filters) =>
    request(`/overview/subject-wise?${buildFilterQuery(filters)}`),
  overviewScoreTrend: (filters) =>
    request(`/overview/score-trend?${buildFilterQuery(filters)}`),
  overviewTopPerformers: (filters) =>
    request(`/overview/top-performers?${buildFilterQuery(filters)}`),
  overviewWeakestTopics: (filters) =>
    request(`/overview/weakest-topics?${buildFilterQuery(filters)}`),
  overviewStudentDetail: (filters, studentCode) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('student', studentCode)
    return request(`/overview/student-detail?${qs.toString()}`)
  },

  // Test Trend endpoints
  testTrend: (filters) =>
    request(`/test-trend?${buildFilterQuery(filters)}`),
  testTrendSummary: (filters) =>
    request(`/test-trend/summary?${buildFilterQuery(filters)}`),
  testTrendComparison: (filters, compareBy) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    if (compareBy) qs.set('compareBy', compareBy)
    return request(`/test-trend/comparison?${qs.toString()}`)
  },
  testTrendGrowth: (filters) =>
    request(`/test-trend/growth?${buildFilterQuery(filters)}`),

  // Diagnostics endpoints - NEW Level 1 Routes
  diagnosticsLevel1Table1: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level1table1?${qs.toString()}`)
  },
  diagnosticsLevel1Table2: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level1table2?${qs.toString()}`)
  },
  diagnosticsLevel1Table3: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level1table3?${qs.toString()}`)
  },
  diagnosticsLevel2Table1: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level2table1?${qs.toString()}`)
  },
  diagnosticsLevel2Table2: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level2table2?${qs.toString()}`)
  },
  diagnosticsLevel2Table1Detailed: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level2table1-detailed?${qs.toString()}`)
  },
  diagnosticsLevel2Table2Detailed: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level2table2-detailed?${qs.toString()}`)
  },
  diagnosticsLevel3: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/level3?${qs.toString()}`)
  },
  diagnosticsReport: (studentCode, filters) => {
    const qs = new URLSearchParams(buildFilterQuery(filters))
    qs.set('studentCode', studentCode)
    return request(`/diagnostics/report?${qs.toString()}`)
  },
  sparkInsights: (studentCode, filters) => {
    return request('/diagnostics/spark-insights', {
      method: 'POST',
      body: JSON.stringify({ studentCode, filters }),
    })
  },

  // Diagnostics endpoints - OLD (kept for backward compatibility)
  diagnosticsSubjectStrength: (studentCode, filters) =>
    request(`/diagnostics/subject-strength/${studentCode}?${buildFilterQuery(filters)}`),
  diagnosticsSubtopic: (studentCode, filters) =>
    request(`/diagnostics/subtopic/${studentCode}?${buildFilterQuery(filters)}`),
  diagnosticsSubjectByQtype: (studentCode, filters) =>
    request(`/diagnostics/subject-by-qtype/${studentCode}?${buildFilterQuery(filters)}`),
  diagnosticsSubjectByDifficulty: (studentCode, filters) =>
    request(`/diagnostics/subject-by-difficulty/${studentCode}?${buildFilterQuery(filters)}`),

  // Bulk Download endpoints
  bulkDownloadStudentsPdf: async (studentCodes, filters) => {
    if (!BASE) {
      throw new Error('VITE_INTERMEDIATE_DASHBOARD_URL is not configured')
    }
    const response = await fetch(`${BASE}/bulk-download/students-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCodes, filters }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Bulk download failed: ${text}`)
    }
    return response.blob()
  },

  bulkDownloadAllStudentsPdf: async (filters) => {
    if (!BASE) {
      throw new Error('VITE_INTERMEDIATE_DASHBOARD_URL is not configured')
    }
    const response = await fetch(`${BASE}/bulk-download/all-students-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Bulk download failed: ${text}`)
    }
    return response.blob()
  },

  // Bulk Download Temporal (async email-based)
  bulkDownloadStart: (filters, email, requestedBy, studentCodes = null) =>
    request('/bulk-download/start', {
      method: 'POST',
      body: JSON.stringify({ filters, email, requestedBy, studentCodes }),
    }),
  bulkDownloadStatus: (jobId) =>
    request(`/bulk-download/status/${jobId}`),

  // Branch Analysis endpoints
  branchSummary: (filters) =>
    request(`/branch/summary?${buildFilterQuery(filters)}`),
  branchRanks: (filters) =>
    request(`/branch/ranks?${buildFilterQuery(filters)}`),
  branchToppers: (filters) =>
    request(`/branch/toppers?${buildFilterQuery(filters)}`),
  branchRangeBuckets: (filters) =>
    request(`/branch/range-buckets?${buildFilterQuery(filters)}`),
  branchSubjectRanks: (filters) =>
    request(`/branch/subject-ranks?${buildFilterQuery(filters)}`),
  branchComparison: (filters) =>
    request(`/branch/comparison?${buildFilterQuery(filters)}`),
}
