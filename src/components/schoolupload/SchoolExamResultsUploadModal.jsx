import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import IntermediateFilePicker from '../intermediateupload/IntermediateFilePicker.jsx'
import { extractSchoolExamResultsFromFile } from './extractSchoolFile.js'
import { uploadApi as defaultUploadApi, examsApi as defaultExamsApi, programsApi as defaultProgramsApi, classStandardSubjectsApi as defaultClassStandardSubjectsApi, classStandardsApi as defaultClassStandardsApi, skillSubjectsApi as defaultSkillSubjectsApi } from '../../lib/sasiApi.js'
import { fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'
import { useAuth } from '../../hooks/useAuth.js'

export default function SchoolExamResultsUploadModal({ open, onClose, onUploaded, uploadApi = defaultUploadApi, examsApi = defaultExamsApi, programsApi = defaultProgramsApi, classStandardSubjectsApi = defaultClassStandardSubjectsApi, classStandardsApi = defaultClassStandardsApi, skillSubjectsApi = defaultSkillSubjectsApi, fetchAll = defaultFetchAll }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [tabName, setTabName] = useState('')
  const [startRow, setStartRow] = useState('')
  const [endRow, setEndRow] = useState('')
  const [studentCodeColumn, setStudentCodeColumn] = useState('')
  const [examId, setExamId] = useState('')
  const [programId, setProgramId] = useState('')
  const [classStandardId, setClassStandardId] = useState('')
  const [subjectColumns, setSubjectColumns] = useState({})

  const [includeSkill, setIncludeSkill] = useState(false)
  const [skillColumns, setSkillColumns] = useState({})
  const [skillMaxTotal, setSkillMaxTotal] = useState('')

  const [exams, setExams] = useState([])
  const [programs, setPrograms] = useState([])
  const [classStandards, setClassStandards] = useState([])
  const [classSubjects, setClassSubjects] = useState([])
  const [skillSubjects, setSkillSubjects] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setTabName('')
      setStartRow('')
      setEndRow('')
      setStudentCodeColumn('')
      setExamId('')
      setProgramId('')
      setClassStandardId('')
      setSubjectColumns({})
      setIncludeSkill(false)
      setSkillColumns({})
      setSkillMaxTotal('')
      setSubmitting(false)
      setError(null)
      setResult(null)
      return
    }
    setLoadingOptions(true)
    Promise.all([
      fetchAll(examsApi),
      fetchAll(programsApi),
      fetchAll(classStandardsApi),
      skillSubjectsApi.listAll(),
    ]).then(([exData, progData, csData, skRes]) => {
      setExams(exData)
      setPrograms(progData)
      setClassStandards(csData)
      setSkillSubjects(skRes.items || [])
    }).catch((err) => {
      console.error('Failed to load options:', err)
    }).finally(() => setLoadingOptions(false))
  }, [open])

  // Reset exam and classStandard when program changes
  useEffect(() => {
    setExamId('')
    setClassStandardId('')
    setSubjectColumns({})
    setClassSubjects([])
  }, [programId])

  // Reset classStandard when exam changes
  useEffect(() => {
    setClassStandardId('')
    setSubjectColumns({})
    setClassSubjects([])
  }, [examId])

  // Load subjects when classStandardId changes
  useEffect(() => {
    if (!classStandardId) {
      setClassSubjects([])
      setSubjectColumns({})
      return
    }
    classStandardSubjectsApi.listByClassStandard(classStandardId)
      .then((res) => {
        setClassSubjects(res.items || [])
        setSubjectColumns({})
      })
      .catch(() => setClassSubjects([]))
  }, [classStandardId])

  if (!open) return null

  // Filter exams by selected program
  const filteredExams = programId
    ? exams.filter((ex) => ex.programId === programId)
    : []

  // Filter class standards by selected program
  const filteredClassStandards = programId
    ? classStandards.filter((cs) => cs.programId === programId)
    : []

  const handleSubjectColumn = (subjectId, value) => {
    setSubjectColumns((prev) => ({ ...prev, [subjectId]: value }))
  }

  const handleSkillColumn = (skillId, value) => {
    setSkillColumns((prev) => ({ ...prev, [skillId]: value }))
  }

  const handleSubmit = async () => {
    setError(null)
    setResult(null)
    if (!file) return setError('Pick a file before uploading.')
    if (!programId) return setError('Select a program.')
    if (!examId) return setError('Select an exam.')
    if (!classStandardId) return setError('Select a class standard.')
    if (!studentCodeColumn.trim()) return setError('Student code column is required.')

    const cleanSubjectColumns = Object.fromEntries(
      Object.entries(subjectColumns).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)
    )
    if (!Object.keys(cleanSubjectColumns).length) {
      return setError('Map at least one subject column.')
    }

    let cleanSkillColumns = {}
    if (includeSkill) {
      cleanSkillColumns = Object.fromEntries(
        Object.entries(skillColumns).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)
      )
      if (!Object.keys(cleanSkillColumns).length) {
        return setError('Map at least one skill subject column or disable skill scores.')
      }
      if (!skillMaxTotal.trim() || Number(skillMaxTotal) <= 0) {
        return setError('Skill Max Total marks is required when skill scores are enabled.')
      }
    }

    const allColumns = { ...cleanSubjectColumns, ...cleanSkillColumns }

    let startN = null
    let endN = null
    if (startRow.trim()) {
      startN = Number(startRow)
      if (!Number.isInteger(startN) || startN < 2) return setError('Start row must be ≥ 2.')
    }
    if (endRow.trim()) {
      endN = Number(endRow)
      if (!Number.isInteger(endN) || endN < 2) return setError('End row must be ≥ 2.')
    }

    setSubmitting(true)
    try {
      const { results, warnings } = await extractSchoolExamResultsFromFile(file, {
        tabName: tabName.trim() || null,
        startRow: startN,
        endRow: endN,
        studentCodeColumn: studentCodeColumn.trim(),
        subjectColumns: allColumns,
      })

      if (!results.length) {
        throw new Error('No usable rows found. Check column mappings.')
      }

      // Split scores into descriptive and skill
      const skillSubjectIds = new Set(Object.keys(cleanSkillColumns))
      const processedResults = results.map((row) => {
        const subjectScores = {}
        const skillScores = {}
        for (const [id, marks] of Object.entries(row.subjectScores)) {
          if (skillSubjectIds.has(id)) {
            skillScores[id] = marks
          } else {
            subjectScores[id] = marks
          }
        }
        return { ...row, subjectScores, skillScores }
      })

      const response = await uploadApi.examResults({
        examId,
        classStandardId,
        includeSkill,
        skillMaxTotal: includeSkill ? Number(skillMaxTotal) : null,
        results: processedResults,
        fileName: file.name,
        uploadedBy: user?.email || null,
      })

      setResult({ ...response, warnings })
      onUploaded?.({ type: 'examResults', fileName: file.name, ...response, status: 'SUCCESS' })
    } catch (err) {
      setError(err.message || 'Upload failed.')
      onUploaded?.({ type: 'examResults', fileName: file.name, status: 'FAILED', errorLog: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div role="dialog" aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">Upload Exam Results</h2>
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Program, Exam, Class Standard */}
          <section className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Program <span className="text-red-500">*</span>
                <select value={programId} onChange={(e) => setProgramId(e.target.value)}
                  disabled={submitting} className={inputCls}>
                  <option value="">{loadingOptions ? 'Loading…' : 'Select program...'}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Exam <span className="text-red-500">*</span>
                <select value={examId} onChange={(e) => setExamId(e.target.value)}
                  disabled={submitting || !programId} className={inputCls}>
                  <option value="">
                    {!programId ? 'Select program first' : 'Select exam...'}
                  </option>
                  {filteredExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Class Standard <span className="text-red-500">*</span>
                <select value={classStandardId} onChange={(e) => setClassStandardId(e.target.value)}
                  disabled={submitting || !programId} className={inputCls}>
                  <option value="">
                    {!programId ? 'Select program first' : 'Select class...'}
                  </option>
                  {filteredClassStandards.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.standardName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* File */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">File</h3>
            <IntermediateFilePicker file={file} onFileChange={setFile} disabled={submitting} />
          </section>

          {/* Row range */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Sheet / Tab
              <input type="text" value={tabName} onChange={(e) => setTabName(e.target.value)}
                disabled={submitting} placeholder="First sheet" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Start row
              <input type="number" min="2" value={startRow} onChange={(e) => setStartRow(e.target.value)}
                disabled={submitting} placeholder="2" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              End row
              <input type="number" min="2" value={endRow} onChange={(e) => setEndRow(e.target.value)}
                disabled={submitting} placeholder="Last row" className={inputCls} />
            </label>
          </section>

          {/* Student Code Column */}
          <section>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Student Roll No Column <span className="text-red-500">*</span>
              <input type="text" value={studentCodeColumn}
                onChange={(e) => setStudentCodeColumn(e.target.value)}
                disabled={submitting} placeholder="e.g. A or RollNo" className={inputCls} />
            </label>
          </section>

          {/* Subject Columns */}
          {classStandardId && classSubjects.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Subject Columns</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {classSubjects.map((cs) => (
                  <label key={cs.id} className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                    <span>{cs.subjectCode || cs.subjectName}</span>
                    <input type="text" value={subjectColumns[cs.subjectId] || ''}
                      onChange={(e) => handleSubjectColumn(cs.subjectId, e.target.value)}
                      disabled={submitting} placeholder={`e.g. ${cs.subjectCode || 'B'}`}
                      className={inputCls} />
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Skill Scores Toggle */}
          {skillSubjects.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Skill Scores</h3>
                <button
                  type="button"
                  onClick={() => setIncludeSkill(!includeSkill)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    includeSkill ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeSkill ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {includeSkill && (
                <div className="space-y-3 rounded-md border border-brand-200 bg-brand-50 p-3">
                  <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                    Skill Max Total Marks <span className="text-red-500">*</span>
                    <input type="number" min="1" value={skillMaxTotal}
                      onChange={(e) => setSkillMaxTotal(e.target.value)}
                      disabled={submitting} placeholder="e.g. 100" className={inputCls} />
                    <span className="text-[11px] font-normal text-gray-500">
                      Total maximum marks for all skill subjects combined.
                    </span>
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {skillSubjects.map((sk) => (
                      <label key={sk.id} className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                        <span>{sk.name}</span>
                        <input type="text" value={skillColumns[sk.id] || ''}
                          onChange={(e) => handleSkillColumn(sk.id, e.target.value)}
                          disabled={submitting} placeholder={`Column for ${sk.name}`}
                          className={inputCls} />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <div className="font-medium">Inserted: {result.inserted ?? 0}</div>
              {result.skipped ? (
                <div className="text-xs">
                  Skipped — in-file dups: {result.skipped.inFile ?? 0} · already in DB: {result.skipped.inDb ?? 0} · invalid: {result.skipped.invalid ?? 0}
                </div>
              ) : null}
              {result.errors?.length ? (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Errors ({result.errors.length})</summary>
                  <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-4">
                    {result.errors.slice(0, 50).map((e, i) => <li key={i}>{e.message || JSON.stringify(e)}</li>)}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Upload Results
          </button>
        </footer>
      </div>
    </div>
  )
}
