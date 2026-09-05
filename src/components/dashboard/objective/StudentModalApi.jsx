import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fmt, pct } from './utils.js'
import { intAnalyticsApi } from '../../../lib/intermediateAnalyticsApi.js'
import { generateStudentPDF } from '../../../utils/generateStudentPDF.js'
import { generateStudentSparkPDF } from '../../../utils/generateStudentSparkPDF.js'
import { categorizeBySipi, namedSubtopics } from '../../../utils/categorizeBySipi.js'
import LoadingSpinner from '../../LoadingSpinner.jsx'
import SparkReportModal from './SparkReportModalNew.jsx'

const STAT_TONE = {
  red700: 'text-brand-700',
  red600: 'text-brand-600',
  red500: 'text-brand-500',
  red400: 'text-brand-400',
  gray: 'text-gray-500',
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </div>
      <div className={`mt-1.5 font-serif text-2xl font-semibold leading-none ${STAT_TONE[tone]}`}>
        {value}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="mt-5 mb-2.5 border-b-2 border-gray-200 pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
      {children}
    </div>
  )
}

function SipiBar({ sipi, maxSipi, color }) {
  const width = maxSipi > 0 ? Math.min(100, ((sipi || 0) / maxSipi) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color || '#6B7280' }}
        />
      </div>
      <span className="w-12 text-right font-mono text-xs font-bold text-gray-800">
        {sipi == null ? '–' : Number(sipi).toFixed(0)}
      </span>
    </div>
  )
}

function SipiItemList({ items, emptyText, tone }) {
  const maxSipi = items.reduce((m, t) => Math.max(m, t.SIPI || 0), 0)
  const border = tone === 'weak' ? 'border-red-100 bg-red-50/30 hover:bg-red-50' : 'border-green-100 bg-green-50/30 hover:bg-green-50'
  if (!items.length) {
    return (
      <div className="py-4 text-center">
        <div className="text-xs text-gray-600">{emptyText}</div>
      </div>
    )
  }
  return (
    <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
      {items.map((t, idx) => (
        <div key={idx} className={`flex items-center gap-2 rounded-md border p-2 text-xs transition ${border}`}>
          <div className="flex-1 min-w-0">
            <div className="truncate font-semibold text-gray-900">
              {t.subtopicName || t.topicName || 'Unknown'}
            </div>
            <div className="truncate text-[10px] text-gray-500">
              {t.subtopicName ? `${t.topicName} • ${t.subjectName}` : t.subjectName}
            </div>
          </div>
          <SipiBar sipi={t.SIPI} maxSipi={maxSipi} color={t.interpretationColor} />
        </div>
      ))}
    </div>
  )
}

