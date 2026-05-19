import { useMemo, useState } from 'react'
import { Users, BarChart3, Award, AlertTriangle } from 'lucide-react'
import KpiCard from '../components/KpiCard.jsx'
import EmptyState from '../components/EmptyState.jsx'

import DashboardFilters from '../components/dashboard/DashboardFilters.jsx'
import SectionCard from '../components/dashboard/SectionCard.jsx'
import StateClassRanksGrid from '../components/dashboard/StateClassRanksGrid.jsx'
import BranchCountStrip from '../components/dashboard/BranchCountStrip.jsx'
import BranchAvgDonut from '../components/dashboard/BranchAvgDonut.jsx'
import TopperTable from '../components/dashboard/TopperTable.jsx'
import RangeBucketsTable from '../components/dashboard/RangeBucketsTable.jsx'
import SubjectRanksGrid from '../components/dashboard/SubjectRanksGrid.jsx'
import TopStudentsTable from '../components/dashboard/TopStudentsTable.jsx'
import BranchClassBar from '../components/dashboard/BranchClassBar.jsx'

import { CLASS_DATA, STATE_CLASS_RANKS } from '../components/dashboard/dummyData.js'

export default function Dashboard() {
  const [exam, setExam] = useState('HALF YEARLY')
  const [klass, setKlass] = useState('1ST')

  const classData = CLASS_DATA[klass] || null
  const stateRanks = STATE_CLASS_RANKS[klass] || []

  // KPI roll-ups for the selected class.
  const kpis = useMemo(() => {
    if (!classData) {
      // Fallback to whatever the state-level rank list gives us.
      const totalAvg = stateRanks.length
        ? stateRanks.reduce((s, r) => s + r.pct, 0) / stateRanks.length
        : 0
      return {
        totalStudents: null,
        stateAvg: totalAvg,
        topBranch: stateRanks[0] || null,
        weakest: stateRanks[stateRanks.length - 1] || null,
      }
    }
    const total = classData.studentCounts.reduce((s, r) => s + r.count, 0)
    const desc = classData.branchAvgDesc
    const stateAvg = desc.reduce((s, r) => s + r.pct, 0) / desc.length
    return {
      totalStudents: total,
      stateAvg,
      topBranch: desc[0],
      weakest: desc[desc.length - 1],
    }
  }, [classData, stateRanks])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Performance Analysis</h1>
        <p className="text-sm text-gray-500">
          Branch-level descriptive & skill breakdown — modeled after the SASI half-yearly state report.
        </p>
      </div>

      <DashboardFilters
        exam={exam}
        onExamChange={setExam}
        klass={klass}
        onClassChange={setKlass}
      />

      {/* KPI roll-up */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Students appeared"
          value={kpis.totalStudents != null ? kpis.totalStudents.toLocaleString('en-IN') : '—'}
          subtitle={`${klass} · ${exam}`}
          icon={Users}
        />
        <KpiCard
          title="State avg %"
          value={`${kpis.stateAvg.toFixed(2)}%`}
          subtitle="Mean across branches"
          icon={BarChart3}
        />
        <KpiCard
          title="Top branch"
          value={kpis.topBranch?.branch || '—'}
          subtitle={
            kpis.topBranch ? `${(kpis.topBranch.pct ?? 0).toFixed(2)}%` : 'No data'
          }
          icon={Award}
        />
        <KpiCard
          title="Weakest branch"
          value={kpis.weakest?.branch || '—'}
          subtitle={kpis.weakest ? `${(kpis.weakest.pct ?? 0).toFixed(2)}%` : 'No data'}
          icon={AlertTriangle}
        />
      </div>

      {/* PDF page 1 — state-level matrix */}
      <SectionCard
        title="State class-wise branch ranks"
        subtitle={`All classes ranked for ${exam}. Click into a class via the filter for the deep view.`}
      >
        <StateClassRanksGrid />
      </SectionCard>

      {classData ? (
        <>
          <SectionCard
            title={`${classData.label} — count of students (written exam)`}
            subtitle="Per-branch participation"
          >
            <BranchCountStrip rows={classData.studentCounts} />
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard
              title="Overall average of descriptive %"
              subtitle="Per branch · pie/donut view"
            >
              <BranchAvgDonut data={classData.branchAvgDesc} />
            </SectionCard>
            {classData.branchAvgSkill ? (
              <SectionCard title="Overall average of skill total" subtitle="Per branch">
                <BranchAvgDonut data={classData.branchAvgSkill} />
              </SectionCard>
            ) : (
              <SectionCard title="Overall average of skill total" subtitle="Per branch">
                <EmptyState
                  title="Skill total not applicable"
                  description={`${classData.label} did not have a skill-total component this exam.`}
                />
              </SectionCard>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard
              title="Topper in each branch (Descriptive %)"
              subtitle="One row per branch"
            >
              <TopperTable rows={classData.toppersDesc} valueLabel="%" />
            </SectionCard>
            <SectionCard
              title="Student overall % avg — count between range"
              subtitle="Counts of students per percentage bucket"
            >
              <RangeBucketsTable rows={classData.rangeBucketsDesc} variant="desc" />
            </SectionCard>
          </div>

          {classData.toppersSkill ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard title="Topper in each branch (Skill Total)">
                <TopperTable rows={classData.toppersSkill} valueLabel="Sk Tot" />
              </SectionCard>
              <SectionCard
                title="Student overall skill avg — count between range"
                subtitle="Counts of students per skill bucket"
              >
                <RangeBucketsTable rows={classData.rangeBucketsSkill} variant="skill" />
              </SectionCard>
            </div>
          ) : null}

          <SectionCard
            title="Subject-wise branch ranks"
            subtitle="Each subject ranks the branches by mean score"
          >
            <SubjectRanksGrid subjects={classData.subjectRanks} />
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SectionCard
                title={`Top ${classData.topStudents.length} students`}
                subtitle="Across all branches, sorted by descriptive %"
              >
                <TopStudentsTable rows={classData.topStudents} valueLabel="PER" />
              </SectionCard>
            </div>
            <div className="lg:col-span-2">
              <SectionCard
                title="Branch-wise class %"
                subtitle="Same data, visual view"
              >
                <BranchClassBar data={classData.branchClassBar} />
              </SectionCard>
            </div>
          </div>
        </>
      ) : (
        <SectionCard title={`${klass} — deep view`}>
          <EmptyState
            title="Deep view not loaded for this class yet"
            description="The sample currently has rich data for 1ST and 8TH. The page-1 grid above still ranks every class."
          />
        </SectionCard>
      )}
    </div>
  )
}
