import { useRef, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { generateDashboardPDF } from '../../utils/generateDashboardPDF.js'

import StateClassRanksGrid from './StateClassRanksGrid.jsx'
import BranchCountStrip from './BranchCountStrip.jsx'
import BranchAvgDonut from './BranchAvgDonut.jsx'
import TopperTable from './TopperTable.jsx'
import RangeBucketsTable from './RangeBucketsTable.jsx'
import SubjectRanksGrid from './SubjectRanksGrid.jsx'
import TopStudentsTable from './TopStudentsTable.jsx'
import BranchClassBar from './BranchClassBar.jsx'

export default function PDFPreviewModal({ open, onClose, data, meta }) {
  const contentRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  if (!open) return null

  const {
    kpis, stateSummary, classOverview, branchAvgDesc, branchAvgSkill,
    toppersDesc, toppersSkill, rangeBucketsDesc, rangeBucketsSkill,
    subjectRanks, topStudents,
  } = data

  const { programName, examName, className, hasClassSelected } = meta

  const handleDownload = async () => {
    if (!contentRef.current || downloading) return
    setDownloading(true)
    try {
      const filename = `school-dashboard-${examName}-${className}.pdf`.replace(/\s+/g, '-').toLowerCase()
      await generateDashboardPDF(contentRef.current, {
        filename,
        title: 'SASI School Dashboard',
        subtitle: `Program: ${programName} | Exam: ${examName} | Class: ${className}`,
      })
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="relative my-4 w-full max-w-[900px] rounded-xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF content — rendered in B&W exactly as it will appear in PDF */}
        <div className="bg-gray-100 p-6">
          <div
            ref={contentRef}
            className="pdf-preview-content mx-auto bg-white"
            style={{ maxWidth: '800px', filter: 'grayscale(1)' }}
          >

            {/* PAGE 1: KPIs + State class-wise branch ranks */}
            <div data-pdf-page="1" className="border-b-2 border-dashed border-gray-300 p-6 pb-8">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded border border-gray-400 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase text-gray-600">Students appeared</div>
                  <div className="mt-1 text-xl font-bold text-black">{kpis.totalStudents != null ? kpis.totalStudents.toLocaleString('en-IN') : '—'}</div>
                </div>
                <div className="rounded border border-gray-400 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase text-gray-600">State avg %</div>
                  <div className="mt-1 text-xl font-bold text-black">{(kpis.stateAvg ?? 0).toFixed(2)}%</div>
                </div>
                <div className="rounded border border-gray-400 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase text-gray-600">Top branch</div>
                  <div className="mt-1 text-xl font-bold text-black">{kpis.topBranch?.branch || '—'}</div>
                </div>
                <div className="rounded border border-gray-400 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase text-gray-600">Weakest branch</div>
                  <div className="mt-1 text-xl font-bold text-black">{kpis.weakest?.branch || '—'}</div>
                </div>
              </div>
              {stateSummary.data && (
                <div className="mt-4">
                  <h3 className="mb-2 text-base font-bold text-black">State class-wise branch ranks</h3>
                  <StateClassRanksGrid data={stateSummary.data.standards} />
                </div>
              )}
            </div>

            {hasClassSelected && (
              <>
                {/* PAGE 2 */}
                <div data-pdf-page="2" className="border-b-2 border-dashed border-gray-300 p-6 pb-8">
                  {classOverview.data && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-base font-bold text-black">{className} — Student counts per branch</h3>
                      <BranchCountStrip rows={classOverview.data.studentCounts} />
                    </div>
                  )}
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    {branchAvgDesc.data?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-bold text-black">Overall average of descriptive %</h3>
                        <BranchAvgDonut data={branchAvgDesc.data.map((r) => ({ branch: r.branch, pct: r.avg }))} />
                      </div>
                    )}
                    {branchAvgSkill.data?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-bold text-black">Overall average of skill total</h3>
                        <BranchAvgDonut data={branchAvgSkill.data.map((r) => ({ branch: r.branch, pct: r.avg }))} />
                      </div>
                    )}
                  </div>
                  {rangeBucketsDesc.data?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-black">Student overall % avg — count between range</h3>
                      <RangeBucketsTable rows={rangeBucketsDesc.data} variant="desc" />
                    </div>
                  )}
                </div>

                {/* PAGE 3 */}
                <div data-pdf-page="3" className="border-b-2 border-dashed border-gray-300 p-6 pb-8">
                  {toppersDesc.data?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-bold text-black">Topper in each branch (Descriptive %)</h3>
                      <TopperTable rows={toppersDesc.data} valueLabel="%" />
                    </div>
                  )}
                  {rangeBucketsSkill.data?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-bold text-black">Student overall skill avg — count between range</h3>
                      <RangeBucketsTable rows={rangeBucketsSkill.data} variant="skill" />
                    </div>
                  )}
                  {toppersSkill.data?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-black">Topper in each branch (Skill Total)</h3>
                      <TopperTable rows={toppersSkill.data} valueLabel="Sk Tot" />
                    </div>
                  )}
                </div>

                {/* PAGE 4 */}
                <div data-pdf-page="4" className="border-b-2 border-dashed border-gray-300 p-6 pb-8">
                  {subjectRanks.data && Object.keys(subjectRanks.data).length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-base font-bold text-black">Subject-wise branch ranks</h3>
                      <SubjectRanksGrid subjects={subjectRanks.data} />
                    </div>
                  )}
                  {branchAvgDesc.data?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-black">Branch-wise class %</h3>
                      <BranchClassBar data={branchAvgDesc.data.map((r) => ({ branch: r.branch, pct: r.avg }))} height={200} />
                    </div>
                  )}
                </div>

                {/* PAGE 5 */}
                <div data-pdf-page="5" className="p-6">
                  {topStudents.data?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-base font-bold text-black">Top {topStudents.data.length} students</h3>
                      <TopStudentsTable rows={topStudents.data} valueLabel="PER" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
