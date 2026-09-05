import { X, Download, Brain } from 'lucide-react'
import { useState } from 'react'
import { generateStudentSparkPDF } from '../../../utils/generateStudentSparkPDF.js'
import { intAnalyticsApi } from '../../../lib/intermediateAnalyticsApi.js'
import { buildSparkReport, groupSipiBySubject, formatSipiTopicLine, formatSipiSubjectHeader } from '../../../utils/sparkReportModel.js'

function spiStatusClass(status) {
  if (status === 'Outstanding') return 'bg-green-100 text-green-800'
  if (status === 'Excellent') return 'bg-blue-100 text-blue-800'
  if (status === 'Strong') return 'bg-indigo-100 text-indigo-800'
  if (status === 'Steady') return 'bg-gray-100 text-gray-800'
  return 'bg-yellow-100 text-yellow-800'
}

export default function SparkReportModal({
  show,
  onClose,
  studentCode,
  data,
  diagnostics,
  streamName,
  allFilters,
}) {
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  if (!show) return null

  const report = buildSparkReport({
    studentCode,
    data,
    diagnostics,
    aiInsights,
    streamName,
  })

  const handleGenerateAI = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await intAnalyticsApi.sparkInsights(studentCode, {
        streamid: allFilters.streamid,
        yearid: allFilters.yearid,
        examtypeid: allFilters.examtypeid,
        branchid: allFilters.branchid,
        academicyearid: allFilters.academicyearid,
      })
      setAiInsights(result)
    } catch (e) {
      setAiError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handlePrint = () => {
    generateStudentSparkPDF(studentCode, data, diagnostics, aiInsights, streamName)
  }

  const { indicators } = report
  const sipiColumns = groupSipiBySubject(report.sipiTopics)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-slate-900 px-8 py-5">
          <div>
            <h2 className="text-2xl font-bold text-white">STUDENT PERFORMANCE INTELLIGENCE</h2>
            <p className="text-sm text-slate-300 mt-1">SASI SPARK Analytics Report</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 bg-slate-50">
          {/* 1. Identity */}
          <section className="rounded-xl border border-slate-300 bg-white p-8">
            <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 border-b border-slate-200 pb-3">
              Student Identity Card
            </h3>
            <div className="grid grid-cols-4 gap-6 text-base mb-6">
              <div>
                <div className="text-xs text-slate-500 mb-1">Name</div>
                <div className="font-bold text-slate-900">{report.studentName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Program</div>
                <div className="font-bold text-slate-900">{report.streamName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Branch</div>
                <div className="font-bold text-slate-900">{report.branchName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Roll No</div>
                <div className="font-bold text-slate-900">{report.rollNo}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-2">Overall Academic Score</div>
                <div className="text-4xl font-bold text-slate-900">{report.avgInd}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-2">Overall Competitive Score</div>
                <div className="text-4xl font-bold text-slate-900">{report.avgGrand}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-2">Overall Grade</div>
                <div className="text-4xl font-bold text-slate-900">{report.grade}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-2">Learner Type</div>
                <div className="text-sm font-bold text-slate-900 uppercase tracking-wide mt-3">
                  {report.typeOfLearner}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Subject dashboard */}
          <section className="rounded-xl border border-slate-300 bg-white p-8">
            <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 border-b border-slate-200 pb-3">
              Subject Performance Dashboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Subject', 'Ind', 'Grand', 'Drop', 'Wrong', 'Left', 'IDI', 'SPI', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase first:text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.subjectRows.map((row) => (
                    <tr key={row.subjectName} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-bold text-slate-900">{row.subjectName}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.ind}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.grand}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.drop}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.wrong}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.left}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.idi}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{row.spi}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${spiStatusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Indicators */}
          <section className="rounded-xl border border-slate-300 bg-white p-8">
            <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 border-b border-slate-200 pb-3">
              Student Performance Indicators
            </h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
              {[
                ['Strongest Subject', indicators.strongestSubject],
                ['Weakest Subject', indicators.weakestSubject],
                ['Competitive Readiness', indicators.competitiveReadiness],
                ['Execution Consistency', indicators.executionConsistency],
                ['Confidence', indicators.confidenceLevel],
                ['Risk Behaviour', indicators.riskBehaviour],
                ['Decision Making', indicators.decisionMaking],
                ['Learning Consistency', indicators.learningConsistency],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{label}</span>
                  <span className="font-bold text-slate-900">{value}</span>
                </div>
              ))}
              <div className="col-span-2 flex justify-between items-center py-2 border-t border-slate-200 mt-2 pt-4">
                <span className="font-bold text-slate-700 text-base">Learner Archetype</span>
                <span className="font-bold text-slate-900 text-base uppercase tracking-wide">
                  {indicators.typeOfLearner}
                </span>
              </div>
            </div>
          </section>

          {/* 4. Cognitive — same I/G table as PDF */}
          {report.cognitiveRows.length > 0 && (
            <section className="rounded-xl border border-slate-300 bg-white p-8">
              <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 border-b border-slate-200 pb-3">
                Cognitive Processing Profile
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Subject</th>
                      {report.cognitiveHeaders.map((h) => (
                        <th key={h} className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">{h}</th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">CMSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cognitiveRows.map((row) => (
                      <tr key={row.subjectName} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.subjectName}</td>
                        {row.cells.map((cell, i) => (
                          <td key={i} className="px-4 py-3 text-center font-mono text-slate-700">{cell}</td>
                        ))}
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{row.cmsi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 5. Difficulty — same I/G table as PDF */}
          {report.difficultyRows.length > 0 && (
            <section className="rounded-xl border border-slate-300 bg-white p-8">
              <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 border-b border-slate-200 pb-3">
                Difficulty Adaptability Profile
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Subject</th>
                      {report.difficultyHeaders.map((h) => (
                        <th key={h} className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">{h}</th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">CDAI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.difficultyRows.map((row) => (
                      <tr key={row.subjectName} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.subjectName}</td>
                        {row.cells.map((cell, i) => (
                          <td key={i} className="px-4 py-3 text-center font-mono text-slate-700">{cell}</td>
                        ))}
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{row.cdai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* AI mentor */}
          <section className="rounded-xl border border-slate-300 bg-white p-8">
            <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4 border-b border-slate-200 pb-3">
              AI Mentor's Observation
            </h3>
            {!aiInsights && !aiLoading && (
              <button
                type="button"
                onClick={handleGenerateAI}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-4 text-base font-bold text-slate-900 hover:bg-slate-50"
              >
                <Brain className="h-6 w-6" />
                Generate AI Psychology Profile
              </button>
            )}
            {aiLoading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-700" />
                <span className="text-sm text-slate-600">AI is analyzing performance patterns...</span>
              </div>
            )}
            {aiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Error: {aiError}
              </div>
            )}
            {report.aiInsights && (
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line rounded-lg p-5 border border-slate-200 bg-slate-50">
                {report.aiInsights}
              </div>
            )}
          </section>

          {/* Strategic Improvement Matrix — last, 5 topics per subject */}
          {report.sipiTopics.length > 0 && (
            <section className="rounded-xl border border-slate-300 bg-white p-8">
              <h3 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-1 border-b border-slate-200 pb-3">
                Strategic Improvement Matrix
              </h3>
              <p className="mb-4 text-xs text-slate-500">Top 5 SIPI topics per subject</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {sipiColumns.map((col) => (
                  <div key={col.subjectName}>
                    <h4 className="mb-2 text-sm font-bold text-slate-900">{formatSipiSubjectHeader(col.subjectName)}</h4>
                    <ul className="space-y-1">
                      {col.topics.map((topic) => (
                        <li
                          key={`${topic.subjectName}-${topic.topicName}-${topic.rank}`}
                          className="text-xs leading-snug text-slate-700"
                        >
                          {formatSipiTopicLine(topic)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-300 bg-white px-8 py-5 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Same numbers as the PDF — Level 1 / 2 / 3 diagnostics APIs.
          </p>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-base font-bold text-white hover:bg-slate-800"
          >
            <Download className="h-5 w-5" />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  )
}
