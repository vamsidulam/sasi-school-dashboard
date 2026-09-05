import { useState, useEffect } from 'react'
import { ArrowLeft, Users, BarChart3, Award, AlertTriangle, Loader2, Printer } from 'lucide-react'
import KpiCard from '../KpiCard.jsx'
import EmptyState from '../EmptyState.jsx'

import DashboardFilters from './DashboardFilters.jsx'
import SectionCard from './SectionCard.jsx'
import StateClassRanksGrid from './StateClassRanksGrid.jsx'
import BranchCountStrip from './BranchCountStrip.jsx'
import BranchAvgDonut from './BranchAvgDonut.jsx'
import TopperTable from './TopperTable.jsx'
import RangeBucketsTable from './RangeBucketsTable.jsx'
import SubjectRanksGrid from './SubjectRanksGrid.jsx'
import TopStudentsTable from './TopStudentsTable.jsx'
import BranchClassBar from './BranchClassBar.jsx'
import PDFPreviewModal from './PDFPreviewModal.jsx'

import { programsApi as defaultProgramsApi, examsApi as defaultExamsApi, classStandardsApi as defaultClassStandardsApi, analysisApi as defaultAnalysisApi, fetchAll as defaultFetchAll } from '../../lib/sasiApi.js'

function LoadingBlock({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label || 'Loading…'}
    </div>
  )
}

