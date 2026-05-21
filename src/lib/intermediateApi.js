const BASE = import.meta.env.VITE_INTERMEDIATE_DASHBOARD_URL

if (!BASE && import.meta.env.DEV) {
  console.warn(
    '[intermediateApi] VITE_INTERMEDIATE_DASHBOARD_URL is not set — API calls will fail.',
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
    listAll: (params = {}) => {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v)
      }
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return request(`${path}/all/list${suffix}`)
    },
    get: (id) => request(`${path}/${id}`),
    create: (body) =>
      request(path, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
  }
}

export const intStudentsApi = entityClient('/students')
export const intBranchesApi = entityClient('/branches')
export const intStreamsApi = entityClient('/streams')
export const intYearsApi = entityClient('/years')
export const intAcademicYearsApi = entityClient('/academicyears')
export const intSubjectsApi = entityClient('/subjects')
intSubjectsApi.byStreamYear = ({ streamid, yearid }) => {
  const qs = new URLSearchParams({ streamid, yearid }).toString()
  return request(`/subjects/by/stream-year?${qs}`)
}
export const intExamsApi = entityClient('/exams')
export const intExamResultsApi = entityClient('/examresults')
export const intExamTypesApi = entityClient('/examtypes')
export const intExamQuestionTopicsApi = entityClient('/examquestiontopics')
export const intTopicsApi = entityClient('/topics')
export const intSubtopicsApi = entityClient('/subtopics')
export const intLevelsApi = entityClient('/levels')
export const intQuestionTypesApi = entityClient('/questiontypes')
intExamQuestionTopicsApi.byExam = (examid) =>
  request(`/examquestiontopics/by-exam/${encodeURIComponent(examid)}`)

export const intUploadApi = {
  students: (body) =>
    request('/upload/students', { method: 'POST', body: JSON.stringify(body) }),
  examResults: (body) =>
    request('/upload/examresults', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  examQuestionTopics: (body) =>
    request('/upload/examquestiontopics', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listLogs: ({ cursor, type, status } = {}) => {
    const qs = new URLSearchParams()
    if (cursor) qs.set('cursor', cursor)
    if (type) qs.set('type', type)
    if (status) qs.set('status', status)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/upload/logs${suffix}`)
  },
}
