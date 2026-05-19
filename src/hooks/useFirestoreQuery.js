import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'

// Subscribe to a Firestore Query reference. Caller is responsible for memoising
// the query so this hook doesn't resubscribe on every render — pass a string
// `key` that uniquely identifies the query for the dependency check.
export function useFirestoreQuery(queryRef, key) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!queryRef) {
      setData([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setError(null)
    const unsub = onSnapshot(
      queryRef,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading, error }
}
