export const DUMMY_STUDENTS = [
  { student: '2301001', studentName: 'A VENKATA LAKSHMI', branchName: 'Tanuku', totalMarks: 542, percentage: 90.3, exams: 3 },
  { student: '2301002', studentName: 'B SRAVANI', branchName: 'Tanuku', totalMarks: 528, percentage: 88.0, exams: 3 },
  { student: '2301003', studentName: 'K RAJESH', branchName: 'Visakhapatnam', totalMarks: 515, percentage: 85.8, exams: 3 },
  { student: '2301004', studentName: 'M PRIYA DARSHINI', branchName: 'Eluru', totalMarks: 510, percentage: 85.0, exams: 3 },
  { student: '2301005', studentName: 'P NAVEEN KUMAR', branchName: 'Visakhapatnam', totalMarks: 498, percentage: 83.0, exams: 3 },
  { student: '2301006', studentName: 'G SURESH BABU', branchName: 'Tadepalligudem', totalMarks: 492, percentage: 82.0, exams: 3 },
  { student: '2301007', studentName: 'R KEERTHI', branchName: 'Tanuku', totalMarks: 486, percentage: 81.0, exams: 3 },
  { student: '2301008', studentName: 'S DIVYA TEJA', branchName: 'Palakollu', totalMarks: 478, percentage: 79.7, exams: 3 },
  { student: '2301009', studentName: 'T HARSHA VARDHAN', branchName: 'Kamavarapukota', totalMarks: 470, percentage: 78.3, exams: 3 },
  { student: '2301010', studentName: 'D MOUNIKA', branchName: 'Eluru', totalMarks: 465, percentage: 77.5, exams: 3 },
  { student: '2301011', studentName: 'V SRINIVAS', branchName: 'Visakhapatnam', totalMarks: 458, percentage: 76.3, exams: 3 },
  { student: '2301012', studentName: 'N ANUSHA', branchName: 'Tadepalligudem', totalMarks: 450, percentage: 75.0, exams: 3 },
  { student: '2301013', studentName: 'L BHARGAV', branchName: 'Tanuku', totalMarks: 445, percentage: 74.2, exams: 3 },
  { student: '2301014', studentName: 'C SWATHI', branchName: 'Palakollu', totalMarks: 438, percentage: 73.0, exams: 3 },
  { student: '2301015', studentName: 'J RAVI TEJA', branchName: 'Kamavarapukota', totalMarks: 430, percentage: 71.7, exams: 3 },
  { student: '2301016', studentName: 'K PADMA', branchName: 'Eluru', totalMarks: 422, percentage: 70.3, exams: 3 },
  { student: '2301017', studentName: 'H MANIKANTA', branchName: 'Visakhapatnam', totalMarks: 415, percentage: 69.2, exams: 3 },
  { student: '2301018', studentName: 'F LAKSHMI PRASANNA', branchName: 'Tadepalligudem', totalMarks: 408, percentage: 68.0, exams: 3 },
  { student: '2301019', studentName: 'I CHANDRA SEKHAR', branchName: 'Tanuku', totalMarks: 400, percentage: 66.7, exams: 3 },
  { student: '2301020', studentName: 'E JYOTHI', branchName: 'Palakollu', totalMarks: 392, percentage: 65.3, exams: 3 },
]

export const DUMMY_BRANCHES = [
  { branch: 'Tanuku', students: 320, avgPercentage: 72.5, topStudent: 'A VENKATA LAKSHMI', topPct: 90.3 },
  { branch: 'Visakhapatnam', students: 285, avgPercentage: 68.9, topStudent: 'K RAJESH', topPct: 85.8 },
  { branch: 'Eluru', students: 210, avgPercentage: 65.4, topStudent: 'M PRIYA DARSHINI', topPct: 85.0 },
  { branch: 'Tadepalligudem', students: 195, avgPercentage: 63.8, topStudent: 'G SURESH BABU', topPct: 82.0 },
  { branch: 'Palakollu', students: 150, avgPercentage: 61.2, topStudent: 'S DIVYA TEJA', topPct: 79.7 },
  { branch: 'Kamavarapukota', students: 107, avgPercentage: 58.6, topStudent: 'T HARSHA VARDHAN', topPct: 78.3 },
]

export const DUMMY_TREND = [
  { name: 'Unit Test 1', full: 'Unit Test 1', date: '2026-04-10', avg: 62.5, top: 92.0, topperName: 'A VENKATA LAKSHMI', topperCode: '2301001', topperBranch: 'Tanuku', students: 1267 },
  { name: 'Unit Test 2', full: 'Unit Test 2', date: '2026-05-15', avg: 65.8, top: 88.5, topperName: 'B SRAVANI', topperCode: '2301002', topperBranch: 'Tanuku', students: 1250 },
  { name: 'Mid Term', full: 'Mid Term', date: '2026-06-20', avg: 68.2, top: 94.0, topperName: 'A VENKATA LAKSHMI', topperCode: '2301001', topperBranch: 'Tanuku', students: 1260 },
  { name: 'Unit Test 3', full: 'Unit Test 3', date: '2026-07-10', avg: 64.1, top: 90.3, topperName: 'K RAJESH', topperCode: '2301003', topperBranch: 'Visakhapatnam', students: 1245 },
]

export const DUMMY_OVERVIEW = {
  totalStudents: 1267,
  totalExams: 4,
  avgPercentage: 65.2,
  highestAvg: 90.3,
  lowestAvg: 28.4,
  topBranch: 'Tanuku',
  weakestBranch: 'Kamavarapukota',
}

export const DUMMY_SUBJECT_PERFORMANCE = [
  { subject: 'Telugu', avg: 72.4, highest: 98, lowest: 18 },
  { subject: 'Hindi', avg: 68.5, highest: 95, lowest: 22 },
  { subject: 'English', avg: 65.8, highest: 96, lowest: 15 },
  { subject: 'Mathematics', avg: 58.2, highest: 100, lowest: 8 },
  { subject: 'Science', avg: 62.4, highest: 97, lowest: 12 },
  { subject: 'Social', avg: 70.1, highest: 95, lowest: 20 },
]
