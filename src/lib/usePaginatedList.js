import { useCallback, useEffect, useState } from 'react'

export function usePaginatedList(api) {
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const loadFirst = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.list()
      setItems(res.items || [])
      setNextCursor(res.nextCursor || null)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [api])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const res = await api.list({ cursor: nextCursor })
      setItems((prev) => [...prev, ...(res.items || [])])
      setNextCursor(res.nextCursor || null)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      setError(err)
    } finally {
      setLoadingMore(false)
    }
  }, [api, nextCursor, loadingMore])

  useEffect(() => {
    loadFirst()
  }, [loadFirst])

  const addItem = (item) => setItems((prev) => [item, ...prev])
  const replaceItem = (id, item) =>
    setItems((prev) => prev.map((p) => (p.id === id ? item : p)))
  const removeItem = (id) =>
    setItems((prev) => prev.filter((p) => p.id !== id))

  return {
    items,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh: loadFirst,
    addItem,
    replaceItem,
    removeItem,
  }
}
