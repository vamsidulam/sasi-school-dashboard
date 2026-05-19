// Static lookups used across the dashboard. These are not the source of truth —
// the Firestore `branches` and `programs` collections are. They are here only
// for ordering, color mapping, and as a safe fallback when those collections
// haven't been seeded yet.

export const BRANCH_CODES = ['VZH', 'TNK', 'KKD', 'NLR', 'GNT', 'VJA', 'HYD']

export const PROGRAM_CODES = ['SMC', 'SSP', 'SPH', 'SSN', 'SNC', 'SNP', 'NLT']

export const EXAM_FORMATS = ['DESCRIPTIVE', 'OBJECTIVE']

// Color palette tuned for charts (avoids red/green which we reserve for
// positive/warning metrics). Indexable by branch/program ordinal.
export const CHART_COLORS = [
  '#4F46E5', // brand indigo-600
  '#0EA5E9', // sky-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#14B8A6', // teal-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#84CC16', // lime-500
]

export const SUBJECT_ORDER = ['PHY', 'CHE', 'M1', 'M2', 'BOT', 'ZOO']

export const SUBJECT_LABELS = {
  PHY: 'Physics',
  CHE: 'Chemistry',
  M1: 'Maths I',
  M2: 'Maths II',
  BOT: 'Botany',
  ZOO: 'Zoology',
}

export const PAGE_SIZE = 50

export function colorFor(index) {
  return CHART_COLORS[index % CHART_COLORS.length]
}