export default function StudentModalApi({ studentCode, allFilters, currentExam, currentSubject, streamName, yearName, onClose }) {
  const [data, setData] = useState(null)
  const [diagnostics, setDiagnostics] = useState({
    table1: null, table2: null, table3: null,
    table4: null, table5: null, table6: null,
    table4_detailed: null, table5_detailed: null,
  })
  const [loading, setLoading] = useState(true)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [showSparkModal, setShowSparkModal] = useState(false)
  const [showAllExams, setShowAllExams] = useState(true) // Toggle: true = all exams, false = selected exams
  const [selectedExamIds, setSelectedExamIds] = useState([]) // Array of exam IDs when in selected mode
  const [availableExams, setAvailableExams] = useState([]) // List of exams from filters

  // Fetch available exams when modal opens (picker only — do not auto-select)
  useEffect(() => {
    let cancelled = false
    intAnalyticsApi.headerFilters(allFilters)
      .then((meta) => {
        if (cancelled) return
        setAvailableExams(meta.exams || [])
      })
      .catch((e) => console.error('Failed to load exams:', e))
    return () => { cancelled = true }
  }, [allFilters])

  // Default the first exam only when the user switches to "selected exams"
  useEffect(() => {
    if (!showAllExams && selectedExamIds.length === 0 && availableExams.length > 0) {
      setSelectedExamIds([availableExams[0].id])
    }
  }, [showAllExams, availableExams, selectedExamIds.length])

  const examKey = showAllExams ? 'ALL' : selectedExamIds.join(',')

  // One report call: stream built once on the server
  useEffect(() => {
    if (!showAllExams && selectedExamIds.length === 0) return

    let cancelled = false
    setLoading(true)
    setDiagnosticsLoading(true)
    setData(null)
    setDiagnostics({
      table1: null, table2: null, table3: null,
      table4: null, table5: null, table6: null,
      table4_detailed: null, table5_detailed: null,
    })

    const filters = showAllExams
      ? { ...allFilters, exam: undefined, subject: undefined }
      : { ...allFilters, exam: selectedExamIds.join(','), subject: undefined }

    const diagnosticFilters = {
      streamid: filters.streamid,
      examtypeid: filters.examtypeid,
      branchid: filters.branchid,
      academicyearid: filters.academicyearid,
      exam: filters.exam,
      subject: filters.subject,
    }

    intAnalyticsApi.diagnosticsReport(studentCode, diagnosticFilters)
      .then((report) => {
        if (cancelled) return
        setData(report.overview || null)
        setDiagnostics({
          table1: report.table1,
          table2: report.table2,
          table3: report.table3,
          table4: report.table4,
          table5: report.table5,
          table6: report.table6,
          table4_detailed: report.table4_detailed,
          table5_detailed: report.table5_detailed,
        })
        setErr(null)
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setDiagnosticsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [studentCode, allFilters, showAllExams, examKey])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto bg-gray-900/60 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toggle and Exam Selector - Top Bar */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700">Report Scope:</span>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
              <button
                onClick={() => setShowAllExams(true)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition ${
                  showAllExams
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Exams
              </button>
              <button
                onClick={() => setShowAllExams(false)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition ${
                  !showAllExams
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Select Exams
              </button>
            </div>
          </div>

          {/* Exam Selector - Checkbox List */}
          {!showAllExams && availableExams.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">
                  {selectedExamIds.length} of {availableExams.length} exam{availableExams.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedExamIds(availableExams.map(e => e.id))}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setSelectedExamIds(availableExams.length > 0 ? [availableExams[0].id] : [])}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-white">
                {availableExams.map((exam) => {
                  const isSelected = selectedExamIds.includes(exam.id)
                  return (
                    <label
                      key={exam.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExamIds([...selectedExamIds, exam.id])
                          } else {
                            const newSelected = selectedExamIds.filter(id => id !== exam.id)
                            // Keep at least one exam selected
                            if (newSelected.length > 0) {
                              setSelectedExamIds(newSelected)
                            }
                          }
                        }}
                        className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
                      />
                      <span className="flex-1 text-sm text-gray-900">
                        {exam.name || exam.examname || exam.id}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-semibold text-brand-600">✓</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="absolute right-5 top-5 flex gap-2">
          {data && !loading && (
            <>
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
                disabled={diagnosticsLoading}
                onClick={(e) => {
                  e.preventDefault();
                  setShowSparkModal(true);
                }}
                aria-label="Open SPARK Report"
              >
                <Download className="h-4 w-4" />
                Report
              </button>
              {/* <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-md border border-brand-500 bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
                disabled={diagnosticsLoading}
                onClick={(e) => {
                  e.preventDefault();
                  generateStudentPDF(studentCode, data, diagnostics);
                }}
                aria-label="Download PDF"
              >
                <Download className="h-4 w-4" />
                PDF
              </button> */}
            </>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="font-serif text-2xl font-semibold text-gray-900">
          {data?.studentName || studentCode}
          {data?.branchName ? <span className="ml-2 text-base font-normal text-gray-500">({data.branchName})</span> : null}
        </div>
        {data?.studentName && (
          <div className="mt-0.5 font-mono text-xs text-gray-500">{studentCode}</div>
        )}

        {loading && <div className="mt-8"><LoadingSpinner label="Loading…" /></div>}
        {err && <div className="mt-8 text-sm text-red-600">{err}</div>}

        {data && !loading && (
          <>
            <div className="mt-1 font-mono text-xs text-gray-500">
              {data.kind} · {(() => {
                const exams = [...new Set((data.records || []).map(r => r.exam))]
                const subjects = [...new Set((data.records || []).map(r => r.subject))]
                return `${exams.length} exam${exams.length !== 1 ? 's' : ''} · ${subjects.length} subject${subjects.length !== 1 ? 's' : ''}`
              })()}
            </div>

            {data.records && data.records.length > 0 && (
              (() => {
                const recs = data.records || []
                const byExam = {}
                recs.forEach((r) => {
                  if (!byExam[r.exam]) byExam[r.exam] = []
                  byExam[r.exam].push(r)
                })
                const examCount = Object.keys(byExam).length || 1

                if (examCount === 1) {
                  const totalScore = recs.reduce((s, r) => s + r.score, 0)
                  const totalR = recs.reduce((s, r) => s + r.right, 0)
                  const totalW = recs.reduce((s, r) => s + r.wrong, 0)
                  const totalL = recs.reduce((s, r) => s + r.left, 0)
                  const totalB = recs.reduce((s, r) => s + (r.bonus || 0), 0)
                  const totalNQ = recs.reduce((s, r) => s + (r.nQ || (r.right + r.wrong + r.left + (r.bonus || 0))), 0)
                  const accuracy = totalNQ > 0 ? ((totalR + totalB) / totalNQ) * 100 : 0
                  return (
                    <>
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <Stat label="Score" value={fmt(totalScore)} tone="red700" />
                        <Stat label="Accuracy" value={accuracy.toFixed(1) + '%'} tone="red600" />
                        <Stat label="Correct" value={totalR} tone="red500" />
                        <Stat label="Wrong" value={totalW} tone="red700" />
                        <Stat label="Unattempted" value={totalL} tone="gray" />
                        {totalB > 0 && <Stat label="Bonus" value={totalB} tone="red400" />}
                      </div>
                      <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-[10px] text-gray-600">
                        <div className="font-semibold text-gray-700">1 exam</div>
                        <div>• Accuracy = [(Correct + Bonus) / Total Questions] × 100 = {totalR + totalB} / {totalNQ} × 100</div>
                      </div>
                    </>
                  )
                }

                // Multiple exams: compute per-exam stats then average
                const perExamStats = Object.values(byExam).map((examRecs) => {
                  const score = examRecs.reduce((s, r) => s + r.score, 0)
                  const right = examRecs.reduce((s, r) => s + r.right, 0)
                  const wrong = examRecs.reduce((s, r) => s + r.wrong, 0)
                  const left = examRecs.reduce((s, r) => s + r.left, 0)
                  const bonus = examRecs.reduce((s, r) => s + (r.bonus || 0), 0)
                  const nQ = examRecs.reduce((s, r) => s + (r.nQ || (r.right + r.wrong + r.left + (r.bonus || 0))), 0)
                  const accuracy = nQ > 0 ? ((right + bonus) / nQ) * 100 : 0
                  return { score, right, wrong, left, bonus, nQ, accuracy }
                })
                const avgScore = +(perExamStats.reduce((s, e) => s + e.score, 0) / examCount).toFixed(2)
                const avgAccuracy = +(perExamStats.reduce((s, e) => s + e.accuracy, 0) / examCount).toFixed(1)
                const avgRight = Math.round(perExamStats.reduce((s, e) => s + e.right, 0) / examCount)
                const avgWrong = Math.round(perExamStats.reduce((s, e) => s + e.wrong, 0) / examCount)
                const avgLeft = Math.round(perExamStats.reduce((s, e) => s + e.left, 0) / examCount)
                const avgBonus = Math.round(perExamStats.reduce((s, e) => s + e.bonus, 0) / examCount)

                return (
                  <>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      <Stat label="Avg Score" value={fmt(avgScore)} tone="red700" />
                      <Stat label="Avg Accuracy" value={avgAccuracy + '%'} tone="red600" />
                      <Stat label="Avg Correct" value={avgRight} tone="red500" />
                      <Stat label="Avg Wrong" value={avgWrong} tone="red700" />
                      <Stat label="Avg Unattempted" value={avgLeft} tone="gray" />
                      {avgBonus > 0 && <Stat label="Avg Bonus" value={avgBonus} tone="red400" />}
                    </div>
                    <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-[10px] text-gray-600">
                      <div className="font-semibold text-gray-700">Averaged across {examCount} exams</div>
                      <div>• Avg Score = Sum of exam scores / {examCount}</div>
                      <div>• Avg Accuracy = Average of per-exam accuracies [(Correct+Bonus)/Total Questions × 100]</div>
                    </div>
                  </>
                )
              })()
            )}

            {/* Subject-wise Performance Chart */}
            {diagnostics?.table1?.subjects && diagnostics.table1.subjects.length > 0 && (
              <>
                <SectionTitle>Subject-wise Performance Analysis</SectionTitle>
                <div className="mb-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                  {/* Legend */}
                  <div className="mb-3 flex items-center gap-4 text-xs">
                    {diagnostics.table1.subjects.some(s => s.individualAccuracy != null) && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-blue-500"></div>
                        <span className="text-gray-600">Individual %</span>
                      </div>
                    )}
                    {diagnostics.table1.subjects.some(s => s.grandAccuracy != null) && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-green-500"></div>
                        <span className="text-gray-600">Grand %</span>
                      </div>
                    )}
                    {diagnostics.table1.subjects.some(s => s.executionDrop != null) && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-amber-500"></div>
                        <span className="text-gray-600">Exec. Drop</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {diagnostics.table1.subjects.map((subject, idx) => {
                      const hasIndiv = subject.individualAccuracy != null;
                      const hasGrand = subject.grandAccuracy != null;
                      const indivWidth = hasIndiv ? subject.individualAccuracy : 0;
                      const grandWidth = hasGrand ? subject.grandAccuracy : 0;

                      return (
                        <div key={idx} className="rounded-md border border-gray-100 bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">{subject.subjectName}</span>
                            <div className="flex gap-3 text-xs">
                              {hasIndiv && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                                  I: {subject.individualAccuracy.toFixed(1)}%
                                </span>
                              )}
                              {hasGrand && (
                                <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                                  G: {subject.grandAccuracy.toFixed(1)}%
                                </span>
                              )}
                              {subject.executionDrop != null && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                  Drop: {subject.executionDrop.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {hasIndiv && (
                              <div className="flex items-center gap-2">
                                <span className="w-12 text-xs text-gray-500">Indiv</span>
                                <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
                                  <div
                                    className="h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                    style={{ width: `${indivWidth}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {hasGrand && (
                              <div className="flex items-center gap-2">
                                <span className="w-12 text-xs text-gray-500">Grand</span>
                                <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
                                  <div
                                    className="h-full rounded-md bg-gradient-to-r from-green-500 to-green-600 transition-all"
                                    style={{ width: `${grandWidth}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <p className="mb-1 text-[10px] text-gray-500">
              Ranked by SIPI — higher SIPI = weaker / higher exam impact
            </p>
            <SectionTitle>Strong Topics (lowest SIPI)</SectionTitle>
            {(() => {
              if (diagnostics.table6 === null) return <LoadingSpinner label="Loading topics…" />
              const { strong } = categorizeBySipi(diagnostics?.table6?.topics)
              return <SipiItemList items={strong} emptyText="No strong topics yet" tone="strong" />
            })()}

            <SectionTitle>Weak Topics (highest SIPI)</SectionTitle>
            {(() => {
              if (diagnostics.table6 === null) return <LoadingSpinner label="Loading topics…" />
              const { weak } = categorizeBySipi(diagnostics?.table6?.topics)
              return <SipiItemList items={weak} emptyText="No weak topics — SIPI is low across topics" tone="weak" />
            })()}

            <SectionTitle>Strong Subtopics (lowest SIPI)</SectionTitle>
            {(() => {
              if (diagnostics.table6 === null) return <LoadingSpinner label="Loading subtopics…" />
              const { strong } = categorizeBySipi(namedSubtopics(diagnostics?.table6?.subtopics))
              return <SipiItemList items={strong} emptyText="No strong subtopics yet" tone="strong" />
            })()}

            <SectionTitle>Weak Subtopics (highest SIPI)</SectionTitle>
            {(() => {
              if (diagnostics.table6 === null) return <LoadingSpinner label="Loading subtopics…" />
              const { weak } = categorizeBySipi(namedSubtopics(diagnostics?.table6?.subtopics))
              return <SipiItemList items={weak} emptyText="No weak subtopics — SIPI is low across subtopics" tone="weak" />
            })()}

            <SectionTitle>Test-wise Breakdown</SectionTitle>
            {(() => {
              const sorted = [...(data.records || [])].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.exam.localeCompare(b.exam))
              const deduped = []
              const seen = new Set()
              sorted.forEach((r) => {
                const key = `${r.exam}::${r.subject}`
                if (!seen.has(key)) {
                  seen.add(key)
                  deduped.push(r)
                }
              })

              const allSubjects = [...new Set(deduped.map((r) => r.subject))]
              const byExam = {}
              deduped.forEach((r) => {
                if (!byExam[r.exam]) byExam[r.exam] = {}
                byExam[r.exam][r.subject] = r
              })
              const examNames = Object.keys(byExam)

              return (
                <div className="space-y-3">
                  {examNames.map((examName) => {
                    const examRecs = byExam[examName]
                    const allRecs = Object.values(examRecs)
                    const totalScore = allRecs.reduce((s, r) => s + r.score, 0)
                    const totalR = allRecs.reduce((s, r) => s + r.right, 0)
                    const totalBonus = allRecs.reduce((s, r) => s + (r.bonus || 0), 0)
                    const totalNQ = allRecs.reduce((s, r) => s + (r.nQ || (r.right + r.wrong + r.left + (r.bonus || 0))), 0)
                    const totalAcc = totalNQ > 0 ? pct(totalR + totalBonus, totalNQ) : 0

                    return (
                      <div key={examName} className="rounded-lg border border-gray-200 overflow-hidden">
                        {/* Exam header */}
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <span className="text-xs font-bold text-gray-800">{examName}</span>
                          <div className="flex items-center gap-4 text-[11px]">
                            <span className="text-gray-500">Score: <span className="font-bold text-gray-900">{fmt(totalScore)}</span></span>
                            <span className="text-gray-500">Accuracy: <span className="font-bold text-gray-900">{totalAcc.toFixed(0)}%</span></span>
                          </div>
                        </div>
                        {/* Subject cards in a row */}
                        <div className="flex divide-x-2 divide-gray-300">
                          {allSubjects.map((subj) => {
                            const r = examRecs[subj]
                            if (!r) return (
                              <div key={subj} className="flex-1 px-3 py-2.5 text-center text-xs text-gray-300">—</div>
                            )
                            const nQ = r.nQ || (r.right + r.wrong + r.left + (r.bonus || 0))
                            const acc = pct(r.right + (r.bonus || 0), nQ)
                            return (
                              <div key={subj} className="flex-1 px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase text-gray-600">{subj}</span>
                                  <span className="inline-flex items-center gap-3 text-xs">
                                    <span className="text-gray-500">Score: <span className="font-mono font-bold text-brand-600">{fmt(r.score)}</span></span>
                                    <span className="text-gray-500">Acc: <span className="font-mono font-bold text-gray-800">{acc.toFixed(0)}%</span></span>
                                  </span>
                                </div>
                                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-mono">
                                  <span className="font-semibold text-green-600">{r.right}R</span>
                                  <span className="font-semibold text-red-500">{r.wrong}W</span>
                                  <span className="font-semibold text-gray-400">{r.left}L</span>
                                  {r.bonus > 0 && <span className="font-semibold text-purple-500">{r.bonus}B</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </>
        )}

      </div>

      {/* SPARK Report Modal */}
      <SparkReportModal
        show={showSparkModal}
        onClose={() => setShowSparkModal(false)}
        studentCode={studentCode}
        data={data}
        diagnostics={diagnostics}
        streamName={streamName}
        yearName={yearName}
        allFilters={allFilters}
      />
    </div>
  )
}
