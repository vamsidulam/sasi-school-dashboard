import { useEffect, useMemo, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import SchoolCollegeToggle from '../programs/SchoolCollegeToggle.jsx'
import {
  programsApi as defaultProgramsApi,
  branchesApi as defaultBranchesApi,
  programSectionsApi as defaultProgramSectionsApi,
  academicYearsApi as defaultAcademicYearsApi,
  fetchAll as defaultFetchAll,
} from '../../lib/sasiApi.js'

const emptyForm = () => ({
  name: '',
  academicYearId: '',
  programId: '',
  programQuery: '',
  sectionId: '',
  sectionQuery: '',
  isCollege: true,
  rollNo: '',
  branchId: '',
  branchQuery: '',
  parentName: '',
  parentPhone: '',
})

const inputCls =
  'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

function sectionLabel(s) {
  if (!s) return ''
  return s.sectionAbbreviation
    ? `${s.sectionAbbreviation} — ${s.sectionName || ''}`.trim()
    : s.sectionName || ''
}

export default function StudentFormModal({ open, mode = 'create', initial = null, onClose, onSubmit, programsApiRef, branchesApiRef, programSectionsApiRef, academicYearsApiRef, fetchAllFn }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [programOptions, setProgramOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [academicYearOptions, setAcademicYearOptions] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [programOpen, setProgramOpen] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setOptionsLoading(true)
    const _fetchAll = fetchAllFn || defaultFetchAll
    const _programsApi = programsApiRef || defaultProgramsApi
    const _branchesApi = branchesApiRef || defaultBranchesApi
    const _programSectionsApi = programSectionsApiRef || defaultProgramSectionsApi
    const _academicYearsApi = academicYearsApiRef || defaultAcademicYearsApi
    Promise.all([
      _fetchAll(_programsApi),
      _fetchAll(_branchesApi),
      _fetchAll(_programSectionsApi),
      _fetchAll(_academicYearsApi),
    ])
      .then(([progs, brs, secs, ays]) => {
        if (cancelled) return
        setProgramOptions(progs)
        setBranchOptions(brs)
        setSectionOptions(secs)
        setAcademicYearOptions(ays)
      })
      .catch((err) => {
        if (!cancelled) console.warn('[StudentFormModal] failed to load options:', err.message)
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!initial) {
      setForm(emptyForm())
      setError(null)
      setSubmitting(false)
      return
    }
    const prog =
      programOptions.find((p) => p.id === initial.programId) ||
      programOptions.find((p) => (p.program || p.name) === initial.program)
    const branch =
      branchOptions.find((b) => b.id === initial.branchId) ||
      branchOptions.find((b) => b.name === initial.branch) ||
      branchOptions.find((b) => b.code === initial.branch)
    const section = sectionOptions.find((s) => s.id === initial.sectionId)
    setForm({
      name: initial.name || '',
      academicYearId: initial.academicYearId || '',
      programId: prog?.id || '',
      programQuery: prog?.program || prog?.name || initial.program || '',
      sectionId: section?.id || '',
      sectionQuery: section ? sectionLabel(section) : '',
      isCollege: Boolean(initial.isCollege),
      rollNo: initial.rollNo || '',
      branchId: branch?.id || '',
      branchQuery: branch?.name || initial.branch || '',
      parentName: initial.parentName || '',
      parentPhone: initial.parentPhone || '',
    })
    setError(null)
    setSubmitting(false)
  }, [open, initial, programOptions, branchOptions, sectionOptions])

  const programMatches = useMemo(() => {
    const q = (form.programQuery || '').trim().toLowerCase()
    if (!q) return programOptions.slice(0, 8)
    return programOptions
      .filter((p) => (p.program || p.name || '').toLowerCase().includes(q))
      .slice(0, 8)
  }, [form.programQuery, programOptions])

  const branchMatches = useMemo(() => {
    const q = (form.branchQuery || '').trim().toLowerCase()
    if (!q) return branchOptions.slice(0, 8)
    return branchOptions
      .filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          (b.code || '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [form.branchQuery, branchOptions])

  const sectionMatches = useMemo(() => {
    const q = (form.sectionQuery || '').trim().toLowerCase()
    if (!q) return sectionOptions.slice(0, 8)
    return sectionOptions
      .filter(
        (s) =>
          (s.sectionAbbreviation || '').toLowerCase().includes(q) ||
          (s.sectionName || '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [form.sectionQuery, sectionOptions])

  if (!open) return null

  const handleProgramInput = (val) => {
    const match = programOptions.find(
      (p) => (p.program || p.name || '').toLowerCase() === (val || '').trim().toLowerCase(),
    )
    setForm((f) => ({
      ...f,
      programQuery: val,
      programId: match?.id || '',
    }))
  }

  const selectProgram = (p) => {
    setForm((f) => ({
      ...f,
      programQuery: p.program || p.name,
      programId: p.id,
    }))
    setProgramOpen(false)
  }

  const handleSectionInput = (val) => {
    const match = sectionOptions.find(
      (s) => sectionLabel(s).toLowerCase() === (val || '').trim().toLowerCase(),
    )
    if (match) {
      const linkedProg = programOptions.find((p) => p.id === match.programId)
      setForm((f) => ({
        ...f,
        sectionQuery: val,
        sectionId: match.id,
        programId: linkedProg?.id || match.programId || f.programId,
        programQuery: linkedProg?.program || linkedProg?.name || f.programQuery,
      }))
    } else {
      setForm((f) => ({ ...f, sectionQuery: val, sectionId: '' }))
    }
  }

  const selectSection = (s) => {
    const linkedProg = programOptions.find((p) => p.id === s.programId)
    setForm((f) => ({
      ...f,
      sectionQuery: sectionLabel(s),
      sectionId: s.id,
      programId: linkedProg?.id || s.programId || f.programId,
      programQuery: linkedProg?.program || linkedProg?.name || f.programQuery,
    }))
    setSectionOpen(false)
  }

  const handleBranchInput = (val) => {
    const match = branchOptions.find(
      (b) => (b.name || '').toLowerCase() === (val || '').trim().toLowerCase(),
    )
    setForm((f) => ({
      ...f,
      branchQuery: val,
      branchId: match?.id || '',
    }))
  }

  const selectBranch = (b) => {
    setForm((f) => ({ ...f, branchQuery: b.name, branchId: b.id }))
    setBranchOpen(false)
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.rollNo.trim()) return setError('Roll no is required.')
    if (!form.branchId) return setError('Please select a branch from the list.')
    if (!form.programId) return setError('Please select a program from the list.')
    if (!form.sectionId) return setError('Please select a section from the list.')
    if (!form.parentName.trim()) return setError('Parent name is required.')
    if (!form.parentPhone.trim()) return setError('Parent phone is required.')
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit?.({
        name: form.name.trim(),
        rollNo: form.rollNo.trim(),
        programId: form.programId,
        branchId: form.branchId,
        sectionId: form.sectionId || null,
        isCollege: form.isCollege,
        academicYearId: form.academicYearId || null,
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
      })
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="student-modal-title" className="text-base font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit student' : 'New student'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Medimpudi Teja Sri"
                className={inputCls}
                autoFocus
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Academic Year
              <select
                value={form.academicYearId}
                onChange={(e) => setField('academicYearId', e.target.value)}
                className={inputCls}
              >
                <option value="">— none —</option>
                {academicYearOptions.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.name || ay.id}</option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Section
              <div className="relative">
                <input
                  type="text"
                  value={form.sectionQuery}
                  onChange={(e) => handleSectionInput(e.target.value)}
                  onFocus={() => setSectionOpen(true)}
                  onBlur={() => setTimeout(() => setSectionOpen(false), 100)}
                  placeholder="Type to search sections…"
                  className={`${inputCls} w-full`}
                />
                {sectionOpen && sectionMatches.length > 0 ? (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {optionsLoading ? (
                      <li className="px-2.5 py-1.5 text-xs text-gray-500">Loading…</li>
                    ) : null}
                    {sectionMatches.map((s) => {
                      const linked = programOptions.find((p) => p.id === s.programId)
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              selectSection(s)
                            }}
                            className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
                          >
                            <span className="text-gray-900">{sectionLabel(s)}</span>
                            <span className="text-[11px] text-gray-500">{linked?.program || linked?.name || ''}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
              <span className="text-[11px] font-normal text-gray-500">
                Picking a section auto-fills the linked program.
              </span>
            </div>

            <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Program
              <div className="relative">
                <input
                  type="text"
                  value={form.programQuery}
                  onChange={(e) => handleProgramInput(e.target.value)}
                  onFocus={() => setProgramOpen(true)}
                  onBlur={() => setTimeout(() => setProgramOpen(false), 100)}
                  placeholder="Type to search programs…"
                  className={`${inputCls} w-full`}
                />
                {programOpen && programMatches.length > 0 ? (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {optionsLoading ? (
                      <li className="px-2.5 py-1.5 text-xs text-gray-500">Loading…</li>
                    ) : null}
                    {programMatches.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            selectProgram(p)
                          }}
                          className="flex w-full items-center px-2.5 py-1.5 text-left text-sm text-gray-900 hover:bg-brand-50"
                        >
                          {p.program || p.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Roll no
              <input
                type="text"
                value={form.rollNo}
                onChange={(e) => setField('rollNo', e.target.value)}
                placeholder="e.g. 142203010"
                className={inputCls}
              />
            </label>

            <div className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Branch
              <div className="relative">
                <input
                  type="text"
                  value={form.branchQuery}
                  onChange={(e) => handleBranchInput(e.target.value)}
                  onFocus={() => setBranchOpen(true)}
                  onBlur={() => setTimeout(() => setBranchOpen(false), 100)}
                  placeholder="Type to search branches…"
                  className={`${inputCls} w-full`}
                />
                {branchOpen && branchMatches.length > 0 ? (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {optionsLoading ? (
                      <li className="px-2.5 py-1.5 text-xs text-gray-500">Loading…</li>
                    ) : null}
                    {branchMatches.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            selectBranch(b)
                          }}
                          className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
                        >
                          <span className="text-gray-900">{b.name}</span>
                          <span className="font-mono text-[11px] text-gray-500">{b.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs font-medium text-gray-700 sm:col-span-2">
              Stream
              <SchoolCollegeToggle
                isCollege={form.isCollege}
                onChange={(v) => setField('isCollege', v)}
              />
              <span className="text-[11px] font-normal text-gray-500">
                Off = School, On = College.
              </span>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Parent name
              <input
                type="text"
                value={form.parentName}
                onChange={(e) => setField('parentName', e.target.value)}
                placeholder="e.g. Medimpudi Ravi Kumar"
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Parent phone
              <input
                type="tel"
                value={form.parentPhone}
                onChange={(e) => setField('parentPhone', e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className={inputCls}
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'edit' ? 'Save changes' : 'Create student'}
          </button>
        </footer>
      </form>
    </div>
  )
}
