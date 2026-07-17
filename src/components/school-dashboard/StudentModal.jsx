import { useState } from 'react'
import { X, Download, User, TrendingUp, BookOpen } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { AXIS_TICK } from './utils.js'
import { DUMMY_SUBJECT_PERFORMANCE, DUMMY_TREND } from './dummyData.js'

function generateStudentExamData(student) {
  const subjects = DUMMY_SUBJECT_PERFORMANCE
  return DUMMY_TREND.map((exam, i) => {
    const base = student.percentage - 5 + i * 2
    const subjectMarks = subjects.map((s) => ({
      subject: s.subject,
      marks: Math.round(Math.min(100, Math.max(20, base + (Math.random() - 0.4) * 20))),
      maxMarks: 100,
    }))
    const total = subjectMarks.reduce((sum, sm) => sum + sm.marks, 0)
    const max = subjectMarks.reduce((sum, sm) => sum + sm.maxMarks, 0)
    return {
      exam: exam.full,
      date: exam.date,
      subjects: subjectMarks,
      total,
      maxMarks: max,
      percentage: +((total / max) * 100).toFixed(1),
    }
  })
}

export default function StudentModal({ student, onClose }) {
  const [tab, setTab] = useState('overview')

  const examData = generateStudentExamData(student)
  const avgPct = examData.reduce((s, e) => s + e.percentage, 0) / examData.length
  const subjects = DUMMY_SUBJECT_PERFORMANCE

  const subjectAvgs = subjects.map((s) => {
    const marks = examData.map((e) => e.subjects.find((sub) => sub.subject === s.subject)?.marks || 0)
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length
    return { subject: s.subject, avg: +avg.toFixed(1), highest: Math.max(...marks), lowest: Math.min(...marks) }
  })

  const trendData = examData.map((e) => ({
    name: e.exam,
    percentage: e.percentage,
    total: e.total,
  }))

  const handleDownloadPDF = () => {
    alert('PDF generation will be wired with real data. Student: ' + student.student)
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{student.studentName}</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-mono">{student.student}</span>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">{student.branchName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex gap-1">
            {[['overview', 'Overview'], ['exams', 'Exam-wise']].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                  tab === k
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {l}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Avg %</div>
                  <div className="mt-1 text-2xl font-semibold text-brand-600">{avgPct.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total Marks</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{student.totalMarks}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Best Exam</div>
                  <div className="mt-1 text-lg font-semibold text-green-600">{Math.max(...examData.map((e) => e.percentage)).toFixed(1)}%</div>
                  <div className="text-[10px] text-gray-400">{examData.reduce((best, e) => (e.percentage > best.percentage ? e : best)).exam}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Exams</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{student.exams}</div>
                </div>
              </div>

              {/* Performance Trend */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <TrendingUp className="h-3.5 w-3.5" /> Performance Trend
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} />
                    <YAxis tick={AXIS_TICK} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="#DA3438" strokeWidth={2.5} dot={{ r: 4, fill: '#DA3438' }} name="Percentage" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Subject-wise Performance */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <BookOpen className="h-3.5 w-3.5" /> Subject-wise Average
                </h3>
                <div className="space-y-2">
                  {subjectAvgs.map((s) => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <div className="w-24 truncate text-right text-xs text-gray-600">{s.subject}</div>
                      <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
                        <div
                          className="h-full rounded bg-brand-500 transition-all"
                          style={{ width: s.avg + '%' }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                          {s.avg}%
                        </span>
                      </div>
                      <div className="w-20 text-right text-[10px] text-gray-400">
                        H:{s.highest} L:{s.lowest}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'exams' && (
            <div className="space-y-6">
              {/* Exam comparison bar chart */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Subject Marks Per Exam
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={examData} margin={{ top: 6, right: 14, left: -8, bottom: 4 }}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="exam" tick={{ ...AXIS_TICK, fontSize: 10 }} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                    />
                    {subjects.map((s, i) => (
                      <Bar
                        key={s.subject}
                        dataKey={`subjects[${i}].marks`}
                        name={s.subject}
                        fill={['#DA3438', '#7F1A1C', '#F87171', '#FCA5A5', '#3B82F6', '#60A5FA'][i]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Exam-wise detailed table */}
              <div className="overflow-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Exam</th>
                      {subjects.map((s) => (
                        <th key={s.subject} className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {s.subject.slice(0, 4)}
                        </th>
                      ))}
                      <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</th>
                      <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examData.map((e) => (
                      <tr key={e.exam}>
                        <td className="border-b border-gray-100 px-3 py-2.5 font-medium text-gray-900">{e.exam}</td>
                        {e.subjects.map((s) => (
                          <td key={s.subject} className="border-b border-gray-100 px-2 py-2.5 text-center font-mono text-gray-700">
                            {s.marks}
                          </td>
                        ))}
                        <td className="border-b border-gray-100 px-3 py-2.5 text-center font-mono font-semibold text-gray-900">{e.total}/{e.maxMarks}</td>
                        <td className="border-b border-gray-100 px-3 py-2.5 text-center font-mono font-semibold text-brand-600">{e.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
