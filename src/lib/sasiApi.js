const BASE = import.meta.env.VITE_SASI_DASHBOARD_SETTINGS

if (!BASE && import.meta.env.DEV) {
  console.warn(
    '[sasiApi] VITE_SASI_DASHBOARD_SETTINGS is not set — API calls will fail.',
  )
}

async function request(path, options = {}) {
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

function entityClient(path) {
  return {
    list: ({ cursor, ...params } = {}) => {
      const qs = new URLSearchParams()
      if (cursor) qs.set('cursor', cursor)
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v)
      }
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return request(`${path}${suffix}`)
    },
    get: (id) => request(`${path}/${id}`),
    create: (body) =>
      request(path, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
  }
}

export const programsApi = entityClient('/programs')

// New: ClassStandards (class levels for programs)
export const classStandardsApi = {
  ...entityClient('/class-standards'),
  listByProgram: (programId) => request(`/class-standards?programId=${encodeURIComponent(programId)}`),
}

export const branchesApi = entityClient('/branches')
export const examsApi = entityClient('/exams')
export const studentsApi = entityClient('/students')
export const programSectionsApi = entityClient('/programsections')

// Academic Years
export const academicYearsApi = {
  ...entityClient('/academic-years'),
  listAll: () => request('/academic-years/all'),
}

// New: Subjects (master catalog)
export const subjectsApi = {
  ...entityClient('/subjects'),
  listAll: () => request('/subjects/all'),
  createWithClassStandards: (body) => request('/subjects/with-class-standards', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
}

// Skill Subjects (e.g., SK MAT, SK SCI)
export const skillSubjectsApi = {
  listAll: () => request('/skill-subjects'),
  get: (id) => request(`/skill-subjects/${id}`),
  create: (body) => request('/skill-subjects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/skill-subjects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/skill-subjects/${id}`, { method: 'DELETE' }),
}

// ClassStandardSubjects (subject mapped to class standard with subjectMarks)
export const classStandardSubjectsApi = {
  listByClassStandard: (classStandardId) => request(`/class-standard-subjects?classStandardId=${encodeURIComponent(classStandardId)}`),
  get: (id) => request(`/class-standard-subjects/${id}`),
  create: (body) => request('/class-standard-subjects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/class-standard-subjects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/class-standard-subjects/${id}`, { method: 'DELETE' }),
}

// ExamSubjectConfig (per-exam per-class marking scheme)
export const examSubjectConfigApi = {
  listByExam: (examId) => request(`/exam-subject-config?examId=${encodeURIComponent(examId)}`),
  lookup: (examId, classStandardId) => request(`/exam-subject-config/lookup?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}`),
  get: (id) => request(`/exam-subject-config/${id}`),
  create: (body) => request('/exam-subject-config', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/exam-subject-config/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/exam-subject-config/${id}`, { method: 'DELETE' }),
}

export const uploadApi = {
  students: (body) =>
    request('/upload/students', { method: 'POST', body: JSON.stringify(body) }),
  examResults: (body) =>
    request('/upload/exam-results', { method: 'POST', body: JSON.stringify(body) }),
  logs: ({ cursor, type } = {}) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    if (type) params.set('type', type)
    const qs = params.toString()
    return request(`/upload/logs${qs ? '?' + qs : ''}`)
  },
}

// Analysis API
export const analysisApi = {
  stateSummary: (examId) => request(`/analysis/state-summary?examId=${encodeURIComponent(examId)}`),
  classOverview: (examId, classStandardId) =>
    request(`/analysis/class-overview?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}`),
  branchAverages: (examId, classStandardId, metric = 'descriptive') =>
    request(`/analysis/branch-averages?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}&metric=${metric}`),
  branchToppers: (examId, classStandardId, metric = 'descriptive') =>
    request(`/analysis/branch-toppers?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}&metric=${metric}`),
  rangeBuckets: (examId, classStandardId, metric = 'descriptive') =>
    request(`/analysis/range-buckets?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}&metric=${metric}`),
  subjectRanks: (examId, classStandardId) =>
    request(`/analysis/subject-ranks?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}`),
  topStudents: (examId, classStandardId, metric = 'descriptive', limit = 30) =>
    request(`/analysis/top-students?examId=${encodeURIComponent(examId)}&classStandardId=${encodeURIComponent(classStandardId)}&metric=${metric}&limit=${limit}`),
}

export async function fetchAll(api, { maxPages = 50 } = {}) {
  const all = []
  let cursor
  for (let i = 0; i < maxPages; i++) {
    const res = await api.list({ cursor })
    all.push(...(res.items || []))
    if (!res.hasMore || !res.nextCursor) break
    cursor = res.nextCursor
  }
  return all
}
