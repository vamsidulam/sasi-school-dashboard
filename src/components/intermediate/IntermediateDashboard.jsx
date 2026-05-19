import { useEffect, useMemo, useState } from 'react'

import IntermediateHeader from './IntermediateHeader.jsx'
import FilterBar from './FilterBar.jsx'
import Overview from './Overview.jsx'
import GrandCombined from './GrandCombined.jsx'
import Leaderboard from './Leaderboard.jsx'
import TopicMastery from './TopicMastery.jsx'
import DifficultyType from './DifficultyType.jsx'
import TestTrend from './TestTrend.jsx'
import StudentModal from './StudentModal.jsx'

import { pct, shortExam } from './utils.js'

export default function IntermediateDashboard({ datasetUrl = '/offline-dataset.json' }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [stream, setStream] = useState('JSP')
  const [tab, setTab] = useState('overview')
  const [kind, setKind] = useState('GRAND')
  const [subject, setSubject] = useState('ALL')
  const [exam, setExam] = useState('ALL')
  const [scheme, setScheme] = useState({ R: 4, W: -1, L: 0, C: 4 })
  const [sortKey, setSortKey] = useState('total')
  const [sortDir, setSortDir] = useState(-1)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(datasetUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load dataset (${r.status})`)
        return r.json()
      })
      .then((json) => { if (!cancelled) setData(json) })
      .catch((e) => { if (!cancelled) setErr(e.message) })
    return () => { cancelled = true }
  }, [datasetUrl])

  const S = data && data.streams[stream]
  const subjects = S ? S.subjects : []

  useEffect(() => {
    setSubject('ALL')
    setExam('ALL')
  }, [stream, kind])
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
      recs.forEach((r) => {
        if (exam !== 'ALL' && r.exam !== exam) return
        examSet.add(r.exam)
        let score = 0, right = 0, wrong = 0, left = 0, canc = 0, att = 0, maxQ = 0
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
          student: r.student, exam: r.exam, subject: sub, date: r.date, mode: r.mode,
          score, right, wrong, left, canc, att, nQ: maxQ,
          maxMark: maxQ * Math.max(sval('R'), 1), per,
        })
      })
    })
    return { records, exams: [...examSet].sort() }
  }, [S, kind, subject, exam, scheme, subjects])

  const examOptions = useMemo(() => {
    if (!S) return []
    const set = new Set()
    const subjList = subject === 'ALL' ? subjects : [subject]
    subjList.forEach((sub) =>
      ((S.responses[kind] && S.responses[kind][sub]) || []).forEach((r) => set.add(r.exam)),
    )
    return [...set].sort()
  }, [S, kind, subject, subjects])

  const leaderboard = useMemo(() => {
    if (!computed) return []
    const m = {}
    computed.records.forEach((r) => {
      const k = r.student
      if (!m[k]) {
        m[k] = { student: k, score: 0, right: 0, wrong: 0, left: 0, canc: 0, att: 0, nQ: 0, tests: 0, maxMark: 0 }
      }
      const o = m[k]
      o.score += r.score; o.right += r.right; o.wrong += r.wrong; o.left += r.left
      o.canc += r.canc; o.att += r.att; o.nQ += r.nQ; o.tests++
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
        name: shortExam(o.exam),
        full: o.exam,
        avg: +(o.sum / o.n).toFixed(1),
        top: o.top,
        avgPct: +pct(o.sum, o.maxAvail).toFixed(1),
        students: o.n,
      }))
      .sort((a, b) => a.full.localeCompare(b.full))
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
      avg, med,
      top: Math.max(...tot),
      low: Math.min(...tot),
      accuracy: pct(allR, allA),
      attempt: pct(allA, allN),
      tests: computed.exams.length,
    }
  }, [leaderboard, computed])

  function sortBy(k) {
    if (sortKey === k) setSortDir((d) => -d)
    else { setSortKey(k); setSortDir(-1) }
  }
  const sArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '')

  if (err) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="py-20 text-center">
          <div className="mb-1 font-serif text-xl text-gray-800">Unable to load data</div>
          <div className="text-sm text-gray-500">{err}</div>
          <div className="mt-3 text-xs text-gray-400">
            Make sure <span className="font-mono">offline-dataset.json</span> is served from the app's <span className="font-mono">public/</span> folder.
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-500" />
          <div className="font-mono text-xs tracking-[0.2em] text-gray-400">LOADING ANALYTICS DATA…</div>
        </div>
      </div>
    )
  }

  const streams = Object.keys(data.streams)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
      <IntermediateHeader
        streams={streams}
        stream={stream}
        onStreamChange={setStream}
        kind={kind}
        onKindChange={setKind}
        tab={tab}
        onTabChange={setTab}
        studentsCount={summary ? summary.students : 0}
        testsCount={summary ? summary.tests : 0}
      />

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-7">
        <FilterBar
          subject={subject}
          onSubjectChange={setSubject}
          subjects={subjects}
          exam={exam}
          onExamChange={setExam}
          examOptions={examOptions}
          kind={kind}
          scheme={scheme}
          onSchemeChange={setScheme}
        />

        <main className="pb-12 pt-4">
          {!summary && (
            <div className="py-16 text-center">
              <div className="mb-1 font-serif text-xl text-gray-700">No data for this selection</div>
              <div className="text-sm text-gray-500">Try a different stream, subject or test.</div>
            </div>
          )}

          {summary && tab === 'overview' && (
            <Overview
              summary={summary}
              trend={trend}
              analytics={analytics}
              ranked={ranked}
              setModal={setModal}
              kind={kind}
            />
          )}
          {summary && tab === 'grand' && (
            <GrandCombined
              S={S}
              kind={kind}
              scheme={scheme}
              exam={exam}
              setModal={setModal}
            />
          )}
          {summary && tab === 'leaderboard' && (
            <Leaderboard
              ranked={ranked}
              sortBy={sortBy}
              sArrow={sArrow}
              search={search}
              setSearch={setSearch}
              setModal={setModal}
              kind={kind}
            />
          )}
          {summary && tab === 'topics' && <TopicMastery a={analytics} />}
          {summary && tab === 'difficulty' && <DifficultyType a={analytics} />}
          {summary && tab === 'trend' && <TestTrend trend={trend} />}
        </main>

        <div className="pb-6 pt-2 text-center font-mono text-[11px] tracking-[0.12em] text-gray-400">
          SASI EDUCATIONAL INSTITUTES · OMR &amp; QUESTION-PAPER ANALYSIS · {stream} STREAM ·
          MARKING {scheme.R}/{scheme.W}/{scheme.L}/{scheme.C}
        </div>
      </div>

      {modal && (
        <StudentModal
          s={modal}
          computed={computed}
          onClose={() => setModal(null)}
          kind={kind}
        />
      )}
    </div>
  )
}
