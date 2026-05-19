import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

// Subscribe to a single document with a real-time listener.
// Returns { data, loading, error }. `data` is `{ id, ...fields }` or null.
export function useFirestoreDoc(path, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!path || !id) {
      setData(null)
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setError(null)
    const unsub = onSnapshot(
      doc(db, path, id),
      (snap) => {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsub
  }, [path, id])

  return { data, loading, error }
}
