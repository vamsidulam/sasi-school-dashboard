/**
 * Split topics/subtopics by SIPI.
 * Higher SIPI = weaker / higher exam impact.
 * Lower SIPI = stronger / already safe.
 */
export function namedSubtopics(items) {
  return (items || []).filter((t) => {
    const name = String(t.subtopicName || '').trim()
    return Boolean(t.subtopicid) && name && name.toLowerCase() !== 'general'
  })
}

export function categorizeBySipi(items, limit = 10) {
  const list = [...(items || [])].filter((t) => t.SIPI != null)
  if (!list.length) return { strong: [], weak: [] }

  const sorted = [...list].sort((a, b) => (a.SIPI || 0) - (b.SIPI || 0))
  if (sorted.length === 1) {
    const only = sorted[0]
    return (only.SIPI || 0) > 0
      ? { strong: [], weak: [only] }
      : { strong: [only], weak: [] }
  }

  const half = Math.max(1, Math.floor(sorted.length / 2))
  const strongCount = Math.min(limit, half)
  const weakCount = Math.min(limit, sorted.length - strongCount)
  return {
    strong: sorted.slice(0, strongCount),
    weak: sorted.slice(sorted.length - weakCount).reverse(),
  }
}
