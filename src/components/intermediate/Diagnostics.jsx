import { useState, useEffect, useRef } from 'react'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'
import { intStudentsApi } from '../../lib/intermediateApi.js'

// Helper function for heat map color
function dgHeat(p) {
  if (p == null) return '#d9d0c0'
  p = Math.max(0, Math.min(100, p))
  const r = p < 50 ? 218 : Math.round(218 - ((p - 50) / 50) * (218 - 31))
  const g = p < 50 ? Math.round(70 + (p / 50) * 114) : 157
  const b = p < 50 ? Math.round(72 - (p / 50) * 22) : Math.round(50 + ((p - 50) / 50) * 37)
  return `rgb(${r},${g},${b})`
}

// Helper function for priority badge class
function dgPr(p) {
  const map = {
    Critical: 'dg-crit',
    High: 'dg-high',
    'High Priority': 'dg-high',
    Moderate: 'dg-mod',
    Low: 'dg-low',
    Minimal: 'dg-min',
  }
  return map[p] || 'dg-min'
}

// Meter component
function DgMeter({ p }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-2 w-[120px] overflow-hidden rounded-md border border-gray-200 bg-gray-100">
        <div
          className="absolute left-0 top-0 h-full rounded-md"
          style={{ width: `${p ?? 0}%`, background: dgHeat(p) }}
        />
      </div>
      <span className="font-mono text-xs text-gray-800">
        {p == null ? '—' : `${p}%`}
      </span>
    </div>
  )
}

// Combined Index Meter
function DgCI({ ci }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-2 w-[90px] overflow-hidden rounded-md border border-gray-200 bg-gray-100">
        <div
          className="absolute left-0 top-0 h-full rounded-md"
          style={{ width: `${ci}%`, background: dgHeat(ci) }}
        />
      </div>
      <span className="font-mono text-xs font-semibold text-gray-800">{ci}</span>
    </div>
  )
}

