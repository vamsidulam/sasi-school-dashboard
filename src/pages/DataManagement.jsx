import { useState, useEffect } from 'react'
import { Trash2, FileText, Filter, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { intUploadApi, intStreamsApi, intBranchesApi, intYearsApi, intExamsApi, intExamTypesApi } from '../lib/intermediateApi.js'

const BASE = import.meta.env.VITE_INTERMEDIATE_DASHBOARD_URL

async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = { msg: text } }
  if (!res.ok) throw new Error(data?.msg || `Request failed (${res.status})`)
  return data
}

export default function DataManagement() {
  const [tab, setTab] = useState('logs')
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logFilter, setLogFilter] = useState({ type: '', status: '' })

  // Filter-based deletion state
  const [streams, setStreams] = useState([])
  const [branches, setBranches] = useState([])
  const [years, setYears] = useState([])
  const [examTypes, setExamTypes] = useState([])
  const [exams, setExams] = useState([])
  const [filters, setFilters] = useState({ streamid: '', branchid: '', yearid: '', examtypeid: '', examid: '' })
  const [previewCount, setPreviewCount] = useState(null)
  const [deleteLimit, setDeleteLimit] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Feedback
  const [actionResult, setActionResult] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load streams, branches, years, exam types (all independent/global)
  useEffect(() => {
    intStreamsApi.listAll().catch(() => ({ items: [] })).then((s) => setStreams(s.items || s || []))
    intBranchesApi.listAll().catch(() => ({ items: [] })).then((b) => setBranches(b.items || b || []))
    intYearsApi.listAll().catch(() => ({ items: [] })).then((y) => setYears(y.items || y || []))
    intExamTypesApi.listAll().catch(() => ({ items: [] })).then((t) => setExamTypes(t.items || t || []))
  }, [])

  // Reset exam when any parent filter changes
  useEffect(() => {
    setFilters(f => ({ ...f, examid: '' }))
    setPreviewCount(null)
  }, [filters.streamid, filters.branchid, filters.yearid, filters.examtypeid])

  // Load exams when filters change (stream required)
  useEffect(() => {
    if (!filters.streamid) { setExams([]); return }
    const params = { streamid: filters.streamid }
    if (filters.yearid) params.yearid = filters.yearid
    if (filters.branchid) params.branchid = filters.branchid
    if (filters.examtypeid) params.examtypeid = filters.examtypeid
    intExamsApi.listAll(params).catch(() => ({ items: [] }))
      .then((e) => setExams(e.items || e || []))
  }, [filters.streamid, filters.yearid, filters.branchid, filters.examtypeid])

  useEffect(() => {
    fetchLogs()
  }, [logFilter])

  async function fetchLogs() {
    setLoadingLogs(true)
    try {
      const result = await intUploadApi.listLogs(logFilter)
      setLogs(result.items || result.logs || [])
    } catch (e) {
      setLogs([])
    }
    setLoadingLogs(false)
  }

  async function handlePreviewCount() {
    if (!filters.examid) {
      setActionResult({ type: 'error', msg: 'Please select an exam' })
      return
    }
    setLoadingPreview(true)
    try {
      const qs = new URLSearchParams()
      qs.set('examid', filters.examid)
      if (filters.streamid) qs.set('streamid', filters.streamid)
      if (filters.branchid) qs.set('branchid', filters.branchid)
      if (filters.yearid) qs.set('yearid', filters.yearid)
      const result = await apiRequest(`/upload/count-by-filters?${qs.toString()}`)
      setPreviewCount(result.count)
      setActionResult(null)
    } catch (e) {
      setActionResult({ type: 'error', msg: e.message })
    }
    setLoadingPreview(false)
  }

  async function handleDeleteByFilters() {
    setDeleting(true)
    try {
      const body = { examid: filters.examid }
      if (filters.streamid) body.streamid = filters.streamid
      if (filters.branchid) body.branchid = filters.branchid
      if (filters.yearid) body.yearid = filters.yearid
      if (deleteLimit && parseInt(deleteLimit) > 0) body.limit = parseInt(deleteLimit)

      const qs = new URLSearchParams(body)
      const result = await apiRequest(`/upload/by-filters?${qs.toString()}`, { method: 'DELETE' })
      setActionResult({ type: 'success', msg: `Deleted ${result.deleted} exam results, ${result.examQuestionTopicsDeleted} question topics` })
      setPreviewCount(null)
      setConfirmDelete(null)
    } catch (e) {
      setActionResult({ type: 'error', msg: e.message })
    }
    setDeleting(false)
  }

  async function handleDeleteByLog(logId, logFileName) {
    setDeleting(true)
    try {
      const result = await apiRequest(`/upload/logs/${logId}`, { method: 'DELETE' })
      setActionResult({ type: 'success', msg: `Deleted ${result.deleted} records from "${logFileName || logId}" (type: ${result.type})` })
      setConfirmDelete(null)
      fetchLogs()
    } catch (e) {
      setActionResult({ type: 'error', msg: e.message })
    }
    setDeleting(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="mt-1 text-sm text-gray-500">Delete uploaded data by file or by filters</p>
      </div>

      {actionResult && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          actionResult.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {actionResult.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {actionResult.msg}
          <button type="button" onClick={() => setActionResult(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            type="button"
            onClick={() => setTab('logs')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'logs' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="mr-1.5 inline h-4 w-4" />
            Delete by Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('filters')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'filters' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Filter className="mr-1.5 inline h-4 w-4" />
            Delete by Filters
          </button>
        </nav>
      </div>

      {/* Tab: Delete by Upload File */}
      {tab === 'logs' && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <select
              value={logFilter.type}
              onChange={(e) => setLogFilter(f => ({ ...f, type: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="examresults">Exam Results</option>
              <option value="examquestiontopics">Question Topics</option>
              <option value="students">Students</option>
              <option value="topics">Topics</option>
              <option value="subtopics">Subtopics</option>
            </select>
            <select
              value={logFilter.status}
              onChange={(e) => setLogFilter(f => ({ ...f, status: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="DELETED">Deleted</option>
            </select>
            <button type="button" onClick={fetchLogs} className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading upload logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No upload logs found</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">File</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Records</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{log.fileName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {log.type || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{log.count ?? log.inserted ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.status === 'SUCCESS' ? 'bg-green-50 text-green-700' :
                          log.status === 'DELETED' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {log.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {log.createdAt?._seconds
                          ? new Date(log.createdAt._seconds * 1000).toLocaleString()
                          : log.createdAt || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.status !== 'DELETED' && (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ type: 'log', id: log.id, name: log.fileName })}
                            className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Delete by Filters */}
      {tab === 'filters' && (
        <div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Select filters to delete exam results</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Stream <span className="text-red-500">*</span></label>
                <select
                  value={filters.streamid}
                  onChange={(e) => setFilters(f => ({ ...f, streamid: e.target.value, yearid: '', examtypeid: '', examid: '' }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Branch</label>
                <select
                  value={filters.branchid}
                  onChange={(e) => setFilters(f => ({ ...f, branchid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Year</label>
                <select
                  value={filters.yearid}
                  onChange={(e) => setFilters(f => ({ ...f, yearid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All Years</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.yearname || y.name || y.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Exam Type</label>
                <select
                  value={filters.examtypeid}
                  onChange={(e) => setFilters(f => ({ ...f, examtypeid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  {examTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Exam <span className="text-red-500">*</span></label>
                <select
                  value={filters.examid}
                  onChange={(e) => { setFilters(f => ({ ...f, examid: e.target.value })); setPreviewCount(null) }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!filters.streamid}
                >
                  <option value="">Select Exam</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>{e.examname || e.name || e.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Limit (optional - delete only N records)</label>
                <input
                  type="number"
                  value={deleteLimit}
                  onChange={(e) => setDeleteLimit(e.target.value)}
                  placeholder="All records"
                  className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  min="1"
                />
              </div>
              <button
                type="button"
                onClick={handlePreviewCount}
                disabled={loadingPreview}
                className="flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
              >
                {loadingPreview && <Loader2 className="h-4 w-4 animate-spin" />}
                Preview Count
              </button>
            </div>

            {previewCount !== null && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-amber-800">
                    {previewCount} records found matching these filters
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-700">
                  {deleteLimit && parseInt(deleteLimit) > 0
                    ? `Will delete ${Math.min(parseInt(deleteLimit), previewCount)} records (limited to ${deleteLimit})`
                    : `Will delete all ${previewCount} records`
                  }
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ type: 'filters' })}
                  className="mt-3 flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" /> Delete Records
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-lg font-semibold">Confirm Deletion</span>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              {confirmDelete.type === 'log'
                ? `Are you sure you want to delete all data from upload "${confirmDelete.name || confirmDelete.id}"? This cannot be undone.`
                : `Are you sure you want to delete ${deleteLimit && parseInt(deleteLimit) > 0 ? `up to ${deleteLimit}` : 'all'} matching records? This cannot be undone.`
              }
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-md border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDelete.type === 'log') {
                    handleDeleteByLog(confirmDelete.id, confirmDelete.name)
                  } else {
                    handleDeleteByFilters()
                  }
                }}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