export default function SchoolDashboard({ onBack, label = 'School', programsApi = defaultProgramsApi, examsApi = defaultExamsApi, classStandardsApi = defaultClassStandardsApi, analysisApi = defaultAnalysisApi, fetchAll = defaultFetchAll, academicYearId }) {
  const [showPdfPreview, setShowPdfPreview] = useState(false)

  // Filter state
  const [programs, setPrograms] = useState([])
  const [exams, setExams] = useState([])
  const [classStandards, setClassStandards] = useState([])
  const [filtersLoading, setFiltersLoading] = useState(true)

  const [programId, setProgramId] = useState('')
  const [examId, setExamId] = useState('')
  const [classStandardId, setClassStandardId] = useState('')

  // Data state — each widget loads independently
  const [stateSummary, setStateSummary] = useState({ data: null, loading: false, error: null })
  const [classOverview, setClassOverview] = useState({ data: null, loading: false, error: null })
  const [branchAvgDesc, setBranchAvgDesc] = useState({ data: null, loading: false, error: null })
  const [branchAvgSkill, setBranchAvgSkill] = useState({ data: null, loading: false, error: null })
  const [toppersDesc, setToppersDesc] = useState({ data: null, loading: false, error: null })
  const [toppersSkill, setToppersSkill] = useState({ data: null, loading: false, error: null })
  const [rangeBucketsDesc, setRangeBucketsDesc] = useState({ data: null, loading: false, error: null })
  const [rangeBucketsSkill, setRangeBucketsSkill] = useState({ data: null, loading: false, error: null })
  const [subjectRanks, setSubjectRanks] = useState({ data: null, loading: false, error: null })
  const [topStudents, setTopStudents] = useState({ data: null, loading: false, error: null })

  // Load filter options
  useEffect(() => {
    setFiltersLoading(true)
    const examsProxy = academicYearId
      ? { list: (params = {}) => examsApi.list({ ...params, academicYearId }) }
      : examsApi
    Promise.all([
      fetchAll(programsApi),
      fetchAll(examsProxy),
      fetchAll(classStandardsApi),
    ]).then(([p, e, cs]) => {
      setPrograms(p)
      setExams(e)
      setClassStandards(cs)
      setExamId('')
      setClassStandardId('')
    }).catch((err) => {
      console.error('Failed to load filter options:', err)
    }).finally(() => setFiltersLoading(false))
  }, [academicYearId])

  // Reset exam/class when program changes
  const handleProgramChange = (id) => {
    setProgramId(id)
    setExamId('')
    setClassStandardId('')
  }

  // When examId changes, fire state-summary (all classes overview)
  useEffect(() => {
    if (!examId) {
      setStateSummary({ data: null, loading: false, error: null })
      return
    }

    setStateSummary({ data: null, loading: true, error: null })
    analysisApi.stateSummary(examId)
      .then((data) => setStateSummary({ data, loading: false, error: null }))
      .catch((err) => setStateSummary({ data: null, loading: false, error: err.message }))
  }, [examId])

  // When examId + classStandardId change, fire all class-level APIs in parallel
  useEffect(() => {
    if (!examId || !classStandardId) {
      setClassOverview({ data: null, loading: false, error: null })
      setBranchAvgDesc({ data: null, loading: false, error: null })
      setBranchAvgSkill({ data: null, loading: false, error: null })
      setToppersDesc({ data: null, loading: false, error: null })
      setToppersSkill({ data: null, loading: false, error: null })
      setRangeBucketsDesc({ data: null, loading: false, error: null })
      setRangeBucketsSkill({ data: null, loading: false, error: null })
      setSubjectRanks({ data: null, loading: false, error: null })
      setTopStudents({ data: null, loading: false, error: null })
      return
    }

    // Fire ALL requests in parallel — each resolves independently
    setClassOverview({ data: null, loading: true, error: null })
    analysisApi.classOverview(examId, classStandardId)
      .then((data) => setClassOverview({ data, loading: false, error: null }))
      .catch((err) => setClassOverview({ data: null, loading: false, error: err.message }))

    setBranchAvgDesc({ data: null, loading: true, error: null })
    analysisApi.branchAverages(examId, classStandardId, 'descriptive')
      .then((res) => setBranchAvgDesc({ data: res.items, loading: false, error: null }))
      .catch((err) => setBranchAvgDesc({ data: null, loading: false, error: err.message }))

    setBranchAvgSkill({ data: null, loading: true, error: null })
    analysisApi.branchAverages(examId, classStandardId, 'skill')
      .then((res) => setBranchAvgSkill({ data: res.items, loading: false, error: null }))
      .catch((err) => setBranchAvgSkill({ data: null, loading: false, error: err.message }))

    setToppersDesc({ data: null, loading: true, error: null })
    analysisApi.branchToppers(examId, classStandardId, 'descriptive')
      .then((res) => setToppersDesc({ data: res.items, loading: false, error: null }))
      .catch((err) => setToppersDesc({ data: null, loading: false, error: err.message }))

    setToppersSkill({ data: null, loading: true, error: null })
    analysisApi.branchToppers(examId, classStandardId, 'skill')
      .then((res) => setToppersSkill({ data: res.items, loading: false, error: null }))
      .catch((err) => setToppersSkill({ data: null, loading: false, error: err.message }))

    setRangeBucketsDesc({ data: null, loading: true, error: null })
    analysisApi.rangeBuckets(examId, classStandardId, 'descriptive')
      .then((res) => setRangeBucketsDesc({ data: res.items, loading: false, error: null }))
      .catch((err) => setRangeBucketsDesc({ data: null, loading: false, error: err.message }))

    setRangeBucketsSkill({ data: null, loading: true, error: null })
    analysisApi.rangeBuckets(examId, classStandardId, 'skill')
      .then((res) => setRangeBucketsSkill({ data: res.items, loading: false, error: null }))
      .catch((err) => setRangeBucketsSkill({ data: null, loading: false, error: err.message }))

    setSubjectRanks({ data: null, loading: true, error: null })
    analysisApi.subjectRanks(examId, classStandardId)
      .then((res) => setSubjectRanks({ data: res.subjects, loading: false, error: null }))
      .catch((err) => setSubjectRanks({ data: null, loading: false, error: err.message }))

    setTopStudents({ data: null, loading: true, error: null })
    analysisApi.topStudents(examId, classStandardId, 'descriptive', 30)
      .then((res) => setTopStudents({ data: res.items, loading: false, error: null }))
      .catch((err) => setTopStudents({ data: null, loading: false, error: err.message }))
  }, [examId, classStandardId])

  // KPI computation from classOverview
  const kpis = classOverview.data
    ? {
        totalStudents: classOverview.data.totalStudents,
        stateAvg: classOverview.data.stateAvgPercentage ?? 0,
        topBranch: branchAvgDesc.data?.[0] || null,
        weakest: branchAvgDesc.data?.[branchAvgDesc.data.length - 1] || null,
      }
    : stateSummary.data
    ? (() => {
        const allBranches = Object.values(stateSummary.data.standards || {}).flat()
        const avg = allBranches.length
          ? allBranches.reduce((s, r) => s + r.avgPct, 0) / allBranches.length
          : 0
        return {
          totalStudents: null,
          stateAvg: avg,
          topBranch: allBranches[0] || null,
          weakest: allBranches[allBranches.length - 1] || null,
        }
      })()
    : { totalStudents: null, stateAvg: 0, topBranch: null, weakest: null }

  const hasClassSelected = !!classStandardId
  const selectedClassName = classStandards.find((cs) => cs.id === classStandardId)?.standardName || ''

  const programName = programs.find((p) => p.id === programId)?.name || ''
  const examName = exams.find((e) => e.id === examId)?.name || 'exam'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard Selection
        </button>
        {examId && (
          <button type="button" onClick={() => setShowPdfPreview(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <Printer className="h-4 w-4" />
            Print PDF
          </button>
        )}
      </div>

      <div className="space-y-6">
      <div className="mb-6">
        <h1 className="mb-2 font-serif text-3xl font-semibold text-gray-900">{label} Dashboard</h1>
        <p className="text-sm text-gray-600">Class-wise performance analysis and branch rankings</p>
      </div>

      <DashboardFilters
        programs={programs}
        exams={exams}
        classStandards={classStandards}
        programId={programId}
        onProgramChange={handleProgramChange}
        examId={examId}
        onExamChange={setExamId}
        classStandardId={classStandardId}
        onClassStandardChange={setClassStandardId}
        loading={filtersLoading}
      />

      {!examId ? (
        <SectionCard title="Select filters">
          <EmptyState title="No exam selected" description="Select a program and exam above to view analytics." />
        </SectionCard>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Students appeared"
              value={kpis.totalStudents != null ? kpis.totalStudents.toLocaleString('en-IN') : '—'}
              subtitle={selectedClassName || 'All classes'}
              icon={Users}
            />
            <KpiCard
              title="State avg %"
              value={`${(kpis.stateAvg ?? 0).toFixed(2)}%`}
              subtitle={classOverview.data?.totalMaxMarks ? `Out of ${classOverview.data.totalMaxMarks} marks` : 'Mean across branches'}
              icon={BarChart3}
            />
            <KpiCard
              title="Top branch"
              value={kpis.topBranch?.branch || '—'}
              subtitle={kpis.topBranch ? `${(kpis.topBranch.avgPct ?? kpis.topBranch.avg ?? 0).toFixed(2)}%` : 'No data'}
              icon={Award}
            />
            <KpiCard
              title="Weakest branch"
              value={kpis.weakest?.branch || '—'}
              subtitle={kpis.weakest ? `${(kpis.weakest.avgPct ?? kpis.weakest.avg ?? 0).toFixed(2)}%` : 'No data'}
              icon={AlertTriangle}
            />
          </div>

          {/* State Summary */}
          <SectionCard
            title="State class-wise branch ranks"
            subtitle="All class standards ranked by mean percentage"
          >
            {stateSummary.loading ? <LoadingBlock label="Loading state summary…" /> :
             stateSummary.error ? <p className="text-sm text-red-600">{stateSummary.error}</p> :
             stateSummary.data ? <StateClassRanksGrid data={stateSummary.data.standards} /> :
             <EmptyState title="No data" description="No exam results found for this exam." />}
          </SectionCard>

          {/* Deep class view - only when class standard selected */}
          {hasClassSelected ? (
            <>
              {/* Student counts */}
              <SectionCard
                title={`${selectedClassName} — Student counts per branch`}
                subtitle="Number of students who appeared"
              >
                {classOverview.loading ? <LoadingBlock /> :
                 classOverview.error ? <p className="text-sm text-red-600">{classOverview.error}</p> :
                 classOverview.data ? <BranchCountStrip rows={classOverview.data.studentCounts} /> :
                 <EmptyState title="No data" />}
              </SectionCard>

              {/* Branch averages */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Overall average of descriptive %" subtitle="Per branch">
                  {branchAvgDesc.loading ? <LoadingBlock /> :
                   branchAvgDesc.error ? <p className="text-sm text-red-600">{branchAvgDesc.error}</p> :
                   branchAvgDesc.data?.length ? <BranchAvgDonut data={branchAvgDesc.data.map((r) => ({ branch: r.branch, pct: r.avg }))} /> :
                   <EmptyState title="No data" />}
                </SectionCard>
                <SectionCard title="Overall average of skill total" subtitle="Per branch">
                  {branchAvgSkill.loading ? <LoadingBlock /> :
                   branchAvgSkill.error ? <EmptyState title="Skill total not applicable" description="No skill scores for this class." /> :
                   branchAvgSkill.data?.length ? <BranchAvgDonut data={branchAvgSkill.data.map((r) => ({ branch: r.branch, pct: r.avg }))} /> :
                   <EmptyState title="Skill total not applicable" description="No skill scores for this class." />}
                </SectionCard>
              </div>

              {/* Toppers & Range Buckets */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Topper in each branch (Descriptive %)">
                  {toppersDesc.loading ? <LoadingBlock /> :
                   toppersDesc.data?.length ? <TopperTable rows={toppersDesc.data} valueLabel="%" /> :
                   <EmptyState title="No data" />}
                </SectionCard>
                <SectionCard title="Student overall % avg — count between range">
                  {rangeBucketsDesc.loading ? <LoadingBlock /> :
                   rangeBucketsDesc.data?.length ? <RangeBucketsTable rows={rangeBucketsDesc.data} variant="desc" /> :
                   <EmptyState title="No data" />}
                </SectionCard>
              </div>

              {/* Skill Toppers & Range */}
              {(toppersSkill.data?.length > 0 || rangeBucketsSkill.data?.length > 0) && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SectionCard title="Topper in each branch (Skill Total)">
                    {toppersSkill.loading ? <LoadingBlock /> :
                     toppersSkill.data?.length ? <TopperTable rows={toppersSkill.data} valueLabel="Sk Tot" /> :
                     <EmptyState title="No data" />}
                  </SectionCard>
                  <SectionCard title="Student overall skill avg — count between range">
                    {rangeBucketsSkill.loading ? <LoadingBlock /> :
                     rangeBucketsSkill.data?.length ? <RangeBucketsTable rows={rangeBucketsSkill.data} variant="skill" /> :
                     <EmptyState title="No data" />}
                  </SectionCard>
                </div>
              )}

              {/* Subject Ranks */}
              <SectionCard title="Subject-wise branch ranks" subtitle="Each subject ranks branches by percentage (or mean score if marks not configured)">
                {subjectRanks.loading ? <LoadingBlock /> :
                 subjectRanks.data && Object.keys(subjectRanks.data).length ? <SubjectRanksGrid subjects={subjectRanks.data} /> :
                 <EmptyState title="No subject data" />}
              </SectionCard>

              {/* Top Students & Branch bar */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <SectionCard title={`Top ${topStudents.data?.length || 30} students`} subtitle="Across all branches, sorted by descriptive %">
                    {topStudents.loading ? <LoadingBlock /> :
                     topStudents.data?.length ? <TopStudentsTable rows={topStudents.data} valueLabel="PER" /> :
                     <EmptyState title="No data" />}
                  </SectionCard>
                </div>
                <div className="lg:col-span-2">
                  <SectionCard title="Branch-wise class %" subtitle="Visual view">
                    {branchAvgDesc.loading ? <LoadingBlock /> :
                     branchAvgDesc.data?.length ? <BranchClassBar data={branchAvgDesc.data.map((r) => ({ branch: r.branch, pct: r.avg }))} /> :
                     <EmptyState title="No data" />}
                  </SectionCard>
                </div>
              </div>
            </>
          ) : (
            <SectionCard title="Class deep view">
              <EmptyState
                title="Select a class standard"
                description="Choose a class standard from the filter above to see detailed analysis."
              />
            </SectionCard>
          )}
        </>
      )}
      </div>

      <PDFPreviewModal
        open={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        data={{
          kpis,
          stateSummary,
          classOverview,
          branchAvgDesc,
          branchAvgSkill,
          toppersDesc,
          toppersSkill,
          rangeBucketsDesc,
          rangeBucketsSkill,
          subjectRanks,
          topStudents,
        }}
        meta={{
          programName,
          examName,
          className: selectedClassName || 'All Classes',
          hasClassSelected,
        }}
      />
    </div>
  )
}