// Subject Card for Level 2
function DiagSubjCard({ name, idxLabel, idxVal, rows, interpretation, interpretationColor }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5.5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-serif text-[19px] font-semibold text-gray-900">{name}</span>
        <div className="flex flex-col items-end gap-2">
          <span
            className="rounded-lg px-2.5 py-1 font-mono text-[13px] font-bold text-white"
            style={{ background: dgHeat(idxVal) }}
          >
            {idxLabel} {idxVal}
          </span>
          {interpretation && (
            <span
              className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ background: interpretationColor || '#6B7280' }}
            >
              {interpretation}
            </span>
          )}
        </div>
      </div>
      {rows.map((rw, i) => {
        const o = rw.o
        const gv = o && o.G != null ? o.G : o && o.I != null ? o.I : 0
        return (
          <div key={i} className="my-2.5 flex items-center gap-3">
            <span className="w-[70px] flex-shrink-0 font-mono text-[11px] uppercase text-gray-600">
              {rw.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-md">
              <div
                className="h-full rounded-md"
                style={{ width: `${gv}%`, background: dgHeat(gv) }}
              />
            </div>
            <span className="w-[78px] flex-shrink-0 text-right font-mono text-xs font-semibold text-gray-900">
              {o ? `${o.I == null ? '–' : o.I} / ${o.G == null ? '–' : o.G}` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Pagination Component
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5.5 py-3">
      <div className="text-xs text-gray-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`rounded-md border px-3 py-1 text-xs font-medium ${
              currentPage === page
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// Generate insights for Level 1
function generateLevel1Insights(table1Data, table2Data) {
  const insights = []

  // Table 2 insights: Combined Index performance (subtopics)
  if (table2Data && table2Data.length > 0) {
    const avgCI = table2Data.reduce((sum, st) => sum + (st.combinedIndex || 0), 0) / table2Data.length
    const strongSubtopics = table2Data.filter(st => (st.combinedIndex || 0) >= 80)
    const weakSubtopics = table2Data.filter(st => (st.combinedIndex || 0) < 60)

    if (avgCI >= 70) {
      insights.push(`Strong performance across subtopics (${avgCI.toFixed(1)} avg combined index)`)
    } else if (avgCI >= 50) {
      insights.push(`Moderate overall performance (${avgCI.toFixed(1)} avg combined index)`)
    } else {
      insights.push(`Needs significant improvement (${avgCI.toFixed(1)} avg combined index)`)
    }

    if (strongSubtopics.length > 0) {
      insights.push(`${strongSubtopics.length} subtopic(s) showing strong command (80+ index)`)
    }

    if (weakSubtopics.length > 0) {
      const weakest = weakSubtopics[0] // Already sorted by weakest first
      insights.push(`Weakest: ${weakest.subjectName} - ${weakest.topicName} with "${weakest.interpretation}" (${weakest.combinedIndex})`)
    }
  }

  // Table 1 insights: Execution drop and leaving behavior
  if (table1Data && table1Data.length > 0) {
    const highDrop = table1Data.filter(s => (s.executionDrop || 0) > 10)
    const overattemptSubjects = table1Data.filter(s =>
      s.ilInterpretation && s.ilInterpretation.includes('Overattempting')
    )

    if (highDrop.length > 0) {
      insights.push(`High execution drop in ${highDrop.length} subject(s) - performs better under pressure in grand tests`)
    }

    if (overattemptSubjects.length > 0) {
      insights.push(`Overattempting behavior detected in ${overattemptSubjects.length} subject(s) - needs strategic leaving practice`)
    }
  }

  return insights
}

// Level 1 Component
function DiagLevel1({ data, table2Page, setTable2Page, itemsPerPage, insights }) {
  const table2Start = (table2Page - 1) * itemsPerPage
  const table2End = table2Start + itemsPerPage
  const table2Paginated = data.table2.slice(table2Start, table2End)

  return (
    <div className="fade">
      <div className="mb-6">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[2px] text-brand-600">
          Level 1 · Diagnosis
        </div>
        <h2 className="mb-1.5 font-serif text-[30px] font-semibold text-gray-900">
          What the student actually knows
        </h2>
        <p className="max-w-[760px] text-sm leading-relaxed text-gray-600">
          Subject-level strength and stability, then a subtopic-by-subtopic diagnostic to locate
          exact conceptual leakage. Individual vs Grand accuracy exposes how knowledge holds up
          under full-exam pressure.
        </p>
      </div>

      {/* Insights Section */}
      {insights && insights.length > 0 && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-blue-900">Key Insights</span>
          </div>
          <ul className="space-y-1.5 text-sm text-blue-800">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table 1 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-200 px-5.5 py-4.5">
          <span className="mt-0.5 rounded-md bg-brand-600 px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white">
            TABLE 1
          </span>
          <div>
            <div className="font-serif text-[19px] font-semibold leading-tight text-gray-900">
              Subject Strength & Stability Profile
            </div>
            <div className="mt-0.5 text-xs font-medium text-gray-600">
              Overall academic balance and where exam pressure breaks performance
            </div>
          </div>
        </div>
        <div className="max-h-none overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Individual %</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Grand %</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Execution Drop</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Wrong %</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Left %</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Intelligent Leaving</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Behaviour</th>
              </tr>
            </thead>
            <tbody>
              {data.table1.map((r) => (
                <tr key={r.subject} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{r.subject}</td>
                  <td className="px-4 py-3">
                    <DgMeter p={r.indAcc} />
                  </td>
                  <td className="px-4 py-3">
                    <DgMeter p={r.grandAcc} />
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-800">
                    {r.drop == null
                      ? '—'
                      : r.drop > 0
                        ? `−${r.drop} pts`
                        : `+${Math.abs(r.drop)} pts`}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-800">{r.wrong}%</td>
                  <td className="px-4 py-3 font-mono text-gray-800">{r.left}%</td>
                  <td className="px-4 py-3 font-mono text-gray-800">
                    {r.il == null ? '—' : `${r.il}%`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ background: r.ilColor || '#6B7280' }}
                    >
                      {r.ilMeaning}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2.5 border-t border-gray-200 bg-gray-50 px-5.5 py-4">
          {[
            ['0–10%', 'Overattempting / gambling'],
            ['10–30%', 'Aggressive but manageable'],
            ['30–55%', 'Healthy NEET maturity'],
            ['55–75%', 'Conservative / fear'],
            ['75%+', 'Avoidance behaviour'],
          ].map(([range, meaning]) => (
            <div
              key={range}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-gray-600"
            >
              <b className="font-mono text-[11px] text-gray-900">{range}</b> {meaning}
            </div>
          ))}
        </div>
      </div>

      {/* Table 2 */}
      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-200 px-5.5 py-4.5">
          <span className="mt-0.5 rounded-md bg-brand-600 px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white">
            TABLE 2
          </span>
          <div>
            <div className="font-serif text-[19px] font-semibold leading-tight text-gray-900">
              Subtopic Diagnostic — IASS/GASS/Combined Index
            </div>
            <div className="mt-0.5 text-xs font-medium text-gray-600">
              Weakest subtopics by Combined Index = (IASS × 0.7) + (GASS × 0.3)
            </div>
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Topic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Subtopic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">IASS</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">GASS</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Combined Index</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {table2Paginated.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {r.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">{r.topic}</td>
                  <td className="px-4 py-3 text-gray-900">{r.subtopic}</td>
                  <td className="px-4 py-3 font-mono text-gray-800">
                    {r.iass == null ? '—' : r.iass}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-800">
                    {r.gass == null ? '—' : r.gass}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-2 w-[90px] overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        <div
                          className="absolute left-0 top-0 h-full rounded-md"
                          style={{ width: `${r.combinedIndex || 0}%`, background: dgHeat(r.combinedIndex) }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-gray-800">
                        {r.combinedIndex != null ? r.combinedIndex : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ background: r.interpretationColor || '#6B7280' }}
                    >
                      {r.interpretation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={table2Page}
          totalItems={data.table2.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setTable2Page}
        />
      </div>
    </div>
  )
}

// Level 2 Component
function DiagLevel2({ data }) {
  const QT = ['Theoretical', 'Conceptual', 'Applicative', 'Mathematical', 'Multi Concept']
  const LV = ['Easy', 'Moderate', 'Difficult', 'Hard']

  const c3 = data.table3.map((r) =>
    DiagSubjCard({
      name: r.subject,
      idxLabel: 'CMSI',
      idxVal: r.cmsi,
      rows: QT.map((q) => ({ label: q.slice(0, 5), o: r.types[q] })),
      interpretation: r.interpretation,
      interpretationColor: r.interpretationColor,
    }),
  )

  const c4 = data.table4.map((r) =>
    DiagSubjCard({
      name: r.subject,
      idxLabel: 'CDAI',
      idxVal: r.cdai,
      rows: LV.map((l) => ({ label: l.slice(0, 4), o: r.levels[l] })),
      interpretation: r.interpretation,
      interpretationColor: r.interpretationColor,
    }),
  )

  return (
    <div className="fade">
      <div className="mb-6">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[2px] text-brand-600">
          Level 2 · Cognition
        </div>
        <h2 className="mb-1.5 font-serif text-[30px] font-semibold text-gray-900">
          Why the student is lagging
        </h2>
        <p className="max-w-[760px] text-sm leading-relaxed text-gray-600">
          Moves past scores into thinking patterns. Question-type accuracy reveals HOW the student
          processes problems; difficulty adaptability reveals pressure maturity. CMSI and CDAI
          condense each into a single stability index.
        </p>
      </div>

      <div className="mb-6 text-sm font-medium text-gray-700">
        TABLE 3 — Subject × Question Type · Cognitive Processing (bars = Grand, values =
        Individual / Grand)
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{c3}</div>

      <div className="mb-6 text-sm font-medium text-gray-700">
        TABLE 4 — Subject × Difficulty · Adaptability Profile (difficulty-weighted 1·2·3·4)
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">{c4}</div>
    </div>
  )
}

// Level 3 Component
function DiagLevel3({ data, table5Page, setTable5Page, itemsPerPage }) {
  const counts = { Critical: 0, High: 0, Moderate: 0, Low: 0, Minimal: 0 }
  data.table5.forEach((r) => {
    counts[r.priority] = (counts[r.priority] || 0) + 1
  })

  const table5Start = (table5Page - 1) * itemsPerPage
  const table5End = table5Start + itemsPerPage
  const table5Paginated = data.table5.slice(table5Start, table5End)

  const kp = [
    ['Critical', 'dg-crit'],
    ['High', 'dg-high'],
    ['Moderate', 'dg-mod'],
    ['Low', 'dg-low'],
  ].map(([priority, className]) => (
    <div
      key={priority}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-4.5 text-center shadow-sm"
    >
      <span className={`dg-badge ${className}`}>{priority}</span>
      <div className="font-serif text-[38px] font-semibold leading-none text-gray-900">
        {String(counts[priority] || 0)}
      </div>
      <div className="text-xs font-medium text-gray-600">priority areas</div>
    </div>
  ))

  return (
    <div className="fade">
      <div className="mb-6">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[2px] text-brand-600">
          Level 3 · Action
        </div>
        <h2 className="mb-1.5 font-serif text-[30px] font-semibold text-gray-900">
          Where to intervene first
        </h2>
        <p className="max-w-[760px] text-sm leading-relaxed text-gray-600">
          Combines weakness (100 − CMSI), complexity risk (100 − CDAI) and exam yield (EW) into one
          Strategic Impact Priority Index. Fix the top of this list and the score moves the most,
          the fastest.
        </p>
      </div>

      <div className="mb-5.5 grid grid-cols-2 gap-4 md:grid-cols-4">{kp}</div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-200 px-5.5 py-4.5">
          <span className="mt-0.5 rounded-md bg-brand-600 px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white">
            TABLE 5
          </span>
          <div>
            <div className="font-serif text-[19px] font-semibold leading-tight text-gray-900">
              Strategic Impact Priority Matrix
            </div>
            <div className="mt-0.5 text-xs font-medium text-gray-600">
              SIPI = (100 − CMSI) × (100 − CDAI) × Exam Weight ÷ 100 · ranked highest-impact first
            </div>
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Topic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Subtopic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">CMSI</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">CDAI</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Exam Wt</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">SIPI</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
              </tr>
            </thead>
            <tbody>
              {table5Paginated.map((r, i) => {
                const actualIndex = table5Start + i
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{actualIndex + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                        {r.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{r.topic}</td>
                    <td className="px-4 py-3 text-gray-900">{r.subtopic}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold text-white"
                        style={{ background: dgHeat(r.cmsi) }}
                      >
                        {r.cmsi ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold text-white"
                        style={{ background: dgHeat(r.cdai) }}
                      >
                        {r.cdai ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-800">
                      {'★'.repeat(Math.min(r.ew || 0, 5)) + '☆'.repeat(Math.max(5 - (r.ew || 0), 0))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-1 font-mono text-[15px] font-bold text-white"
                        style={{ background: r.priorityColor || '#1f2937' }}
                      >
                        {r.sipi ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ background: r.priorityColor || '#6B7280' }}
                      >
                        {r.priority}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={table5Page}
          totalItems={data.table5.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setTable5Page}
        />
      </div>
    </div>
  )
}

// Main Diagnostics Component
export default function Diagnostics({ filters, ready }) {
  const [lvl, setLvl] = useState(1)
  const [studentCode, setStudentCode] = useState('')
  const [studentInput, setStudentInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const searchRef = useRef(null)

  // Pagination states
  const [table2Page, setTable2Page] = useState(1)
  const [table5Page, setTable5Page] = useState(1)
  const itemsPerPage = 10

  const [data, setData] = useState({
    table1: [],
    table2: [],
    table3: [],
    table4: [],
    table5: [],
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  // Reset pagination when student changes
  useEffect(() => {
    setTable2Page(1)
    setTable5Page(1)
  }, [studentCode])

  // Fetch diagnostic data when student changes
  useEffect(() => {
    if (!ready || !filters?.streamid || !studentCode) {
      setData({
        table1: [],
        table2: [],
        table3: [],
        table4: [],
        table5: [],
      })
      return
    }

    let cancelled = false
    setLoading(true)
    setErr(null)

    // Diagnostics only need streamid - no yearid, examtypeid, subject filters
    const diagnosticFilters = { streamid: filters.streamid }

    Promise.all([
      intAnalyticsApi.diagnosticsLevel1Table1(studentCode, diagnosticFilters),
      intAnalyticsApi.diagnosticsLevel1Table2(studentCode, diagnosticFilters),
      intAnalyticsApi.diagnosticsSubjectByQtype(studentCode, diagnosticFilters),
      intAnalyticsApi.diagnosticsSubjectByDifficulty(studentCode, diagnosticFilters),
    ])
      .then(([level1Table1Res, level1Table2Res, table3Res, table4Res]) => {
        if (cancelled) return

        // Table 1: Subject Strength (from Level 1 Table 1) - Transform API response to UI format
        const table1Items = (level1Table1Res.subjects || []).map(s => ({
          subject: s.subjectName,
          indAcc: s.individualAccuracy,
          grandAcc: s.grandAccuracy,
          drop: s.executionDrop,
          wrong: s.wrongPct ? parseFloat(s.wrongPct.toFixed(1)) : 0,
          left: s.leftPct ? parseFloat(s.leftPct.toFixed(1)) : 0,
          il: s.intelligentLeavingPct,
          ilMeaning: s.ilInterpretation || 'No data',
          ilColor: s.ilInterpretationColor || '#6B7280',
        }))

        // Table 2: IASS/GASS (from Level 1 Table 2 - Subtopics) - Transform API response to UI format
        const table2Items = (level1Table2Res.subtopics || []).map(st => ({
          subject: st.subjectName,
          topic: st.topicName || 'Unspecified',
          subtopic: st.subtopicName || 'General',
          iass: st.IASS,
          gass: st.GASS,
          combinedIndex: st.combinedIndex,
          interpretation: st.interpretation || 'No data',
          interpretationColor: st.interpretationColor || '#6B7280',
        }))

        // Generate insights from Level 1 data
        const insights = generateLevel1Insights(level1Table1Res.subjects, level1Table2Res.subtopics)

        // Table 5: SIPI Priority Matrix - not needed for now as we removed subtopic diagnostic
        const table5 = []

        // Table 3: Question Type Analysis - Transform API response to UI format
        const table3Items = (table3Res.subjects || []).map(s => {
          // Transform questionTypes from backend format to UI format
          // Backend: { theoretical: {individual: 75, grand: 70}, "multi concept": {...}, ... }
          // UI needs: { Theoretical: {I: 75, G: 70}, "Multi Concept": {...}, ... }
          const types = {};
          if (s.questionTypes) {
            Object.entries(s.questionTypes).forEach(([key, value]) => {
              // Capitalize each word: "multi concept" -> "Multi Concept"
              const capitalizedKey = key
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              types[capitalizedKey] = {
                I: value.individual,
                G: value.grand,
              };
            });
          }
          return {
            subject: s.subjectName,
            cmsi: s.CMSI,
            types,
            interpretation: s.interpretation,
            interpretationColor: s.interpretationColor,
          };
        })

        // Table 4: Difficulty Analysis - Transform API response to UI format
        const table4Items = (table4Res.subjects || []).map(s => {
          // Transform difficulties from backend format to UI format
          // Backend: { easy: {individual: 80, grand: 75}, difficult: {...}, ... }
          // UI needs: { Easy: {I: 80, G: 75}, Difficult: {...}, ... }
          const levels = {};
          if (s.difficulties) {
            Object.entries(s.difficulties).forEach(([key, value]) => {
              // Capitalize first letter: "easy" -> "Easy", "difficult" -> "Difficult"
              const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
              levels[capitalizedKey] = {
                I: value.individual,
                G: value.grand,
              };
            });
          }
          return {
            subject: s.subjectName,
            cdai: s.CDAI,
            levels,
            interpretation: s.interpretation,
            interpretationColor: s.interpretationColor,
          };
        })

        setData({
          table1: table1Items,
          table2: table2Items,
          table3: table3Items,
          table4: table4Items,
          table5: table5,
        })
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
  }, [filters, ready, studentCode])

  const LEVELS = [
    { n: 1, t: 'WHAT the student knows', s: 'Subject strength & subtopic mastery' },
    {
      n: 2,
      t: 'WHY the student is lagging',
      s: 'Cognitive processing & difficulty handling',
    },
    { n: 3, t: 'HOW & WHERE to improve', s: 'Weighted impact priority' },
  ]

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Select stream, year, and exam type to load diagnostics.
      </div>
    )
  }

  const handleStudentSearch = async (e) => {
    e.preventDefault()
    const query = studentInput.trim()
    if (!query) return

    setSearchLoading(true)
    setShowResults(true)
    try {
      const res = await intStudentsApi.list({ search: query })
      setSearchResults(res.items || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setStudentCode(student.code)
    setShowResults(false)
    setStudentInput(student.code)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div>
      {/* Student Selector */}
      <div className="mb-6 min-h-[220px] rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm" ref={searchRef}>
        <form onSubmit={handleStudentSearch} className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Student:</label>
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              placeholder="Search by name or code (e.g., hari or 172309072)"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            {showResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {searchLoading ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">No students found</div>
                ) : (
                  searchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {s.name || '—'}
                          <span className="ml-2 font-mono text-xs text-gray-500">{s.code}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {[s.branchName, s.streamName].filter(Boolean).join(' · ') || 'No branch info'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!studentInput.trim()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </form>
        {studentCode && selectedStudent && (
          <div className="mt-2 text-xs text-gray-600">
            Showing diagnostics for: <span className="font-semibold text-brand-600">{selectedStudent.name || selectedStudent.code}</span>
            <span className="ml-1 font-mono text-gray-500">({selectedStudent.code})</span>
            {selectedStudent.branchName && <span className="ml-2 text-gray-400">· {selectedStudent.branchName}</span>}
          </div>
        )}
        {studentCode && !selectedStudent && (
          <div className="mt-2 text-xs text-gray-600">
            Showing diagnostics for: <span className="font-mono font-semibold text-brand-600">{studentCode}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
          <div className="font-mono text-xs tracking-[0.2em] text-gray-400">
            LOADING DIAGNOSTICS...
          </div>
        </div>
      )}

      {/* Error State */}
      {err && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {err}
        </div>
      )}

      {/* No Data State */}
      {!loading && !err && studentCode && data.table1.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 text-4xl">📊</div>
          <div className="text-sm text-gray-600">No data available</div>
        </div>
      )}

      {/* Level Navigation */}
      {!loading && !err && studentCode && data.table1.length > 0 && (
      <>
        <div className="mb-6 flex gap-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {LEVELS.map((L) => (
            <div
              key={L.n}
              className={`relative flex flex-1 cursor-pointer items-center gap-3.5 border-b-[3px] px-5.5 py-4.5 transition ${
                lvl === L.n
                  ? 'border-b-brand-600 bg-gradient-to-b from-red-50 to-transparent'
                  : 'border-b-transparent hover:bg-gray-100'
              } ${L.n !== 3 ? "after:absolute after:right-0 after:top-[22%] after:h-[56%] after:w-px after:bg-gray-200 after:content-['']" : ''}`}
              onClick={() => setLvl(L.n)}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 font-serif text-base font-bold transition ${
                  lvl === L.n
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {String(L.n)}
              </div>
              <div className="flex flex-col leading-tight">
                <b
                  className={`text-[13px] font-bold ${lvl === L.n ? 'text-brand-700' : 'text-gray-900'}`}
                >
                  Level {L.n} — {L.t}
                </b>
                <span className="text-[11px] font-medium text-gray-600">{L.s}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Level Content */}
        <div className="mt-6">
          {lvl === 1 && (
            <DiagLevel1
              data={data}
              table2Page={table2Page}
              setTable2Page={setTable2Page}
              itemsPerPage={itemsPerPage}
            />
          )}
          {lvl === 2 && <DiagLevel2 data={data} />}
          {lvl === 3 && (
            <DiagLevel3
              data={data}
              table5Page={table5Page}
              setTable5Page={setTable5Page}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </>
      )}
    </div>
  )
}
