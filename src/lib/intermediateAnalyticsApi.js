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
    'yearid',
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
  headerFilters: (params = {}) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/header/filters${suffix}`)
  },

  overviewTestAverage: (filters) =>
    request(`/overview/test-average?${buildFilterQuery(filters)}`),
  rankingsLeaderboard: (filters) =>
    request(`/rankings/leaderboard?${buildFilterQuery(filters)}`),
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

  // Diagnostics endpoints
  diagnosticsSubjectStrength: (studentCode, filters) =>
    request(`/diagnostics/subject-strength/${studentCode}?${buildFilterQuery(filters)}`),
  diagnosticsSubtopic: (studentCode, filters) =>
    request(`/diagnostics/subtopic/${studentCode}?${buildFilterQuery(filters)}`),
  diagnosticsSubjectByQtype: (studentCode, filters) =>
    request(`/diagnostics/subject-by-qtype/${studentCode}?${buildFilterQuery(filters)}`),
  diagnosticsSubjectByDifficulty: (studentCode, filters) =>
    request(`/diagnostics/subject-by-difficulty/${studentCode}?${buildFilterQuery(filters)}`),
}
