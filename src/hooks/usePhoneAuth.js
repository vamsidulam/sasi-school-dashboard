import { useState, useCallback, useRef, useEffect } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../firebase.js'

const RECAPTCHA_CONTAINER_ID = 'phone-auth-recaptcha'

export function usePhoneAuth() {
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)
  const confirmationRef = useRef(null)
  const verifierRef = useRef(null)

  useEffect(() => {
    return () => {
      verifierRef.current?.clear()
      verifierRef.current = null
    }
  }, [])

  const getVerifier = useCallback(() => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
        size: 'invisible',
      })
    }
    return verifierRef.current
  }, [])

  const sendCode = useCallback(
    async (phoneNumber) => {
      setSending(true)
      setError(null)
      try {
        confirmationRef.current = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          getVerifier(),
        )
        return true
      } catch (err) {
        // A failed attempt leaves the verifier unusable; drop it so the next
        // send builds a fresh one.
        verifierRef.current?.clear()
        verifierRef.current = null
        setError(err)
        return false
      } finally {
        setSending(false)
      }
    },
    [getVerifier],
  )

  const confirmCode = useCallback(async (code) => {
    if (!confirmationRef.current) {
      setError(new Error('Request a code before confirming'))
      return null
    }
    setConfirming(true)
    setError(null)
    try {
      const credential = await confirmationRef.current.confirm(code)
      return credential.user
    } catch (err) {
      setError(err)
      return null
    } finally {
      setConfirming(false)
    }
  }, [])

  return {
    sendCode,
    confirmCode,
    sending,
    confirming,
    error,
    codeSent: Boolean(confirmationRef.current),
    recaptchaContainerId: RECAPTCHA_CONTAINER_ID,
  }
}
