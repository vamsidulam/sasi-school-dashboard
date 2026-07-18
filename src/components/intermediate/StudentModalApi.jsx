import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fmt, pct, heatColor } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'
import { generateStudentPDF } from '../../utils/generateStudentPDF.js'

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

export default function StudentModalApi({ studentCode, filters, onClose }) {
  const [data, setData] = useState(null)
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'diagnostics'
  const [level2View, setLevel2View] = useState('table') // 'table' | 'graph'
  const [selectedSubject, setSelectedSubject] = useState('all') // Subject filter for diagnostics

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    // Fetch both overview data and diagnostics
    const diagnosticFilters = { streamid: filters.streamid }

    Promise.all([
      intAnalyticsApi.overviewStudentDetail(filters, studentCode),
      Promise.all([
        intAnalyticsApi.diagnosticsLevel1Table1(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel1Table2(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel1Table3(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel2Table1(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel2Table2(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel3(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel2Table1Detailed(studentCode, diagnosticFilters),
        intAnalyticsApi.diagnosticsLevel2Table2Detailed(studentCode, diagnosticFilters),
      ]).then(([table1, table2, table3, table4, table5, table6, table4_detailed, table5_detailed]) => ({
        table1,
        table2,
        table3,
        table4,
        table5,
        table6,
        table4_detailed,
        table5_detailed,
      })),
    ])
      .then(([overviewData, diagnosticsData]) => {
        if (cancelled) return
        setData(overviewData)
        setDiagnostics(diagnosticsData)
        setErr(null)
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studentCode, filters])

  // Filter diagnostics data by selected subject FIRST
  const filteredDiagnostics = diagnostics && selectedSubject !== 'all' ? {
    table1: diagnostics.table1?.subjects
      ? { ...diagnostics.table1, subjects: diagnostics.table1.subjects.filter(s => s.subjectid === selectedSubject) }
      : diagnostics.table1,
    table2: diagnostics.table2?.topics
      ? { ...diagnostics.table2, topics: diagnostics.table2.topics.filter(t => t.subjectid === selectedSubject) }
      : diagnostics.table2,
    table3: diagnostics.table3?.subtopics
      ? { ...diagnostics.table3, subtopics: diagnostics.table3.subtopics.filter(st => st.subjectid === selectedSubject) }
      : diagnostics.table3,
    table4: diagnostics.table4?.subjects
      ? { ...diagnostics.table4, subjects: diagnostics.table4.subjects.filter(s => s.subjectid === selectedSubject) }
      : diagnostics.table4,
    table5: diagnostics.table5?.subjects
      ? { ...diagnostics.table5, subjects: diagnostics.table5.subjects.filter(s => s.subjectid === selectedSubject) }
      : diagnostics.table5,
    table6: {
      topics: diagnostics.table6?.topics
        ? diagnostics.table6.topics.filter(t => t.subjectid === selectedSubject)
        : [],
      subtopics: diagnostics.table6?.subtopics
        ? diagnostics.table6.subtopics.filter(st => st.subjectid === selectedSubject)
        : []
    }
  } : diagnostics

  // Extract unique subjects from diagnostics data
  const availableSubjects = diagnostics ? (() => {
    const subjectsSet = new Set()

    // From table1 (Level 1 Table 1)
    if (diagnostics.table1?.subjects) {
      diagnostics.table1.subjects.forEach(s => {
        if (s.subjectid && s.subjectName) {
          subjectsSet.add(JSON.stringify({ id: s.subjectid, name: s.subjectName }))
        }
      })
    }

    // From table2 (Level 1 Table 2 - topics)
    if (diagnostics.table2?.topics) {
      diagnostics.table2.topics.forEach(t => {
        if (t.subjectid && t.subjectName) {
          subjectsSet.add(JSON.stringify({ id: t.subjectid, name: t.subjectName }))
        }
      })
    }

    return Array.from(subjectsSet)
      .map(s => JSON.parse(s))
      .sort((a, b) => a.name.localeCompare(b.name))
  })() : []

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto bg-gray-900/60 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-5 top-5 flex gap-2">
          {data && diagnostics && !loading && (
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-md border border-brand-500 bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700"
              onClick={(e) => {
                e.preventDefault();
                console.log('PDF button clicked', { studentCode, data, diagnostics });
                generateStudentPDF(studentCode, data, diagnostics);
              }}
              aria-label="Download PDF"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
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

        {loading && <div className="mt-8 text-sm text-gray-500">Loading…</div>}
        {err && <div className="mt-8 text-sm text-red-600">{err}</div>}

        {data && !loading && (
          <>
            {/* Tab Navigation */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnostics')}
                  className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                    activeTab === 'diagnostics'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Diagnostic Report
                </button>
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
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
                const totalScore = recs.reduce((s, r) => s + r.score, 0)
                const totalR = recs.reduce((s, r) => s + r.right, 0)
                const totalW = recs.reduce((s, r) => s + r.wrong, 0)
                const totalL = recs.reduce((s, r) => s + r.left, 0)
                const totalAtt = recs.reduce((s, r) => s + (r.att || (r.right + r.wrong)), 0)
                const avgScore = totalScore / examCount
                const accuracy = totalAtt > 0 ? (totalR / totalAtt) * 100 : 0
                return (
                  <>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      <Stat label="Avg Score" value={fmt(avgScore)} tone="red700" />
                      <Stat label="Accuracy" value={accuracy.toFixed(1) + '%'} tone="red600" />
                      <Stat label="Correct" value={totalR} tone="red500" />
                      <Stat label="Wrong" value={totalW} tone="red700" />
                      <Stat label="Unattempted" value={totalL} tone="gray" />
                    </div>
                    <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-[10px] text-gray-600">
                      <div className="font-semibold text-gray-700">Across {examCount} exam{examCount !== 1 ? 's' : ''}</div>
                      <div>• Avg Score = Total Score / Number of Exams = {fmt(totalScore)} / {examCount}</div>
                      <div>• Accuracy = [Correct / Attempted] × 100</div>
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
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-blue-500"></div>
                      <span className="text-gray-600">Individual %</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-green-500"></div>
                      <span className="text-gray-600">Grand %</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-amber-500"></div>
                      <span className="text-gray-600">Exec. Drop</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredDiagnostics.table1.subjects.map((subject, idx) => {
                      const maxValue = 100;
                      const indivWidth = (subject.individualAccuracy / maxValue) * 100;
                      const grandWidth = (subject.grandAccuracy / maxValue) * 100;

                      return (
                        <div key={idx} className="rounded-md border border-gray-100 bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">{subject.subjectName}</span>
                            <div className="flex gap-3 text-xs">
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                                I: {subject.individualAccuracy?.toFixed(1)}%
                              </span>
                              <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                                G: {subject.grandAccuracy?.toFixed(1)}%
                              </span>
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                Drop: {subject.executionDrop?.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {/* Individual Accuracy Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-xs text-gray-500">Indiv</span>
                              <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
                                <div
                                  className="h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                  style={{ width: `${indivWidth}%` }}
                                />
                              </div>
                            </div>
                            {/* Grand Accuracy Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-xs text-gray-500">Grand</span>
                              <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
                                <div
                                  className="h-full rounded-md bg-gradient-to-r from-green-500 to-green-600 transition-all"
                                  style={{ width: `${grandWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <SectionTitle>Strong Topics (Top 10)</SectionTitle>
            {(() => {
              const topics = diagnostics?.table2?.topics || [];
              const strongTopics = topics
                .filter(t => t.combinedIndex != null && t.combinedIndex >= 70)
                .sort((a, b) => (b.combinedIndex || 0) - (a.combinedIndex || 0))
                .slice(0, 10);

              return strongTopics.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mb-2 text-2xl">✅</div>
                  <div className="text-xs text-gray-600">No strong topics yet - keep working!</div>
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {strongTopics.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-green-100 bg-green-50/30 p-2 text-xs transition hover:bg-green-50">
                      <div className="flex-1">
                        <div className="truncate font-semibold text-gray-900">{t.topicName || 'Unknown'}</div>
                        <div className="truncate text-[10px] text-gray-500">
                          {t.subjectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: t.combinedIndex + '%',
                              background: t.interpretationColor || heatColor(t.combinedIndex)
                            }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs font-bold text-gray-800">
                          {t.combinedIndex.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <SectionTitle>Focus Areas - Weakest Topics (Top 10)</SectionTitle>
            {(() => {
              const topics = diagnostics?.table2?.topics || [];
              const weakTopics = topics
                .filter(t => t.combinedIndex != null && t.combinedIndex < 50)
                .sort((a, b) => (a.combinedIndex || 0) - (b.combinedIndex || 0))
                .slice(0, 10);

              return weakTopics.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mb-2 text-2xl">🎯</div>
                  <div className="text-xs text-gray-600">Great! No weak topics found</div>
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {weakTopics.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50/30 p-2 text-xs transition hover:bg-red-50">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        !
                      </div>
                      <div className="flex-1">
                        <div className="truncate font-semibold text-gray-900">{t.topicName || 'Unknown'}</div>
                        <div className="truncate text-[10px] text-gray-500">
                          {t.subjectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: Math.max(5, t.combinedIndex) + '%',
                              background: t.interpretationColor || heatColor(t.combinedIndex)
                            }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs font-bold text-gray-800">
                          {t.combinedIndex.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <SectionTitle>Strong Subtopics (Top 10)</SectionTitle>
            {(() => {
              const subtopics = diagnostics?.table3?.subtopics || [];
              // Remove duplicates based on unique combination of subject, topic, and subtopic
              const uniqueSubtopics = subtopics.reduce((acc, current) => {
                const key = `${current.subjectName}-${current.topicName}-${current.subtopicName}`;
                if (!acc.some(item => `${item.subjectName}-${item.topicName}-${item.subtopicName}` === key)) {
                  acc.push(current);
                }
                return acc;
              }, []);

              const strongSubtopics = uniqueSubtopics
                .filter(st => st.combinedIndex != null && st.combinedIndex >= 70)
                .sort((a, b) => (b.combinedIndex || 0) - (a.combinedIndex || 0))
                .slice(0, 10);

              return strongSubtopics.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mb-2 text-2xl">✅</div>
                  <div className="text-xs text-gray-600">No data available</div>
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {strongSubtopics.map((s, idx) => (
                    <div key={`strong-${s.subjectName}-${s.topicName}-${s.subtopicName}-${idx}`} className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/30 p-2 text-xs">
                      <div className="flex-1">
                        <div className="truncate font-semibold text-gray-900">{s.subtopicName || 'General'}</div>
                        <div className="truncate text-[10px] text-gray-500">
                          {s.topicName} • {s.subjectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: s.combinedIndex + '%',
                              background: s.interpretationColor || heatColor(s.combinedIndex)
                            }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs font-bold text-gray-800">
                          {s.combinedIndex.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <SectionTitle>Weak Subtopics - Priority Focus Areas (Top 10)</SectionTitle>
            {(() => {
              const subtopics = diagnostics?.table3?.subtopics || [];
              // Remove duplicates based on unique combination of subject, topic, and subtopic
              const uniqueSubtopics = subtopics.reduce((acc, current) => {
                const key = `${current.subjectName}-${current.topicName}-${current.subtopicName}`;
                if (!acc.some(item => `${item.subjectName}-${item.topicName}-${item.subtopicName}` === key)) {
                  acc.push(current);
                }
                return acc;
              }, []);

              const weakSubtopics = uniqueSubtopics
                .filter(st => st.combinedIndex != null && st.combinedIndex < 50)
                .sort((a, b) => (a.combinedIndex || 0) - (b.combinedIndex || 0))
                .slice(0, 10);

              return weakSubtopics.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="mb-2 text-2xl">🎯</div>
                  <div className="text-xs text-gray-600">Excellent! No weak subtopics</div>
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {weakSubtopics.map((s, idx) => (
                    <div key={`weak-${s.subjectName}-${s.topicName}-${s.subtopicName}-${idx}`} className="flex items-center gap-2 rounded-md border border-orange-100 bg-orange-50/30 p-2 text-xs">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                        !
                      </div>
                      <div className="flex-1">
                        <div className="truncate font-semibold text-gray-900">{s.subtopicName || 'General'}</div>
                        <div className="truncate text-[10px] text-gray-500">
                          {s.topicName} • {s.subjectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: Math.max(5, s.combinedIndex) + '%',
                              background: s.interpretationColor || heatColor(s.combinedIndex)
                            }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs font-bold text-gray-800">
                          {s.combinedIndex.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
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
                    const totalAtt = allRecs.reduce((s, r) => s + r.att, 0)
                    const totalAcc = totalAtt > 0 ? pct(totalR, totalAtt) : 0

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
                            const acc = pct(r.right, r.att)
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

            {/* Diagnostics Tab */}
            {activeTab === 'diagnostics' && diagnostics && (
              <>
                <div className="mt-6">
                  <div className="mb-6 text-center">
                    <div className="font-serif text-xl font-semibold text-brand-600">
                      DIAGNOSTIC REPORT
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Comprehensive performance analysis across all tests
                    </div>
                  </div>

                  {/* Subject Filter */}
                  {availableSubjects.length > 0 && (
                    <div className="mb-6 flex items-center justify-center gap-3">
                      <label htmlFor="subject-filter" className="text-sm font-medium text-gray-700">
                        Filter by Subject:
                      </label>
                      <select
                        id="subject-filter"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="all">All Subjects</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* LEVEL 1 SECTION */}
                  <div className="mb-8 rounded-lg border-2 border-brand-200 bg-brand-50/30 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-bold text-white">
                        LEVEL 1
                      </div>
                      <div className="font-serif text-lg font-semibold text-gray-900">
                        What the Student Actually Knows
                      </div>
                    </div>
                    <p className="mb-4 text-xs text-gray-600">
                      Subject-level strength and topic/subtopic-level diagnostic to identify exact knowledge gaps
                    </p>

              {/* Level 1 TABLE 1: Subject Strength */}
              <SectionTitle>Level 1 - TABLE 1: Subject Strength & Stability Profile</SectionTitle>
              {filteredDiagnostics.table1?.subjects && filteredDiagnostics.table1.subjects.length > 0 ? (
                <>
                  <div className="overflow-auto rounded-md border border-gray-100 mb-3">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {['Subject', 'Individual %', 'Grand %', 'Execution Drop', 'Wrong %', 'Left %', 'IL %', 'Behaviour'].map((h) => (
                            <th
                              key={h}
                              className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDiagnostics.table1.subjects.map((s, i) => (
                          <tr key={i}>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                              {s.subjectName || 'Unknown'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                              {s.individualAccuracy != null ? s.individualAccuracy.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                              {s.grandAccuracy != null ? s.grandAccuracy.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                              {s.executionDrop != null ? s.executionDrop.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                              {s.wrongPct != null ? s.wrongPct.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                              {s.leftPct != null ? s.leftPct.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-gray-900">
                              {s.intelligentLeavingPct != null ? s.intelligentLeavingPct.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5">
                              <span
                                className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                                style={{ background: s.ilInterpretationColor || '#6B7280' }}
                              >
                                {s.ilInterpretation || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* IL% Interpretation Legend */}
                  <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {[
                      ['0–10%', 'Overattempting / gambling'],
                      ['10–30%', 'Aggressive but manageable'],
                      ['30–55%', 'Healthy NEET maturity'],
                      ['55–75%', 'Conservative / fear'],
                      ['75%+', 'Avoidance behaviour'],
                    ].map(([range, meaning]) => (
                      <div
                        key={range}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600"
                      >
                        <strong className="font-mono text-gray-900">{range}</strong> {meaning}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
              )}

              {/* Level 1 TABLE 2: Topic-level Analysis */}
              <SectionTitle>Level 1 - TABLE 2: Topic-Level Analysis (IASS/GASS/Combined Index)</SectionTitle>
              {filteredDiagnostics.table2?.topics && filteredDiagnostics.table2.topics.length > 0 ? (
                <div className="overflow-auto rounded-md border border-gray-100 mb-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {['Subject', 'Topic', 'IASS', 'GASS', 'Combined Index', 'Interpretation'].map((h) => (
                          <th
                            key={h}
                            className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDiagnostics.table2.topics.map((t, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-100 px-3 py-2.5">
                            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                              {t.subjectName || '—'}
                            </span>
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                            {t.topicName || 'Unspecified'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {t.IASS != null ? t.IASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {t.GASS != null ? t.GASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                            {t.combinedIndex != null ? t.combinedIndex.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5">
                            <span
                              className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                              style={{ background: t.interpretationColor || '#6B7280' }}
                            >
                              {t.interpretation || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
              )}

              {/* Level 1 TABLE 3: Subtopic-level Analysis */}
              <SectionTitle>Level 1 - TABLE 3: Subtopic-Level Analysis (IASS/GASS/Combined Index)</SectionTitle>
              {filteredDiagnostics.table3?.subtopics && filteredDiagnostics.table3.subtopics.length > 0 ? (
                <div className="overflow-auto rounded-md border border-gray-100 mb-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {['Subject', 'Topic', 'Subtopic', 'IASS', 'GASS', 'Combined Index', 'Interpretation'].map((h) => (
                          <th
                            key={h}
                            className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDiagnostics.table3.subtopics.slice(0, 20).map((st, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-100 px-3 py-2.5">
                            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                              {st.subjectName || '—'}
                            </span>
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-700">
                            {st.topicName || 'Unspecified'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                            {st.subtopicName || 'General'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {st.IASS != null ? st.IASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {st.GASS != null ? st.GASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                            {st.combinedIndex != null ? st.combinedIndex.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5">
                            <span
                              className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                              style={{ background: st.interpretationColor || '#6B7280' }}
                            >
                              {st.interpretation || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredDiagnostics.table3.subtopics.length > 20 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
                      Showing top 20 of {filteredDiagnostics.table3.subtopics.length} subtopics (sorted by weakest first)
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
              )}
                  </div>
                  {/* End of Level 1 Section */}

                  {/* LEVEL 2 SECTION */}
                  <div className="mb-8 rounded-lg border-2 border-purple-200 bg-purple-50/30 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-bold text-white">
                          LEVEL 2
                        </div>
                        <div className="font-serif text-lg font-semibold text-gray-900">
                          How the Student Processes Information
                        </div>
                      </div>
                      {/* Table/Graph Toggle */}
                      <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setLevel2View('table')}
                          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                            level2View === 'table'
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Table View
                        </button>
                        <button
                          type="button"
                          onClick={() => setLevel2View('graph')}
                          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                            level2View === 'graph'
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Graph View
                        </button>
                      </div>
                    </div>
                    <p className="mb-4 text-xs text-gray-600">
                      Cognitive processing ability (CMSI) by question type and difficulty adaptability (CDAI)
                    </p>

              {level2View === 'table' ? (
                <>
                  {/* Level 2 TABLE 1: CMSI - Question Types */}
                  <SectionTitle>TABLE 1: Subject × Question Type (CMSI)</SectionTitle>
              {filteredDiagnostics.table4?.subjects && filteredDiagnostics.table4.subjects.length > 0 ? (
                <div className="overflow-auto rounded-md border border-gray-100 mb-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {['Subject', 'IASS', 'GASS', 'CMSI', 'Interpretation'].map((h) => (
                          <th
                            key={h}
                            className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDiagnostics.table4.subjects.map((s, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                            {s.subjectName || 'Unknown'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {s.IASS != null ? s.IASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {s.GASS != null ? s.GASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                            {s.CMSI != null ? s.CMSI.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5">
                            <span
                              className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                              style={{ background: s.interpretationColor || '#6B7280' }}
                            >
                              {s.interpretation || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
              )}

              {/* Level 2 TABLE 2: CDAI - Difficulty */}
              <SectionTitle>TABLE 2: Subject × Difficulty (CDAI)</SectionTitle>
              {filteredDiagnostics.table5?.subjects && filteredDiagnostics.table5.subjects.length > 0 ? (
                <div className="overflow-auto rounded-md border border-gray-100 mb-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {['Subject', 'IASS', 'GASS', 'CDAI', 'Interpretation'].map((h) => (
                          <th
                            key={h}
                            className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDiagnostics.table5.subjects.map((s, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                            {s.subjectName || 'Unknown'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {s.IASS != null ? s.IASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-gray-700">
                            {s.GASS != null ? s.GASS.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-brand-600">
                            {s.CDAI != null ? s.CDAI.toFixed(1) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2.5">
                            <span
                              className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                              style={{ background: s.interpretationColor || '#6B7280' }}
                            >
                              {s.interpretation || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
              )}
                </>
              ) : (
                // Graph View for Level 2
                <div className="space-y-6">
                  {/* CMSI Graph */}
                  <div>
                    <SectionTitle>GRAPH 1: Subject × Question Type (CMSI)</SectionTitle>
                    {filteredDiagnostics.table4?.subjects && filteredDiagnostics.table4.subjects.length > 0 ? (
                      <div className="rounded-md border border-gray-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-blue-500"></div>
                            <span>IASS (Individual)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-green-500"></div>
                            <span>GASS (Grand)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-purple-600"></div>
                            <span>CMSI (Final)</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {filteredDiagnostics.table4.subjects.map((s, i) => (
                            <div key={i}>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{s.subjectName}</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                                  style={{ background: s.interpretationColor || '#6B7280' }}
                                >
                                  {s.interpretation || '—'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {/* IASS Bar */}
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs text-gray-500">IASS</span>
                                  <div className="relative h-6 flex-1 rounded-md bg-gray-100">
                                    <div
                                      className="h-full rounded-md bg-blue-500 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, s.IASS || 0))}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                      {s.IASS != null ? s.IASS.toFixed(1) : '—'}
                                    </span>
                                  </div>
                                </div>
                                {/* GASS Bar */}
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs text-gray-500">GASS</span>
                                  <div className="relative h-6 flex-1 rounded-md bg-gray-100">
                                    <div
                                      className="h-full rounded-md bg-green-500 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, s.GASS || 0))}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                      {s.GASS != null ? s.GASS.toFixed(1) : '—'}
                                    </span>
                                  </div>
                                </div>
                                {/* CMSI Bar */}
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs font-semibold text-purple-600">CMSI</span>
                                  <div className="relative h-7 flex-1 rounded-md bg-gray-100">
                                    <div
                                      className="h-full rounded-md bg-purple-600 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, s.CMSI || 0))}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                      {s.CMSI != null ? s.CMSI.toFixed(1) : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500">No data available</div>
                    )}
                  </div>

                  {/* CDAI Graph */}
                  <div>
                    <SectionTitle>GRAPH 2: Subject × Difficulty (CDAI)</SectionTitle>
                    {filteredDiagnostics.table5?.subjects && filteredDiagnostics.table5.subjects.length > 0 ? (
                      <div className="rounded-md border border-gray-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-blue-500"></div>
                            <span>IASS (Individual)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-green-500"></div>
                            <span>GASS (Grand)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-purple-600"></div>
                            <span>CDAI (Final)</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {filteredDiagnostics.table5.subjects.map((s, i) => (
                            <div key={i}>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{s.subjectName}</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                                  style={{ background: s.interpretationColor || '#6B7280' }}
                                >
                                  {s.interpretation || '—'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {/* IASS Bar */}
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs text-gray-500">IASS</span>
                                  <div className="relative h-6 flex-1 rounded-md bg-gray-100">
                                    <div
                                      className="h-full rounded-md bg-blue-500 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, s.IASS || 0))}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                      {s.IASS != null ? s.IASS.toFixed(1) : '—'}
                                    </span>
                                  </div>
                                </div>
                                {/* GASS Bar */}
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs text-gray-500">GASS</span>
                                  <div className="relative h-6 flex-1 rounded-md bg-gray-100">
                                    <div
                                      className="h-full rounded-md bg-green-500 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, s.GASS || 0))}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                      {s.GASS != null ? s.GASS.toFixed(1) : '—'}
                                    </span>
                                  </div>
                                </div>
                                {/* CDAI Bar */}
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs font-semibold text-purple-600">CDAI</span>
                                  <div className="relative h-7 flex-1 rounded-md bg-gray-100">
                                    <div
                                      className="h-full rounded-md bg-purple-600 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, s.CDAI || 0))}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                      {s.CDAI != null ? s.CDAI.toFixed(1) : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500">No data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* ========== LEVEL 3: EXAM IMPACT PRIORITY MATRIX ========== */}
              <div className="mb-8 mt-8 rounded-lg border-2 border-orange-200 bg-orange-50/30 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-bold text-white">
                    LEVEL 3
                  </div>
                  <div className="font-serif text-lg font-semibold text-gray-900">
                    HOW and WHERE to Improve
                  </div>
                </div>
                <p className="mb-4 text-xs text-gray-600">
                  Strategic Impact Priority Index (SIPI) — prioritizes topics/subtopics by weakness × complexity × exam weightage
                </p>

                {/* Level 3 Table: Top Priority Topics */}
                <SectionTitle>TABLE: Exam Impact Priority Matrix (Top 10 Topics)</SectionTitle>
                {filteredDiagnostics.table6?.topics && filteredDiagnostics.table6.topics.length > 0 ? (
                  <div className="overflow-auto rounded-md border border-gray-100 mb-6">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {['Subject', 'Topic', 'CMSI', 'CDAI', 'EW', 'SIPI', 'Priority', 'Meaning', 'Suggested Action'].map((h) => (
                            <th
                              key={h}
                              className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDiagnostics.table6.topics.slice(0, 10).map((t, i) => (
                          <tr key={i}>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                              {t.subjectName || 'Unknown'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-gray-700">
                              {t.topicName || 'Unspecified'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-700">
                              {t.CMSI != null ? t.CMSI.toFixed(1) : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-700">
                              {t.CDAI != null ? t.CDAI.toFixed(1) : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-700">
                              {t.EW != null ? t.EW.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-orange-600">
                              {t.SIPI != null ? t.SIPI.toFixed(1) : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5">
                              <span
                                className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                                style={{ background: t.interpretationColor || '#6B7280' }}
                              >
                                {t.priority || '—'}
                              </span>
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                              {t.meaning || '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                              {t.suggestedAction || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
                )}

                {/* Level 3 Subtopics Table */}
                <SectionTitle>TABLE: Priority Subtopics (Top 20)</SectionTitle>
                {filteredDiagnostics.table6?.subtopics && filteredDiagnostics.table6.subtopics.length > 0 ? (
                  <div className="overflow-auto rounded-md border border-gray-100 mb-6">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {['Subject', 'Topic', 'Subtopic', 'CMSI', 'CDAI', 'EW', 'SIPI', 'Priority', 'Meaning', 'Suggested Action'].map((h) => (
                            <th
                              key={h}
                              className="border-b-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDiagnostics.table6.subtopics.slice(0, 20).map((st, i) => (
                          <tr key={i}>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                              {st.subjectName || 'Unknown'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-gray-700">
                              {st.topicName || 'Unspecified'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-gray-700">
                              {st.subtopicName || 'General'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-700">
                              {st.CMSI != null ? st.CMSI.toFixed(1) : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-700">
                              {st.CDAI != null ? st.CDAI.toFixed(1) : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono text-xs text-gray-700">
                              {st.EW != null ? st.EW.toFixed(1) + '%' : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 font-mono font-semibold text-orange-600">
                              {st.SIPI != null ? st.SIPI.toFixed(1) : '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5">
                              <span
                                className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                                style={{ background: st.interpretationColor || '#6B7280' }}
                              >
                                {st.priority || '—'}
                              </span>
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                              {st.meaning || '—'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                              {st.suggestedAction || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mb-6 py-4 text-center text-sm text-gray-500">No data available</div>
                )}

                {/* Level 3 Interpretation Legend */}
                <div className="mt-4 rounded-md bg-white p-4">
                  <div className="mb-2 text-xs font-semibold text-gray-700">SIPI Formula:</div>
                  <div className="mb-3 text-xs text-gray-600">
                    SIPI = (Weakness Factor × Complexity Risk Factor × Exam Weightage) / 10000
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm" style={{ background: '#DC2626' }}></div>
                      <span className="text-gray-600">250+: Critical</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm" style={{ background: '#EA580C' }}></div>
                      <span className="text-gray-600">150-249: High</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm" style={{ background: '#D97706' }}></div>
                      <span className="text-gray-600">100-149: Moderate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm" style={{ background: '#65A30D' }}></div>
                      <span className="text-gray-600">50-99: Low</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm" style={{ background: '#059669' }}></div>
                      <span className="text-gray-600">0-49: Stable</span>
                    </div>
                  </div>
                </div>
              </div>
                </div>
                </div>
              </>
            )}

          </>
        )}

      </div>
    </div>
  )
}
