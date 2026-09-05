/**
 * Shared SPARK report model. Modal and PDF both render this — same APIs, same numbers.
 *
 * Sources:
 *   table1          Level 1 subject strength (SPI)
 *   table2          unused in this report (SIPI is the topic list)
 *   table4_detailed Level 2 question-type CMSI
 *   table5_detailed Level 2 difficulty CDAI
 *   table6          Level 3 SIPI matrix
 *   overview        student name / stream / branch
 */

function avg(list, pick) {
  if (!list.length) return 0
  return list.reduce((s, item) => s + pick(item), 0) / list.length
}

function getGrade(score) {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

function calculateTypeOfLearner(avgInd, avgGrand, subjects) {
  const drop = Math.abs(avgInd - avgGrand)
  const valid = subjects.filter(
    (sub) => (sub.individualAccuracy || 0) > 0 || (sub.grandAccuracy || 0) > 0,
  )
  if (!valid.length) return 'Evolving Competitor'

  const avgWrong = avg(valid, (s) => s.wrongPct || 0)
  const avgLeft = avg(valid, (s) => s.leftPct || 0)
  const withIL = valid.filter((s) => s.intelligentLeavingPct != null)
  const avgIL = withIL.length ? avg(withIL, (s) => s.intelligentLeavingPct) : 0

  if (avgGrand > 80 && drop < 5 && avgWrong < 15 && avgIL > 45) return 'Competitive Performer'
  if (avgInd > avgGrand + 10) return 'Practice Champion'
  if (avgGrand >= 70 && drop > 8 && avgWrong > 15) return 'Pressure Sensitive'
  if (avgLeft > 15 && avgWrong < 12 && avgIL > 45) return 'Careful Thinker'
  if (avgWrong > 20 && avgLeft < 8 && avgIL < 30) return 'Aggressive Risk Taker'
  if (avgGrand >= 75 && drop <= 6 && avgIL >= 45) return 'Strategic Learner'
  if (avgGrand < 75 && drop < 8) return 'Developing Performer'
  return 'Evolving Competitor'
}

function ig(individual, grand) {
  const i = individual == null ? '–' : `${Math.round(individual)}%`
  const g = grand == null ? '–' : `${Math.round(grand)}%`
  return `${i} / ${g}`
}

function normalizeQtype(type) {
  return String(type || '').toLowerCase().replace(/[\s-]/g, '')
}

function normalizeLevel(level) {
  const l = String(level || '').toLowerCase()
  if (l === 'moderate' || l === 'medium') return 'medium'
  if (l === 'hard') return 'difficult'
  return l
}

const QTYPE_COLS = [
  ['theoretical', 'Theo'],
  ['conceptual', 'Conc'],
  ['applicative', 'Appl'],
  ['mathematical', 'Math'],
  ['multiconcept', 'Multi'],
]

const LEVEL_COLS = [
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['difficult', 'Difficult'],
]

export function buildSparkReport({
  studentCode,
  data,
  diagnostics,
  aiInsights = null,
  streamName = '',
} = {}) {
  const subjects = diagnostics?.table1?.subjects || []

  const subjectsWithInd = subjects.filter((s) => s.individualAccuracy > 0)
  const subjectsWithGrand = subjects.filter((s) => s.grandAccuracy > 0)
  const avgInd = subjectsWithInd.length ? avg(subjectsWithInd, (s) => s.individualAccuracy) : 0
  const avgGrand = subjectsWithGrand.length ? avg(subjectsWithGrand, (s) => s.grandAccuracy) : 0

  const typeOfLearner =
    aiInsights?.interpretations?.overallNature ||
    calculateTypeOfLearner(avgInd, avgGrand, subjects)

  const sortedBySpi = [...subjects].sort((a, b) => (b.SPI || 0) - (a.SPI || 0))
  const strongestSubject = sortedBySpi[0]?.subjectName || 'N/A'
  const weakestSubject = sortedBySpi[sortedBySpi.length - 1]?.subjectName || 'N/A'

  const validDrop = subjects.filter(
    (s) => (s.individualAccuracy || 0) > 0 || (s.grandAccuracy || 0) > 0,
  )
  const avgDrop = validDrop.length
    ? avg(validDrop, (s) => Math.abs((s.individualAccuracy || 0) - (s.grandAccuracy || 0)))
    : 0

  const competitiveReadiness =
    avgGrand > 85 ? 'Competition Ready'
    : avgGrand >= 75 ? 'Nearly Ready'
    : avgGrand >= 65 ? 'Needs Competitive Practice'
    : 'Needs Significant Improvement'

  const executionConsistency =
    avgDrop <= 3 ? 'Highly Consistent'
    : avgDrop <= 6 ? 'Stable'
    : avgDrop <= 10 ? 'Pressure Sensitive'
    : 'Exam Anxiety / Execution Concern'

  const learningConsistency =
    avgDrop <= 3 ? 'Highly Consistent'
    : avgDrop <= 6 ? 'Consistent'
    : avgDrop <= 10 ? 'Moderate'
    : 'Variable'

  const withLeft = subjects.filter((s) => s.leftPct != null)
  const avgLeft = withLeft.length ? avg(withLeft, (s) => s.leftPct) : 0
  const confidenceLevel =
    avgLeft < 5 ? 'Highly Confident'
    : avgLeft <= 10 ? 'Balanced'
    : avgLeft <= 20 ? 'Cautious'
    : 'Under-confident'

  const withWrong = subjects.filter((s) => s.wrongPct != null)
  const avgWrong = withWrong.length ? avg(withWrong, (s) => s.wrongPct) : 0
  const riskBehaviour =
    avgWrong < 10 ? 'Calculated Risk'
    : avgWrong <= 20 ? 'Healthy Attempting'
    : avgWrong <= 30 ? 'Over Attempting'
    : 'Impulsive Guessing'

  const withIL = subjects.filter((s) => s.intelligentLeavingPct != null)
  const avgIL = withIL.length ? avg(withIL, (s) => s.intelligentLeavingPct) : 0
  const decisionMaking =
    avgIL > 60 ? 'Excellent Decision Maker'
    : avgIL >= 45 ? 'Mature'
    : avgIL >= 30 ? 'Learning Strategy'
    : 'Emotion-driven Attempting'

  const subjectRows = subjects.map((sub) => {
    const drop = Math.abs((sub.individualAccuracy || 0) - (sub.grandAccuracy || 0))
    return {
      subjectName: sub.subjectName,
      ind: `${Math.round(sub.individualAccuracy || 0)}%`,
      grand: `${Math.round(sub.grandAccuracy || 0)}%`,
      drop: `${drop.toFixed(1)}%`,
      wrong: `${Math.round(sub.wrongPct || 0)}%`,
      left: `${Math.round(sub.leftPct || 0)}%`,
      idi: sub.IDI == null ? '–' : `${Math.round(sub.IDI)}%`,
      spi: Math.round(sub.SPI || 0),
      status: sub.spiStatus || '–',
    }
  })

  const cognitiveRows = (diagnostics?.table4_detailed?.subjects || []).map((subj) => {
    const typeMap = {}
    ;(subj.questionTypes || []).forEach((qt) => {
      typeMap[normalizeQtype(qt.type)] = ig(qt.individual, qt.grand)
    })
    const cmsiVal = subj.CMSI == null ? '–' : Math.round(subj.CMSI)
    const maxCmsi = subj.maxCMSI || '–'
    return {
      subjectName: subj.subjectName,
      cells: QTYPE_COLS.map(([key]) => typeMap[key] || '–/–'),
      cmsi: cmsiVal === '–' ? '–' : `${cmsiVal}/${maxCmsi}`,
    }
  })

  const difficultyRows = (diagnostics?.table5_detailed?.subjects || []).map((subj) => {
    const levelMap = {}
    ;(subj.levels || []).forEach((lv) => {
      levelMap[normalizeLevel(lv.level)] = ig(lv.individual, lv.grand)
    })
    const cdaiVal = subj.CDAI == null ? '–' : Math.round(subj.CDAI)
    const maxCdai = subj.maxCDAI || '–'
    return {
      subjectName: subj.subjectName,
      cells: LEVEL_COLS.map(([key]) => levelMap[key] || '–/–'),
      cdai: cdaiVal === '–' ? '–' : `${cdaiVal}/${maxCdai}`,
    }
  })

  const TOPICS_PER_SUBJECT = 5
  const allSipiTopics = diagnostics?.table6?.topics || []
  const bySubject = new Map()
  allSipiTopics.forEach((topic) => {
    const key = topic.subjectName || 'Unknown'
    if (!bySubject.has(key)) bySubject.set(key, [])
    bySubject.get(key).push(topic)
  })
  const subjectOrder = []
  subjects.forEach((s) => {
    if (s.subjectName && bySubject.has(s.subjectName) && !subjectOrder.includes(s.subjectName)) {
      subjectOrder.push(s.subjectName)
    }
  })
  bySubject.forEach((_list, name) => {
    if (!subjectOrder.includes(name)) subjectOrder.push(name)
  })
  const sipiTopics = []
  subjectOrder.forEach((name) => {
    const picked = [...bySubject.get(name)]
      .sort((a, b) => (b.SIPI || 0) - (a.SIPI || 0))
      .slice(0, TOPICS_PER_SUBJECT)
    picked.forEach((topic, idx) => {
      sipiTopics.push({
        rank: idx + 1,
        subjectName: name,
        topicName: topic.topicName,
        cmsi: topic.CMSI == null ? '–' : Math.round(topic.CMSI),
        cdai: topic.CDAI == null ? '–' : Math.round(topic.CDAI),
        ew: topic.EW == null ? '–' : topic.EW,
        sipi: topic.SIPI == null ? 0 : Math.round(topic.SIPI),
      })
    })
  })

  return {
    studentName: data?.studentName || studentCode,
    streamName: data?.streamName || streamName || '–',
    branchName: data?.branchName || '–',
    rollNo: studentCode,
    avgInd: Math.round(avgInd),
    avgGrand: Math.round(avgGrand),
    grade: getGrade(avgGrand),
    typeOfLearner,
    subjectRows,
    indicators: {
      strongestSubject,
      weakestSubject,
      competitiveReadiness,
      executionConsistency,
      confidenceLevel,
      riskBehaviour,
      decisionMaking,
      learningConsistency,
      typeOfLearner,
    },
    cognitiveRows,
    cognitiveHeaders: QTYPE_COLS.map(([, label]) => `${label} (I% / G%)`),
    difficultyRows,
    difficultyHeaders: LEVEL_COLS.map(([, label]) => `${label} (I% / G%)`),
    sipiTopics,
    aiInsights: aiInsights?.insights || null,
  }
}

/** One column per subject, preserving subject order. */
export function groupSipiBySubject(sipiTopics) {
  const cols = []
  const index = new Map()
  for (const t of sipiTopics || []) {
    const name = t.subjectName || 'Unknown'
    if (!index.has(name)) {
      const col = { subjectName: name, topics: [] }
      index.set(name, col)
      cols.push(col)
    }
    index.get(name).topics.push(t)
  }
  return cols
}

export function formatSipiSubjectHeader(name) {
  return `${name}:  CMSI, CDAI, EW, SIPI`
}

export function formatSipiTopicLine(t) {
  return `${t.topicName} (${t.cmsi}, ${t.cdai}, ${t.ew}, ${t.sipi})`
}
