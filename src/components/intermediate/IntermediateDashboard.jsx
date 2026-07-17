import { useCallback, useEffect, useMemo, useState } from 'react'

import IntermediateHeader from './IntermediateHeader.jsx'
import Overview from './Overview.jsx'
import BranchAnalysis from './BranchAnalysis.jsx'
import Diagnostics from './Diagnostics.jsx'
import GrandCombined from './GrandCombined.jsx'
import Leaderboard from './Leaderboard.jsx'
import TopicMastery from './TopicMastery.jsx'
import DifficultyType from './DifficultyType.jsx'
import TestTrend from './TestTrend.jsx'
import StudentModal from './StudentModal.jsx'
import StudentModalApi from './StudentModalApi.jsx'

import { pct } from './utils.js'
import { intAnalyticsApi } from '../../lib/intermediateAnalyticsApi.js'
import { useAcademicYear } from '../../contexts/AcademicYearContext.jsx'

export default function IntermediateDashboard({ datasetUrl = '/offline-dataset.json', onBack }) {
  const { selectedYear } = useAcademicYear()

  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [tab, setTab] = useState('overview')
  const [subject, setSubject] = useState('ALL')
  const [scheme, setScheme] = useState({ R: 4, W: -1, L: 0, C: 4 })
  const [sortKey, setSortKey] = useState('total')
  const [sortDir, setSortDir] = useState(-1)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')

  const [headerMeta, setHeaderMeta] = useState(null)
  const [headerErr, setHeaderErr] = useState(null)
  const [loadingHeader, setLoadingHeader] = useState(true)

  const [streamid, setStreamid] = useState('')
  const [yearid, setYearid] = useState('')
  const [examtypeid, setExamtypeid] = useState('')
  const [branchid, setBranchid] = useState('')
  const academicyearid = selectedYear || ''
  const [exam, setExam] = useState('ALL')

  const [overviewCounts, setOverviewCounts] = useState({ students: 0, tests: 0 })

  const analyticsFilters = useMemo(
    () => ({
      streamid: streamid && streamid !== 'ALL' ? streamid : undefined,
      yearid,
      examtypeid: examtypeid && examtypeid !== 'ALL' ? examtypeid : undefined,
      branchid: branchid && branchid !== 'ALL' ? branchid : undefined,
      academicyearid: academicyearid && academicyearid !== 'ALL' ? academicyearid : undefined,
      subject,
      exam,
      schemeR: scheme.R,
      schemeW: scheme.W,
      schemeL: scheme.L,
      schemeC: scheme.C,
    }),
    [streamid, yearid, examtypeid, branchid, academicyearid, subject, exam, scheme],
  )

  const filtersReady = Boolean(streamid && streamid !== 'ALL' && yearid && examtypeid && examtypeid !== 'ALL')

  useEffect(() => {
    let cancelled = false
    setLoadingHeader(true)
    intAnalyticsApi
      .headerFilters({
        streamid: streamid && streamid !== 'ALL' ? streamid : undefined,
        yearid: yearid || undefined,
        branchid: branchid && branchid !== 'ALL' ? branchid : undefined,
        examtypeid: examtypeid && examtypeid !== 'ALL' ? examtypeid : undefined,
        academicyearid: academicyearid && academicyearid !== 'ALL' ? academicyearid : undefined,
      })
      .then((meta) => {
        if (cancelled) return
        setHeaderMeta(meta)
        setHeaderErr(null)
        if ((!streamid || streamid === 'ALL') && meta.streams?.length) {
          setStreamid(meta.streams[0].id)
        }
        if (!yearid && meta.years?.length) {
          setYearid(meta.years[0].id)
        }
        if (!examtypeid && meta.examTypes?.length) {
          const grand = meta.examTypes.find((t) => t.name === 'GRAND')
          setExamtypeid(grand?.id || meta.examTypes[0].id)
        }
      })
      .catch((e) => {
        if (!cancelled) setHeaderErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingHeader(false)
      })
    return () => {
      cancelled = true
    }
  }, [streamid, yearid, branchid, examtypeid, academicyearid])

  useEffect(() => {
    if (!filtersReady) return
    let cancelled = false
    intAnalyticsApi
      .overviewTestAverage(analyticsFilters)
      .then((res) => {
        if (!cancelled) {
          setOverviewCounts({
            students: res.students ?? 0,
            tests: res.exams ?? res.testRecords ?? 0,
          })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [analyticsFilters, filtersReady])

  useEffect(() => {
    let cancelled = false
    fetch(datasetUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load dataset (${r.status})`)
        return r.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [datasetUrl])

  const streamName = useMemo(() => {
    if (!streamid || streamid === 'ALL') return ''
    const ids = streamid.includes(',') ? streamid.split(',') : [streamid]
    const names = ids.map((id) => headerMeta?.streams?.find((x) => x.id === id)?.name).filter(Boolean)
    return names.join(' + ') || ''
  }, [headerMeta, streamid])

  const S = data && streamName ? data.streams[streamName] : null
  const subjects = useMemo(() => {
    if (headerMeta?.subjects?.length) {
      return headerMeta.subjects.map((s) => s.name)
    }
    return S ? S.subjects : []
  }, [headerMeta, S])

  const kind = useMemo(() => {
    const t = headerMeta?.examTypes?.find((x) => x.id === examtypeid)
    return t?.name || 'GRAND'
  }, [headerMeta, examtypeid])

  useEffect(() => {
    setSubject('ALL')
    setExam('ALL')
  }, [streamid, examtypeid])

  useEffect(() => {
    setExam('ALL')
  }, [subject])

  const computed = useMemo(() => {
    if (!S) return null
    const sval = (c) => scheme[c] ?? 0
    const subjList = subject === 'ALL' ? subjects : [subject]
    const records = []
    const examSet = new Set()
    subjList.forEach((sub) => {
      const recs = (S.responses[kind] && S.responses[kind][sub]) || []
      const amap = S.analysis[sub] || {}
      const examSet2 = exam !== 'ALL' && exam.includes(',') ? new Set(exam.split(',')) : null
      recs.forEach((r) => {
        if (exam !== 'ALL') {
          if (examSet2) { if (!examSet2.has(r.exam)) return }
          else if (r.exam !== exam) return
        }
        examSet.add(r.exam)
        let score = 0,
          right = 0,
          wrong = 0,
          left = 0,
          canc = 0,
          att = 0,
          maxQ = 0
        const per = {}
        Object.entries(r.resp).forEach(([q, v]) => {
          maxQ++
          score += sval(v)
          if (v === 'R') right++
          else if (v === 'W') wrong++
          else if (v === 'L') left++
          else if (v === 'C') canc++
          if (v !== 'L') att++
          per[q] = { v, meta: (amap[r.exam] && amap[r.exam][q]) || null }
        })
        records.push({
          student: r.student,
          exam: r.exam,
          subject: sub,
          date: r.date,
          mode: r.mode,
          score,
          right,
          wrong,
          left,
          canc,
          att,
          nQ: maxQ,
          maxMark: maxQ * Math.max(sval('R'), 1),
          per,
        })
      })
    })
    return { records, exams: [...examSet].sort() }
  }, [S, kind, subject, exam, scheme, subjects])

  const leaderboard = useMemo(() => {
    if (!computed) return []
    const m = {}
    computed.records.forEach((r) => {
      const k = r.student
      if (!m[k]) {
        m[k] = {
          student: k,
          score: 0,
          right: 0,
          wrong: 0,
          left: 0,
          canc: 0,
          att: 0,
          nQ: 0,
          tests: 0,
          maxMark: 0,
        }
      }
      const o = m[k]
      o.score += r.score
      o.right += r.right
      o.wrong += r.wrong
      o.left += r.left
      o.canc += r.canc
      o.att += r.att
      o.nQ += r.nQ
      o.tests++
      o.maxMark += r.maxMark
    })
    return Object.values(m).map((o) => ({
      ...o,
      total: o.score,
      accuracy: pct(o.right, o.att),
      acc: pct(o.right, o.nQ),
      pctMark: pct(o.score, o.maxMark),
    }))
  }, [computed])

  const ranked = useMemo(() => {
    let a = [...leaderboard]
    if (search.trim()) a = a.filter((x) => x.student.includes(search.trim()))
    a.sort((x, y) => (x[sortKey] < y[sortKey] ? -1 : x[sortKey] > y[sortKey] ? 1 : 0) * sortDir)
    const byTotal = [...leaderboard].sort((x, y) => y.total - x.total)
    const rankMap = {}
    byTotal.forEach((o, i) => (rankMap[o.student] = i + 1))
    return a.map((o) => ({ ...o, rank: rankMap[o.student] }))
  }, [leaderboard, sortKey, sortDir, search])

  const analytics = useMemo(() => {
    if (!computed) return null
    const acc = (key) => {
      const g = {}
      computed.records.forEach((r) => {
        Object.values(r.per).forEach((p) => {
          if (!p.meta) return
          const label = p.meta[key] || 'Unspecified'
          if (!g[label]) g[label] = { label, R: 0, W: 0, L: 0, C: 0, n: 0 }
          g[label][p.v]++
          g[label].n++
        })
      })
      return Object.values(g)
        .map((o) => ({ ...o, acc: pct(o.R, o.n), attAcc: pct(o.R, o.R + o.W + o.C) }))
        .sort((a, b) => b.n - a.n)
    }
    return { topic: acc('topic'), level: acc('level'), qtype: acc('qtype'), subtopic: acc('subtopic') }
  }, [computed])

  const trend = useMemo(() => {
    if (!computed) return []
    const g = {}
    computed.records.forEach((r) => {
      if (!g[r.exam]) {
        g[r.exam] = { exam: r.exam, sum: 0, n: 0, date: r.date, maxAvail: 0, top: -1e9 }
      }
      g[r.exam].sum += r.score
      g[r.exam].n++
      g[r.exam].maxAvail += r.maxMark
      if (r.score > g[r.exam].top) g[r.exam].top = r.score
    })
    return Object.values(g)
      .map((o) => ({
        name: o.exam,
        full: o.exam,
        avg: +(o.sum / o.n).toFixed(1),
        top: o.top,
        avgPct: +pct(o.sum, o.maxAvail).toFixed(1),
        students: o.n,
        date: o.date || '',
      }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.full.localeCompare(b.full))
  }, [computed])

  const summary = useMemo(() => {
    if (!leaderboard.length || !computed) return null
    const tot = leaderboard.map((o) => o.total)
    const avg = tot.reduce((a, b) => a + b, 0) / tot.length
    const sorted = [...tot].sort((a, b) => a - b)
    const med = sorted[Math.floor(sorted.length / 2)]
    const allR = leaderboard.reduce((a, b) => a + b.right, 0)
    const allN = leaderboard.reduce((a, b) => a + b.nQ, 0)
    const allA = leaderboard.reduce((a, b) => a + b.att, 0)
    return {
      students: leaderboard.length,
      avg,
      med,
      top: Math.max(...tot),
      low: Math.min(...tot),
      accuracy: pct(allR, allA),
      attempt: pct(allA, allN),
      tests: computed.exams.length,
    }
  }, [leaderboard, computed])

  function sortBy(k) {
    if (sortKey === k) setSortDir((d) => -d)
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }
  const sArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '')

  if (headerErr && !headerMeta) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="py-20 text-center">
          <div className="mb-1 font-serif text-xl text-gray-800">Unable to load analytics</div>
          <div className="text-sm text-gray-500">{headerErr}</div>
          <div className="mt-3 text-xs text-gray-400">
            Set <span className="font-mono">VITE_INTERMEDIATE_ANALYTICS_URL</span> in{' '}
            <span className="font-mono">.env</span> to your deployed analytics function URL.
          </div>
        </div>
      </div>
    )
  }

  if (loadingHeader && !headerMeta) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
          <div className="font-mono text-xs tracking-[0.2em] text-gray-400">
            LOADING FILTERS…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard Selection
        </button>
      )}

      {/* Title */}
      {onBack && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-serif text-3xl font-semibold text-gray-900">
              Objective Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Advanced analytics for competitive exam preparation
            </p>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 self-center mr-2">Marking Scheme</span>
            {[['R', 'Right'], ['W', 'Wrong'], ['L', 'Left'], ['C', 'Bonus']].map(([c, n]) => (
              <div key={c} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">{n}</span>
                <span className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-800">{scheme[c]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
        <IntermediateHeader
        streams={headerMeta?.streams || []}
        streamid={streamid}
        onStreamChange={setStreamid}
        examTypes={headerMeta?.examTypes || []}
        examtypeid={examtypeid}
        onExamTypeChange={setExamtypeid}
        years={headerMeta?.years || []}
        yearid={yearid}
        onYearChange={setYearid}
        branches={headerMeta?.branches || []}
        branchid={branchid}
        onBranchChange={setBranchid}
        exams={headerMeta?.exams || []}
        exam={exam}
        onExamChange={setExam}
        tab={tab}
        onTabChange={setTab}
        studentsCount={overviewCounts.students}
        testsCount={overviewCounts.tests}
        loadingFilters={loadingHeader}
      />

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-7">
        <main className="pb-12 pt-4">
          {tab === 'overview' && (
            <Overview
              filters={analyticsFilters}
              setModal={setModal}
              ready={filtersReady}
            />
          )}

          {tab === 'branch' && (
            <BranchAnalysis filters={analyticsFilters} ready={filtersReady} />
          )}

          {tab === 'diagnostics' && (
            <Diagnostics filters={analyticsFilters} ready={filtersReady} />
          )}

          {tab === 'leaderboard' && (
            <Leaderboard
              filters={analyticsFilters}
              ready={filtersReady}
              setModal={setModal}
            />
          )}

          {tab === 'topics' && (
            <TopicMastery filters={analyticsFilters} ready={filtersReady} />
          )}

          {tab === 'difficulty' && (
            <DifficultyType filters={analyticsFilters} ready={filtersReady} />
          )}

          {tab !== 'overview' &&
            tab !== 'leaderboard' &&
            tab !== 'topics' &&
            tab !== 'difficulty' &&
            !data &&
            !err && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
              <div className="text-sm text-gray-500">Loading legacy dataset for this tab…</div>
            </div>
          )}

          {tab !== 'overview' &&
            tab !== 'leaderboard' &&
            tab !== 'topics' &&
            tab !== 'difficulty' &&
            err && (
            <div className="py-16 text-center text-sm text-gray-500">
              Other tabs still use offline data: {err}
            </div>
          )}

          {tab !== 'overview' &&
            tab !== 'leaderboard' &&
            tab !== 'topics' &&
            tab !== 'difficulty' &&
            tab === 'trend' && (
            <TestTrend
              filters={analyticsFilters}
              ready={filtersReady}
              useLegacyData={!filtersReady}
              legacyTrend={trend}
            />
          )}
        </main>

        <div className="pb-6 pt-2 text-center font-mono text-[11px] tracking-[0.12em] text-gray-400">
          SASI EDUCATIONAL INSTITUTES · OMR &amp; QUESTION-PAPER ANALYSIS ·{' '}
          {streamName || '—'} STREAM · MARKING {scheme.R}/{scheme.W}/{scheme.L}/{scheme.C}
        </div>
      </div>

      {modal && (tab === 'overview' || tab === 'leaderboard') && filtersReady && (
        typeof modal === 'string' ? (
          <StudentModalApi
            studentCode={modal}
            filters={analyticsFilters}
            onClose={() => setModal(null)}
          />
        ) : (
          <StudentModalApi
            studentCode={modal.code}
            filters={modal.scope === 'filtered' ? analyticsFilters : {
              ...analyticsFilters,
              exam: undefined,
              subject: undefined,
            }}
            onClose={() => setModal(null)}
          />
        )
      )}
      {modal && tab !== 'overview' && tab !== 'leaderboard' && computed && (
        <StudentModal
          s={modal}
          computed={computed}
          onClose={() => setModal(null)}
          kind={kind}
        />
      )}
      </div>
    </div>
  )
}
