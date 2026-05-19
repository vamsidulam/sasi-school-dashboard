export const fmt = (n) => (n >= 0 ? '' : '−') + Math.abs(n).toFixed(0)

export const pct = (a, b) => (b ? (100 * a) / b : 0)

// Red-and-white heatmap: 0% = white (#FFFFFF), 100% = SASI red (#DA3438).
// Bar length still encodes the value; the redness emphasizes magnitude.
export function heatColor(p) {
  if (p == null) return '#F3F4F6'
  const t = Math.max(0, Math.min(100, p)) / 100
  const lerp = (a, b) => Math.round(a + (b - a) * t)
  const r = lerp(255, 218)
  const g = lerp(255, 52)
  const b = lerp(255, 56)
  return `rgb(${r},${g},${b})`
}

export function shortExam(e) {
  const parts = e.split('/')
  return parts.slice(-2).join('/').replace('JSP/', '').replace('JSN/', '')
}

export const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
}
export const TOOLTIP_LABEL_STYLE = { color: '#6b7280' }
export const AXIS_TICK = { fill: '#9ca3af', fontSize: 11, fontFamily: 'ui-monospace, monospace' }
