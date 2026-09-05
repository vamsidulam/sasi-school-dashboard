import { X, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { generateStudentSparkPDF } from '../../../utils/generateStudentSparkPDF.js'
import { intAnalyticsApi } from '../../../lib/intermediateAnalyticsApi.js'

export default function SparkReportModal({ show, onClose, studentCode, data, diagnostics, streamName, yearName, allFilters }) {
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [showAiInsights, setShowAiInsights] = useState(false)

  if (!show) return null

  const subjects = diagnostics?.table1?.subjects || []
  const avgInd = subjects.reduce((s, sub) => s + (sub.individualAccuracy || 0), 0) / (subjects.length || 1)
  const avgGrand = subjects.reduce((s, sub) => s + (sub.grandAccuracy || 0), 0) / (subjects.length || 1)

  // Calculate average score from exam records
  const avgScore = data?.records?.length > 0
    ? data.records.reduce((sum, r) => sum + (r.score || 0), 0) / data.records.length
    : 0

  // Calculate Type of Learner (Overall Nature) using same logic as backend
  const calculateTypeOfLearner = () => {
    const drop = Math.abs(avgInd - avgGrand)

    // Calculate wrong% and left% from table1
    let totalWrong = 0, totalLeft = 0, totalQ = 0
    subjects.forEach(sub => {
      const q = (sub.rightCount || 0) + (sub.wrongCount || 0) + (sub.leftCount || 0)
      totalWrong += sub.wrongCount || 0
      totalLeft += sub.leftCount || 0
      totalQ += q
    })
    const wrong = totalQ > 0 ? (totalWrong / totalQ) * 100 : 0
    const left = totalQ > 0 ? (totalLeft / totalQ) * 100 : 0

    // Calculate Intelligent Leaving
    const il = subjects.reduce((s, sub) => s + (sub.intelligentLeavingPct || 0), 0) / (subjects.length || 1)

    // Same logic as backend sparkAgent.js
    if (avgGrand > 80 && drop < 5 && wrong < 15 && il > 45) {
      return 'Competitive Performer'
    }
    if (avgInd > avgGrand + 10) {
      return 'Practice Champion - Needs Competitive Exposure'
    }
    if (avgGrand >= 70 && drop > 8 && wrong > 15) {
      return 'Knowledgeable but Loses Control Under Pressure'
    }
    if (left > 15 && wrong < 12 && il > 45) {
      return 'Careful Thinker'
    }
    if (wrong > 20 && left < 8 && il < 35) {
      return 'Aggressive Risk Taker'
    }
    if (avgGrand >= 75 && drop <= 6 && il >= 40) {
      return 'Strategic Learner'
    }
    if (avgGrand < 75 && drop < 8) {
      return 'Developing Performer'
    }
    return 'Evolving Competitor'
  }

  const typeOfLearner = aiInsights?.interpretations?.overallNature || calculateTypeOfLearner()

  const handlePrint = () => {
    generateStudentSparkPDF(studentCode, data, diagnostics)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">SASI SPARK™</h2>
            <p className="text-xs text-gray-500 mt-0.5">Student Performance Analytics On Results & Knowledge</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Details */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">STUDENT DETAILS</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{data?.studentName || studentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Roll No:</span>
                <span className="font-semibold text-gray-900">{studentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Branch:</span>
                <span className="font-semibold text-gray-900">{data?.branchName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stream:</span>
                <span className="font-semibold text-gray-900">{data?.streamName || streamName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="font-semibold text-gray-900">{data?.yearName || yearName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type of Learner:</span>
                <span className="font-semibold text-purple-700">{typeOfLearner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Individual Accuracy:</span>
                <span className="font-semibold text-brand-600">{avgInd.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grand Accuracy:</span>
                <span className="font-semibold text-brand-600">{avgGrand.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Score:</span>
                <span className="font-semibold text-brand-600">{avgScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* AI LEARNING PROFILE */}
          <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
            <button
              onClick={async () => {
                if (aiInsights) {
                  setShowAiInsights(!showAiInsights);
                  return;
                }

                setAiLoading(true);
                setAiError(null);
                try {
                  const result = await intAnalyticsApi.sparkInsights(
                    studentCode,
                    {
                      streamid: allFilters.streamid,
                      yearid: allFilters.yearid,
                      examtypeid: allFilters.examtypeid,
                      branchid: allFilters.branchid,
                      academicyearid: allFilters.academicyearid,
                    }
                  );
                  setAiInsights(result);
                  setShowAiInsights(true);
                } catch (e) {
                  setAiError(e.message);
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-purple-300 bg-white px-4 py-3 text-sm font-bold text-purple-900 shadow-sm transition hover:bg-purple-50 disabled:opacity-50"
            >
              <span className="text-2xl">🧠</span>
              {aiLoading ? 'Generating AI Psychology...' : aiInsights ? (showAiInsights ? 'Hide' : 'Show') + ' AI Learning Profile' : 'Generate AI Learning Profile'}
            </button>

            {showAiInsights && aiInsights && (
              <div className="mt-4 rounded-lg border-2 border-white bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 border-b border-purple-100 pb-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="font-serif text-lg font-bold text-purple-900">AI Learning Profile</h3>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                  {aiInsights.insights}
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-md border border-purple-200 bg-purple-50 p-3 text-xs">
                  <div><span className="font-semibold text-purple-900">Nature:</span> <span className="text-gray-700">{aiInsights.interpretations.overallNature}</span></div>
                  <div><span className="font-semibold text-purple-900">Readiness:</span> <span className="text-gray-700">{aiInsights.interpretations.competitiveReadiness}</span></div>
                  <div><span className="font-semibold text-purple-900">Consistency:</span> <span className="text-gray-700">{aiInsights.interpretations.executionConsistency}</span></div>
                  <div><span className="font-semibold text-purple-900">Decision Making:</span> <span className="text-gray-700">{aiInsights.interpretations.decisionMaking}</span></div>
                  <div><span className="font-semibold text-purple-900">Confidence:</span> <span className="text-gray-700">{aiInsights.interpretations.confidenceLevel}</span></div>
                  <div><span className="font-semibold text-purple-900">Risk:</span> <span className="text-gray-700">{aiInsights.interpretations.riskBehaviour}</span></div>
                </div>
              </div>
            )}

            {aiError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Error: {aiError}
              </div>
            )}
          </div>

          {/* Level 1: Subject Performance */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">LEVEL 1 – WHAT STUDENT KNOWS</h3>
                <p className="text-xs text-gray-600">Subject Performance & Stability Profile</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Ind %</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Grand %</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Drop</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">W%</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">L%</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">IDI</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">HMI</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">IDI</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">SPI</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {subjects.map((subject, idx) => {
                    const drop = (subject.individualAccuracy != null && subject.grandAccuracy != null)
                      ? Math.abs(subject.individualAccuracy - subject.grandAccuracy).toFixed(1)
                      : '-'

                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-semibold text-gray-900">{subject.subjectName}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.individualAccuracy != null ? subject.individualAccuracy.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.grandAccuracy != null ? subject.grandAccuracy.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">{drop}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.wrongPct != null ? subject.wrongPct.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.leftPct != null ? subject.leftPct.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.IDI != null ? Math.round(subject.IDI) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.HMI != null ? subject.HMI.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.IDI != null ? subject.IDI.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                          {subject.SPI != null ? subject.SPI.toFixed(0) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            subject.spiStatus === 'Outstanding' ? 'bg-green-100 text-green-800' :
                            subject.spiStatus === 'Excellent' ? 'bg-blue-100 text-blue-800' :
                            subject.spiStatus === 'Strong' ? 'bg-indigo-100 text-indigo-800' :
                            subject.spiStatus === 'Steady' ? 'bg-gray-100 text-gray-800' :
                            subject.spiStatus === 'Emerging' ? 'bg-yellow-100 text-yellow-800' :
                            subject.spiStatus === 'Needs Support' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {subject.spiStatus}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>


          </div>

          {/* Level 2: Cognitive Processing & Difficulty Adaptability */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">LEVEL 2 – WHY STUDENT IS PERFORMING THIS WAY</h3>
                <p className="text-xs text-gray-600">Cognitive Processing & Difficulty Adaptability Analysis</p>
              </div>
            </div>

            {/* Table 1: Cognitive Processing Profile (Question Type-wise) */}
            {diagnostics?.table4_detailed?.subjects && diagnostics.table4_detailed.subjects.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">TABLE 1 – Cognitive Processing Profile</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Measures cognitive strength by question type. CMSI combines Individual learning (70%) with Grand Test validation (30%).
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-100 border-b border-purple-200">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Question Type</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Individual</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Grand</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase bg-purple-50">CMSI</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {diagnostics.table4_detailed.subjects.flatMap((subject) =>
                        (subject.questionTypes || []).map((qt, idx) => (
                          <tr key={`${subject.subjectName}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2.5 text-gray-900">{subject.subjectName}</td>
                            <td className="px-3 py-2.5 font-semibold text-gray-900 capitalize">{qt.type}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                              {qt.individual != null ? qt.individual.toFixed(1) : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                              {qt.grand != null ? qt.grand.toFixed(1) : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-900 bg-purple-50">
                              {qt.blended != null ? qt.blended.toFixed(1) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Table 2: Difficulty Adaptability Profile */}
            {diagnostics?.table5_detailed?.subjects && diagnostics.table5_detailed.subjects.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">TABLE 2 – Difficulty Adaptability Profile</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Measures adaptability to increasing question difficulty. CDAI combines Individual (70%) with Grand (30%) performance.
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-100 border-b border-purple-200">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Difficulty</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Individual</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Grand</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase bg-purple-50">CDAI</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {diagnostics.table5_detailed.subjects.flatMap((subject) =>
                        (subject.levels || []).map((level, idx) => (
                          <tr key={`${subject.subjectName}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2.5 text-gray-900">{subject.subjectName}</td>
                            <td className="px-3 py-2.5 font-semibold text-gray-900 capitalize">{level.level}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                              {level.individual != null ? level.individual.toFixed(1) : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                              {level.grand != null ? level.grand.toFixed(1) : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-900 bg-purple-50">
                              {level.blended != null ? level.blended.toFixed(1) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Level 3: Strategic Improvement Priority Matrix */}
          {diagnostics?.table6?.topics && diagnostics.table6.topics.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">LEVEL 3 – HOW & WHERE TO IMPROVE</h3>
                  <p className="text-xs text-gray-600">Strategic Improvement Priority Matrix (Action Plan)</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-4">
                SIPI ranks topics by improvement priority using: <strong>SIPI = (WF × CRF × EW) / 100</strong><br/>
                WF (Weakness Factor) = 100 - CMSI | CRF (Complexity Risk Factor) = 100 - CDAI | EW (Exam Weightage) = 1-5
              </p>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-orange-100 border-b border-orange-200">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Topic</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">CMSI</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">CDAI</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">EW</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase bg-orange-50">SIPI</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {diagnostics.table6.topics
                      .sort((a, b) => (b.SIPI || 0) - (a.SIPI || 0))
                      .slice(0, 20)
                      .map((topic, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-900">{topic.subjectName}</td>
                          <td className="px-3 py-2.5 font-semibold text-gray-900">{topic.topicName}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                            {topic.CMSI != null ? topic.CMSI.toFixed(0) : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                            {topic.CDAI != null ? topic.CDAI.toFixed(0) : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-700">
                            {topic.EW != null ? topic.EW : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-orange-900 bg-orange-50">
                            {topic.SIPI != null ? topic.SIPI.toFixed(0) : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                              topic.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                              topic.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                              topic.priority === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {topic.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Showing top 20 priority topics. Higher SIPI = Higher improvement priority.
              </p>
            </div>
          )}
        </div>

        {/* Footer with Print Button */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            This report provides Level 1 analysis. Complete diagnostic insights are available in the PDF.
          </p>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition"
          >
            <Download className="h-4 w-4" />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  )
}
