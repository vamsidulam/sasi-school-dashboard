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
    list: ({ cursor } = {}) => {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      return request(`${path}${qs}`)
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
export const branchesApi = entityClient('/branches')
export const examsApi = entityClient('/exams')
export const studentsApi = entityClient('/students')
export const programSectionsApi = entityClient('/programsections')

export const uploadApi = {
  import: (body) =>
    request('/upload', { method: 'POST', body: JSON.stringify(body) }),
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
