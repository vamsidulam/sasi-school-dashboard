import { useState, useEffect } from 'react'
import { Plus, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react'
import { intStreamsApi, intBranchesApi, intYearsApi, intAcademicYearsApi, intTopicsApi, intSubtopicsApi, intExamsApi, intUploadApi, intSubjectsApi, intLevelsApi, intQuestionTypesApi } from '../lib/intermediateApi.js'

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

export default function DataEntry() {
  const [tab, setTab] = useState('topics')
  const [streams, setStreams] = useState([])
  const [topics, setTopics] = useState([])
  const [exams, setExams] = useState([])
  const [branches, setBranches] = useState([])
  const [years, setYears] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [questionTypes, setQuestionTypes] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  // Topics form
  const [topicsForm, setTopicsForm] = useState({ streamid: '', topicname: '' })
  const [recentTopics, setRecentTopics] = useState([])

  // Subtopics form
  const [subtopicsForm, setSubtopicsForm] = useState({ streamid: '', topicid: '', subtopicname: '' })
  const [filteredTopics, setFilteredTopics] = useState([])
  const [recentSubtopics, setRecentSubtopics] = useState([])

  // Exam Results form
  const [resultsForm, setResultsForm] = useState({
    streamid: '',
    branchid: '',
    yearid: '',
    academicyearid: '',
    examid: '',
    studentCode: '',
    answers: {}
  })
  const [selectedExam, setSelectedExam] = useState(null)
  const [filteredExams, setFilteredExams] = useState([])

  // Exam Question Topics form
  const [examQtForm, setExamQtForm] = useState({ examid: '', questionId: '', subjectid: '', topicid: '', subtopicid: '', levelid: '', questiontypeid: '' })
  const [qtFilteredTopics, setQtFilteredTopics] = useState([])
  const [qtFilteredSubtopics, setQtFilteredSubtopics] = useState([])
  const [recentQtRows, setRecentQtRows] = useState([])

  useEffect(() => {
    Promise.all([
      intStreamsApi.listAll().catch(() => ({})),
      intBranchesApi.listAll().catch(() => ({})),
      intYearsApi.listAll().catch(() => ({})),
      intAcademicYearsApi.listAll().catch(() => ({})),
      intTopicsApi.listAll().catch(() => ({})),
      intSubtopicsApi.listAll().catch(() => ({})),
      intExamsApi.listAll().catch(() => ({})),
      intSubjectsApi.listAll().catch(() => ({})),
      intLevelsApi.listAll().catch(() => ({})),
      intQuestionTypesApi.listAll().catch(() => ({})),
    ]).then(([s, b, y, ay, t, st, e, subj, lev, qt]) => {
      setStreams(s.items || s || [])
      setBranches(b.items || b || [])
      setYears(y.items || y || [])
      setAcademicYears(ay.items || ay || [])
      setTopics(t.items || t || [])
      setSubtopics(st.items || st || [])
      setExams(e.items || e || [])
      setSubjects(subj.items || subj || [])
      setLevels(lev.items || lev || [])
      setQuestionTypes(qt.items || qt || [])
    })
  }, [])

  // Filter topics when stream changes in subtopics form
  useEffect(() => {
    if (subtopicsForm.streamid) {
      const filtered = topics.filter(t => t.streamid === subtopicsForm.streamid)
      setFilteredTopics(filtered)
      setSubtopicsForm(f => ({ ...f, topicid: '' }))
    } else {
      setFilteredTopics([])
    }
  }, [subtopicsForm.streamid, topics])

  // Filter exams by stream/branch/year/academicyear
  useEffect(() => {
    let filtered = exams
    if (resultsForm.streamid) {
      filtered = filtered.filter(e => e.streamid === resultsForm.streamid)
    }
    if (resultsForm.branchid) {
      filtered = filtered.filter(e => Array.isArray(e.branchid) ? e.branchid.includes(resultsForm.branchid) : e.branchid === resultsForm.branchid)
    }
    if (resultsForm.yearid) {
      filtered = filtered.filter(e => e.yearid === resultsForm.yearid)
    }
    if (resultsForm.academicyearid) {
      filtered = filtered.filter(e => e.academicyearid === resultsForm.academicyearid)
    }
    setFilteredExams(filtered)
    setResultsForm(f => ({ ...f, examid: '', answers: {} }))
  }, [resultsForm.streamid, resultsForm.branchid, resultsForm.yearid, resultsForm.academicyearid, exams])

  // Get selected exam details for results form
  useEffect(() => {
    if (resultsForm.examid && filteredExams.length > 0) {
      const exam = filteredExams.find(e => e.id === resultsForm.examid)
      setSelectedExam(exam)
      if (exam?.subjects && typeof exam.subjects === 'object') {
        const newAnswers = {}
        Object.keys(exam.subjects).forEach(s => {
          newAnswers[s] = ''
        })
        setResultsForm(f => ({ ...f, answers: newAnswers }))
      }
    }
  }, [resultsForm.examid, filteredExams])

  // Filter topics by subject for ExamQuestionTopics
  useEffect(() => {
    if (examQtForm.subjectid) {
      const filtered = topics.filter(t => !t.streamid || t.streamid === subjects.find(s => s.id === examQtForm.subjectid)?.streamid)
      setQtFilteredTopics(filtered)
    } else {
      setQtFilteredTopics([])
    }
    setExamQtForm(f => ({ ...f, topicid: '', subtopicid: '' }))
  }, [examQtForm.subjectid, topics, subjects])

  // Filter subtopics by topic
  useEffect(() => {
    if (examQtForm.topicid) {
      const filtered = subtopics.filter(st => st.topicid === examQtForm.topicid)
      setQtFilteredSubtopics(filtered)
    } else {
      setQtFilteredSubtopics([])
    }
    setExamQtForm(f => ({ ...f, subtopicid: '' }))
  }, [examQtForm.topicid, subtopics])

  async function handleAddTopic() {
    if (!topicsForm.streamid || !topicsForm.topicname.trim()) {
      setFeedback({ type: 'error', msg: 'Stream and Topic name are required' })
      return
    }
    setLoading(true)
    try {
      const result = await apiRequest('/topics', {
        method: 'POST',
        body: JSON.stringify({
          streamid: topicsForm.streamid,
          topicname: topicsForm.topicname.trim(),
        }),
      })
      setRecentTopics([result, ...recentTopics.slice(0, 4)])
      setTopicsForm({ streamid: '', topicname: '' })
      setFeedback({ type: 'success', msg: `Topic "${result.topicname}" added` })
      setTopics([result, ...topics])
      setTimeout(() => setFeedback(null), 3000)
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message })
    }
    setLoading(false)
  }

  async function handleAddSubtopic() {
    if (!subtopicsForm.streamid || !subtopicsForm.topicid || !subtopicsForm.subtopicname.trim()) {
      setFeedback({ type: 'error', msg: 'Stream, Topic, and Subtopic name are required' })
      return
    }
    setLoading(true)
    try {
      const result = await apiRequest('/subtopics', {
        method: 'POST',
        body: JSON.stringify({
          streamid: subtopicsForm.streamid,
          topicid: subtopicsForm.topicid,
          subtopicname: subtopicsForm.subtopicname.trim(),
        }),
      })
      setRecentSubtopics([result, ...recentSubtopics.slice(0, 4)])
      setSubtopicsForm({ streamid: '', topicid: '', subtopicname: '' })
      setFeedback({ type: 'success', msg: `Subtopic "${result.subtopicname}" added` })
      setTimeout(() => setFeedback(null), 3000)
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message })
    }
    setLoading(false)
  }

  async function handleAddExamResult() {
    if (!resultsForm.streamid || !resultsForm.branchid || !resultsForm.yearid || !resultsForm.academicyearid || !resultsForm.examid) {
      setFeedback({ type: 'error', msg: 'Stream, Branch, Year, Academic Year, and Exam are required' })
      return
    }
    if (!resultsForm.studentCode.trim()) {
      setFeedback({ type: 'error', msg: 'Student Code is required' })
      return
    }
    if (!Object.values(resultsForm.answers).some(a => a.trim())) {
      setFeedback({ type: 'error', msg: 'At least one subject must have answers' })
      return
    }
    setLoading(true)
    try {
      const body = {
        streamid: resultsForm.streamid,
        branchid: resultsForm.branchid,
        yearid: resultsForm.yearid,
        academicyearid: resultsForm.academicyearid,
        examid: resultsForm.examid,
        results: [{
          studentCode: resultsForm.studentCode.trim(),
          subjects: resultsForm.answers,
        }],
      }
      const result = await apiRequest('/upload/examresults', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setResultsForm({
        streamid: '',
        branchid: '',
        yearid: '',
        academicyearid: '',
        examid: '',
        studentCode: '',
        answers: {}
      })
      setFeedback({ type: 'success', msg: `Result for ${resultsForm.studentCode} added (${result.inserted} inserted)` })
      setTimeout(() => setFeedback(null), 3000)
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message })
    }
    setLoading(false)
  }

  async function handleAddExamQuestionTopic() {
    if (!examQtForm.examid || !examQtForm.questionId.trim() || !examQtForm.subjectid || !examQtForm.topicid || !examQtForm.levelid || !examQtForm.questiontypeid) {
      setFeedback({ type: 'error', msg: 'Exam, Question ID, Subject, Topic, Level, and Question Type are required' })
      return
    }
    setLoading(true)
    try {
      const row = {
        questionId: examQtForm.questionId.trim(),
        subject: examQtForm.subjectid,
        topic: topics.find(t => t.id === examQtForm.topicid)?.topicname || examQtForm.topicid,
      }
      if (examQtForm.subtopicid) {
        row.subtopic = subtopics.find(st => st.id === examQtForm.subtopicid)?.subtopicname || examQtForm.subtopicid
      }
      row.level = levels.find(l => l.id === examQtForm.levelid)?.name || examQtForm.levelid
      row.questiontype = questionTypes.find(qt => qt.id === examQtForm.questiontypeid)?.name || examQtForm.questiontypeid

      const body = {
        examid: examQtForm.examid,
        rows: [row],
      }
      const result = await apiRequest('/upload/examquestiontopics', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setRecentQtRows([{ ...row, examid: examQtForm.examid }, ...recentQtRows.slice(0, 4)])
      setExamQtForm({ examid: '', questionId: '', subjectid: '', topicid: '', subtopicid: '', levelid: '', questiontypeid: '' })
      setFeedback({ type: 'success', msg: `Question topic for Q${examQtForm.questionId} added` })
      setTimeout(() => setFeedback(null), 3000)
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manual Data Entry</h1>
        <p className="mt-1 text-sm text-gray-500">Add topics, subtopics, and exam results one at a time</p>
      </div>

      {feedback && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {feedback.msg}
          <button type="button" onClick={() => setFeedback(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            type="button"
            onClick={() => setTab('topics')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'topics' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Topics
          </button>
          <button
            type="button"
            onClick={() => setTab('subtopics')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'subtopics' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Subtopics
          </button>
          <button
            type="button"
            onClick={() => setTab('results')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'results' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Exam Results
          </button>
          <button
            type="button"
            onClick={() => setTab('questiontopics')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'questiontopics' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Question Topics
          </button>
        </nav>
      </div>

      {/* Topics Tab */}
      {tab === 'topics' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Add New Topic</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Stream <span className="text-red-500">*</span></label>
                <select
                  value={topicsForm.streamid}
                  onChange={(e) => setTopicsForm(f => ({ ...f, streamid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Topic Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={topicsForm.topicname}
                  onChange={(e) => setTopicsForm(f => ({ ...f, topicname: e.target.value }))}
                  placeholder="Enter topic name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTopic}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Plus className="h-4 w-4" /> Add Topic
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Recently Added</h3>
            {recentTopics.length === 0 ? (
              <div className="text-center text-xs text-gray-500">No topics added yet</div>
            ) : (
              <div className="space-y-2">
                {recentTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-green-100 bg-green-50/50 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{t.topicname}</div>
                      <div className="text-[10px] text-gray-500">{streams.find(s => s.id === t.streamid)?.name || t.streamid}</div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtopics Tab */}
      {tab === 'subtopics' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Add New Subtopic</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Stream <span className="text-red-500">*</span></label>
                <select
                  value={subtopicsForm.streamid}
                  onChange={(e) => setSubtopicsForm(f => ({ ...f, streamid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Topic <span className="text-red-500">*</span></label>
                <select
                  value={subtopicsForm.topicid}
                  onChange={(e) => setSubtopicsForm(f => ({ ...f, topicid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!subtopicsForm.streamid}
                >
                  <option value="">Select Topic</option>
                  {filteredTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.topicname}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Subtopic Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subtopicsForm.subtopicname}
                  onChange={(e) => setSubtopicsForm(f => ({ ...f, subtopicname: e.target.value }))}
                  placeholder="Enter subtopic name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSubtopic}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Plus className="h-4 w-4" /> Add Subtopic
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Recently Added</h3>
            {recentSubtopics.length === 0 ? (
              <div className="text-center text-xs text-gray-500">No subtopics added yet</div>
            ) : (
              <div className="space-y-2">
                {recentSubtopics.map((st, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-green-100 bg-green-50/50 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{st.subtopicname}</div>
                      <div className="text-[10px] text-gray-500">{topics.find(t => t.id === st.topicid)?.topicname || st.topicid}</div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Results Tab */}
      {tab === 'results' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Add Exam Result</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Stream <span className="text-red-500">*</span></label>
                <select
                  value={resultsForm.streamid}
                  onChange={(e) => setResultsForm(f => ({ ...f, streamid: e.target.value, branchid: '', yearid: '', academicyearid: '', examid: '', answers: {} }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Branch <span className="text-red-500">*</span></label>
                <select
                  value={resultsForm.branchid}
                  onChange={(e) => setResultsForm(f => ({ ...f, branchid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!resultsForm.streamid}
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Year <span className="text-red-500">*</span></label>
                <select
                  value={resultsForm.yearid}
                  onChange={(e) => setResultsForm(f => ({ ...f, yearid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!resultsForm.streamid}
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.yearname || y.name || y.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Academic Year <span className="text-red-500">*</span></label>
                <select
                  value={resultsForm.academicyearid}
                  onChange={(e) => setResultsForm(f => ({ ...f, academicyearid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>{ay.name || ay.academicyearname || ay.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Exam <span className="text-red-500">*</span></label>
                <select
                  value={resultsForm.examid}
                  onChange={(e) => setResultsForm(f => ({ ...f, examid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!resultsForm.streamid}
                >
                  <option value="">Select Exam</option>
                  {filteredExams.map((e) => (
                    <option key={e.id} value={e.id}>{e.examname || e.name || e.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Student Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={resultsForm.studentCode}
                onChange={(e) => setResultsForm(f => ({ ...f, studentCode: e.target.value }))}
                placeholder="e.g., STU001"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {selectedExam && selectedExam.subjects && typeof selectedExam.subjects === 'object' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-700">Subject Answers</div>
                {Object.entries(selectedExam.subjects).map(([subject, qCount]) => (
                  <div key={subject}>
                    <label className="mb-1 block text-xs font-medium text-gray-600">{subject} <span className="text-gray-400">({qCount} questions)</span></label>
                    <input
                      type="text"
                      value={resultsForm.answers[subject] || ''}
                      onChange={(e) => setResultsForm(f => ({ ...f, answers: { ...f.answers, [subject]: e.target.value } }))}
                      placeholder={`e.g., ${'RWL'.repeat(Math.min(3, qCount))}... (${qCount} chars)`}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                      maxLength={qCount}
                    />
                    <div className="mt-0.5 text-[10px] text-gray-500">
                      Enter exactly {qCount} characters: R (correct), W (wrong), L (left), C (bonus)
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddExamResult}
              disabled={loading || !resultsForm.examid}
              className="flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" /> Add Result
            </button>
          </div>
        </div>
      )}

      {/* Question Topics Tab */}
      {tab === 'questiontopics' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Add Exam Question Topic</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Exam <span className="text-red-500">*</span></label>
                <select
                  value={examQtForm.examid}
                  onChange={(e) => setExamQtForm(f => ({ ...f, examid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Exam</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>{e.examname || e.name || e.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Question ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={examQtForm.questionId}
                  onChange={(e) => setExamQtForm(f => ({ ...f, questionId: e.target.value }))}
                  placeholder="e.g., Q001, Q1, 1"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
                <select
                  value={examQtForm.subjectid}
                  onChange={(e) => setExamQtForm(f => ({ ...f, subjectid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Topic <span className="text-red-500">*</span></label>
                <select
                  value={examQtForm.topicid}
                  onChange={(e) => setExamQtForm(f => ({ ...f, topicid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!examQtForm.subjectid}
                >
                  <option value="">Select Topic</option>
                  {qtFilteredTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.topicname}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Subtopic (optional)</label>
                <select
                  value={examQtForm.subtopicid}
                  onChange={(e) => setExamQtForm(f => ({ ...f, subtopicid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={!examQtForm.topicid}
                >
                  <option value="">Select Subtopic</option>
                  {qtFilteredSubtopics.map((st) => (
                    <option key={st.id} value={st.id}>{st.subtopicname}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Level <span className="text-red-500">*</span></label>
                <select
                  value={examQtForm.levelid}
                  onChange={(e) => setExamQtForm(f => ({ ...f, levelid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Level</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Question Type <span className="text-red-500">*</span></label>
                <select
                  value={examQtForm.questiontypeid}
                  onChange={(e) => setExamQtForm(f => ({ ...f, questiontypeid: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Question Type</option>
                  {questionTypes.map((qt) => (
                    <option key={qt.id} value={qt.id}>{qt.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddExamQuestionTopic}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Plus className="h-4 w-4" /> Add Question Topic
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Recently Added</h3>
            {recentQtRows.length === 0 ? (
              <div className="text-center text-xs text-gray-500">No question topics added yet</div>
            ) : (
              <div className="space-y-2">
                {recentQtRows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-green-100 bg-green-50/50 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-900">Q{row.questionId}</div>
                      <div className="text-[10px] text-gray-500">
                        {row.topic} {row.subtopic ? `→ ${row.subtopic}` : ''} · {row.level} · {row.questiontype}
                      </div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
