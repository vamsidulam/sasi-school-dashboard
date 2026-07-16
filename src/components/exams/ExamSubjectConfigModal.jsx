import { useState, useEffect } from 'react'
import { Loader2, Settings, Plus, Trash2 } from 'lucide-react'
import { examSubjectConfigApi as defaultExamSubjectConfigApi, classStandardsApi as defaultClassStandardsApi, classStandardSubjectsApi as defaultClassStandardSubjectsApi, fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'

function ClassConfigRow({ config, classStandards, onEdit, onDelete }) {
  const cs = classStandards.find((c) => c.id === config.classStandardId)
  const subjectCount = Object.keys(config.subjectMaxMarks || {}).length

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2">
        <span className="inline-flex items-center rounded-md bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
          {cs?.standardName || config.classStandardId}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-gray-700">{subjectCount} subjects</td>
      <td className="px-3 py-2 text-sm font-medium text-gray-900">{config.totalMaxMarks}</td>
      <td className="px-3 py-2 text-right">
        <button type="button" onClick={() => onEdit(config)}
          className="mr-1 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <Settings className="h-3.5 w-3.5" /> Edit
        </button>
        <button type="button" onClick={() => onDelete(config)}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </td>
    </tr>
  )
}

function ConfigFormPanel({ examId, classStandards, editingConfig, onSaved, onCancel, examSubjectConfigApi, classStandardSubjectsApi }) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [subjectMarksEntries, setSubjectMarksEntries] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [skillMaxTotal, setSkillMaxTotal] = useState('')

  useEffect(() => {
    if (editingConfig) {
      setSelectedClassId(editingConfig.classStandardId)
      setSkillMaxTotal(editingConfig.skillMaxTotal ? String(editingConfig.skillMaxTotal) : '')
      const entries = Object.entries(editingConfig.subjectMaxMarks || {}).map(([subjectId, marks]) => ({
        subjectId,
        marks: String(marks),
      }))
      setSubjectMarksEntries(entries)
    } else {
      setSelectedClassId('')
      setSubjectMarksEntries([])
      setSkillMaxTotal('')
    }
    setError(null)
  }, [editingConfig])

  useEffect(() => {
    if (!selectedClassId) {
      setAvailableSubjects([])
      return
    }
    setLoadingSubjects(true)
    classStandardSubjectsApi.listByClassStandard(selectedClassId)
      .then((res) => {
        const subjects = (res.items || []).map((item) => ({
          id: item.subjectId,
          name: item.subjectName || item.subjectCode || item.subjectId,
          code: item.subjectCode || '',
        }))
        setAvailableSubjects(subjects)
        if (!editingConfig) {
          setSubjectMarksEntries(subjects.map((s) => ({ subjectId: s.id, marks: '' })))
        }
      })
      .catch((err) => console.error('Failed to load class subjects:', err))
      .finally(() => setLoadingSubjects(false))
  }, [selectedClassId, editingConfig])

  const updateMarks = (subjectId, marks) => {
    setSubjectMarksEntries((prev) =>
      prev.map((e) => (e.subjectId === subjectId ? { ...e, marks } : e))
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClassId) return setError('Select a class standard.')

    const subjectMaxMarks = {}
    for (const entry of subjectMarksEntries) {
      const n = Number(entry.marks)
      if (!n || n <= 0) {
        const subj = availableSubjects.find((s) => s.id === entry.subjectId)
        return setError(`Enter valid marks for ${subj?.name || entry.subjectId}`)
      }
      subjectMaxMarks[entry.subjectId] = n
    }

    if (!Object.keys(subjectMaxMarks).length) {
      return setError('At least one subject must have marks configured.')
    }

    setError(null)
    setSubmitting(true)
    try {
      const payload = { examId, classStandardId: selectedClassId, subjectMaxMarks }
      if (skillMaxTotal && Number(skillMaxTotal) > 0) {
        payload.skillMaxTotal = Number(skillMaxTotal)
      }

      if (editingConfig) {
        await examSubjectConfigApi.update(editingConfig.id, payload)
      } else {
        await examSubjectConfigApi.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-200 bg-brand-50/30 p-4">
      <h4 className="text-sm font-semibold text-gray-900">
        {editingConfig ? 'Edit Marking Config' : 'Add Class Marking Config'}
      </h4>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Class Standard</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          disabled={!!editingConfig}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
        >
          <option value="">Select class standard…</option>
          {classStandards.map((cs) => (
            <option key={cs.id} value={cs.id}>{cs.standardName}</option>
          ))}
        </select>
      </div>

      {loadingSubjects && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subjects…
        </div>
      )}

      {!loadingSubjects && selectedClassId && availableSubjects.length === 0 && (
        <p className="text-sm text-gray-500">No subjects assigned to this class. Assign subjects first.</p>
      )}

      {!loadingSubjects && subjectMarksEntries.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Max Marks per Subject</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {subjectMarksEntries.map((entry) => {
              const subj = availableSubjects.find((s) => s.id === entry.subjectId)
              return (
                <div key={entry.subjectId} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700">{subj?.name || entry.subjectId}</span>
                  <input
                    type="number"
                    value={entry.marks}
                    onChange={(e) => updateMarks(entry.subjectId, e.target.value)}
                    placeholder="25"
                    min="1"
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )
            })}
          </div>
          <div className="text-xs text-gray-500">
            Total: {subjectMarksEntries.reduce((sum, e) => sum + (Number(e.marks) || 0), 0)}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Skill Max Total (optional)</label>
        <input
          type="number"
          value={skillMaxTotal}
          onChange={(e) => setSkillMaxTotal(e.target.value)}
          placeholder="e.g., 100"
          min="1"
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {editingConfig ? 'Update' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ExamSubjectConfigModal({ open, exam, onClose, examSubjectConfigApiRef, classStandardsApiRef, classStandardSubjectsApiRef, fetchAllFn }) {
  const examSubjectConfigApi = examSubjectConfigApiRef || defaultExamSubjectConfigApi
  const classStandardsApi = classStandardsApiRef || defaultClassStandardsApi
  const classStandardSubjectsApi = classStandardSubjectsApiRef || defaultClassStandardSubjectsApi
  const fetchAll = fetchAllFn || defaultFetchAll
  const [configs, setConfigs] = useState([])
  const [classStandards, setClassStandards] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)

  useEffect(() => {
    if (!open || !exam) return
    setShowForm(false)
    setEditingConfig(null)
    loadData()
  }, [open, exam])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configRes, csData] = await Promise.all([
        examSubjectConfigApi.listByExam(exam.id),
        fetchAll(classStandardsApi),
      ])
      setConfigs(configRes.items || [])
      setClassStandards(csData)
    } catch (err) {
      console.error('Failed to load exam config:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config) => {
    setEditingConfig(config)
    setShowForm(true)
  }

  const handleDelete = async (config) => {
    if (!confirm(`Remove marking config for this class?`)) return
    await examSubjectConfigApi.remove(config.id)
    loadData()
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingConfig(null)
    loadData()
  }

  if (!open || !exam) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Exam Marking Config</h3>
            <p className="text-sm text-gray-500">Configure max marks per subject for "{exam.name}"</p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              {configs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Class Standard</th>
                        <th className="px-3 py-2 font-semibold">Subjects</th>
                        <th className="px-3 py-2 font-semibold">Total Max</th>
                        <th className="px-3 py-2 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {configs.map((config) => (
                        <ClassConfigRow
                          key={config.id}
                          config={config}
                          classStandards={classStandards}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {configs.length === 0 && !showForm && (
                <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No marking config yet. Add one to define max marks per subject for each class.
                </p>
              )}

              {showForm ? (
                <ConfigFormPanel
                  examId={exam.id}
                  classStandards={classStandards}
                  editingConfig={editingConfig}
                  onSaved={handleSaved}
                  onCancel={() => { setShowForm(false); setEditingConfig(null) }}
                  examSubjectConfigApi={examSubjectConfigApi}
                  classStandardSubjectsApi={classStandardSubjectsApi}
                />
              ) : (
                <button type="button" onClick={() => { setEditingConfig(null); setShowForm(true) }}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                  <Plus className="h-4 w-4" /> Add Class Config
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
