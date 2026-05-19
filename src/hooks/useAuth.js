import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signInWithEmail = useCallback(
    (email, password) => signInWithEmailAndPassword(auth, email, password),
    [],
  )

  const signInWithGoogle = useCallback(() => signInWithPopup(auth, googleProvider), [])

  const signOut = useCallback(() => fbSignOut(auth), [])

  return { user, loading, signInWithEmail, signInWithGoogle, signOut }
}
