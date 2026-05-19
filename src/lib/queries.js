import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

// All Firestore reads for the dashboard live here. Pages must call these
// functions instead of touching `db` directly — that keeps schema knowledge
// in one place and makes it easy to tweak indexing/limits later.
//
// Convention: every function returns a Promise that resolves to plain data
// (objects/arrays). Errors propagate; callers display them via their UI shell.

const docToObj = (snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null)
const snapsToArray = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

// ─── branches ────────────────────────────────────────────────────────────────

export async function fetchBranches() {
  const snap = await getDocs(query(collection(db, 'branches'), orderBy('name')))
  return snapsToArray(snap)
}

export async function fetchBranch(code) {
  return docToObj(await getDoc(doc(db, 'branches', code)))
}

// ─── programs ────────────────────────────────────────────────────────────────

export async function fetchPrograms() {
  const snap = await getDocs(query(collection(db, 'programs'), orderBy('name')))
  return snapsToArray(snap)
}

export async function fetchProgram(code) {
  return docToObj(await getDoc(doc(db, 'programs', code)))
}

// ─── students ────────────────────────────────────────────────────────────────

export async function fetchStudent(code) {
  return docToObj(await getDoc(doc(db, 'students', code)))
}

// ─── exams ───────────────────────────────────────────────────────────────────

// Pull exams with optional filters. We never load more than `pageSize` at a
// time; pagination uses date cursors at the call site. Default newest first.
export async function fetchExams({ programCode, format, fromDate, toDate, pageSize = 50 } = {}) {
  const constraints = []
  if (programCode) constraints.push(where('program', '==', programCode))
  if (format) constraints.push(where('format', '==', format))
  if (fromDate) constraints.push(where('date', '>=', Timestamp.fromDate(fromDate)))
  if (toDate) constraints.push(where('date', '<=', Timestamp.fromDate(toDate)))
  constraints.push(orderBy('date', 'desc'))
  constraints.push(limit(pageSize))
  const snap = await getDocs(query(collection(db, 'exams'), ...constraints))
  return snapsToArray(snap)
}

export async function fetchExam(examId) {
  return docToObj(await getDoc(doc(db, 'exams', examId)))
}

export async function fetchLatestExam() {
  const snap = await getDocs(
    query(collection(db, 'exams'), orderBy('date', 'desc'), limit(1)),
  )
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function fetchRecentExams(n = 5) {
  const snap = await getDocs(
    query(collection(db, 'exams'), orderBy('date', 'desc'), limit(n)),
  )
  return snapsToArray(snap)
}

// ─── dashboard_aggregates (preferred read path) ──────────────────────────────

export async function fetchAggregate(examId) {
  return docToObj(await getDoc(doc(db, 'dashboard_aggregates', examId)))
}

export async function fetchLatestAggregate() {
  const snap = await getDocs(
    query(collection(db, 'dashboard_aggregates'), orderBy('exam_date', 'desc'), limit(1)),
  )
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function fetchRecentAggregates(n = 5) {
  const snap = await getDocs(
    query(collection(db, 'dashboard_aggregates'), orderBy('exam_date', 'desc'), limit(n)),
  )
  return snapsToArray(snap)
}

// ─── exam_results (per-student, only when truly needed) ──────────────────────

export async function fetchResultsForStudent(studentCode) {
  const snap = await getDocs(
    query(
      collection(db, 'exam_results'),
      where('student_code', '==', studentCode),
      orderBy('exam_date', 'desc'),
    ),
  )
  return snapsToArray(snap)
}

export async function fetchTopPerformers({ programCode, branchCode, examId, max = 100 } = {}) {
  const constraints = []
  if (programCode) constraints.push(where('program', '==', programCode))
  if (branchCode) constraints.push(where('branch', '==', branchCode))
  if (examId) constraints.push(where('exam_id', '==', examId))
  constraints.push(where('is_absent', '==', false))
  constraints.push(orderBy('percentage', 'desc'))
  constraints.push(limit(max))
  const snap = await getDocs(query(collection(db, 'exam_results'), ...constraints))
  return snapsToArray(snap)
}

// ─── upload_log ──────────────────────────────────────────────────────────────

export async function fetchRecentUploads(n = 10) {
  const snap = await getDocs(
    query(collection(db, 'upload_log'), orderBy('uploaded_at', 'desc'), limit(n)),
  )
  return snapsToArray(snap)
}

// ─── counts (cheap dashboard KPIs) ───────────────────────────────────────────

export async function fetchTotals() {
  const [studentsSnap, examsSnap] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'exams')),
  ])
  return { totalStudents: studentsSnap.size, totalExams: examsSnap.size }
}
