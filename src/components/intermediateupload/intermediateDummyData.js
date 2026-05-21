export const DUMMY_BRANCHES = [
  { id: 'branch-int', name: 'Intermediate', code: 'INT' },
  { id: 'branch-jee', name: 'JEE Coaching', code: 'JEE' },
]

export const DUMMY_STREAMS = [
  { id: 'stream-mpc', name: 'MPC', branchid: 'branch-int' },
  { id: 'stream-bipc', name: 'BiPC', branchid: 'branch-int' },
  { id: 'stream-cec', name: 'CEC', branchid: 'branch-int' },
]

// Class years (I, II) — now scoped per stream (was branchid, now streamid)
export const DUMMY_YEARS = [
  { id: 'year-mpc-1', yearname: 'I', streamid: 'stream-mpc' },
  { id: 'year-mpc-2', yearname: 'II', streamid: 'stream-mpc' },
  { id: 'year-bipc-1', yearname: 'I', streamid: 'stream-bipc' },
  { id: 'year-bipc-2', yearname: 'II', streamid: 'stream-bipc' },
  { id: 'year-cec-1', yearname: 'I', streamid: 'stream-cec' },
]

// Top-level / global calendar academic years
export const DUMMY_ACADEMIC_YEARS = [
  { id: 'ay-2024-2026', name: '2024-2026' },
  { id: 'ay-2025-2027', name: '2025-2027' },
]

export const DUMMY_EXAMS = [
  {
    id: 'exam-001',
    examname: 'Weekly Test 5',
    branchid: 'branch-int',
    streamid: 'stream-mpc',
    yearid: 'year-mpc-1',
    academicyearid: 'ay-2024-2026',
    examdate: '2026-05-12',
    totalquestions: 60,
    subjects: { maths: 30, physics: 15, chemistry: 15 },
  },
  {
    id: 'exam-002',
    examname: 'Grand Test 3',
    branchid: 'branch-int',
    streamid: 'stream-mpc',
    yearid: 'year-mpc-2',
    academicyearid: 'ay-2024-2026',
    examdate: '2026-05-14',
    totalquestions: 90,
    subjects: { maths: 40, physics: 25, chemistry: 25 },
  },
  {
    id: 'exam-003',
    examname: 'Botany Quiz 2',
    branchid: 'branch-int',
    streamid: 'stream-bipc',
    yearid: 'year-bipc-1',
    academicyearid: 'ay-2024-2026',
    examdate: '2026-05-09',
    totalquestions: 50,
    subjects: { botany: 25, zoology: 25 },
  },
]
