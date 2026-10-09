'use client'

import { useRef } from 'react'

export function useIdempotencyKeys() {
  const keys = useRef(new Map<string, string>())

  function fingerprint(scope: string, payload: unknown) {
    return `${scope}:${JSON.stringify(payload)}`
  }

  function getKey(scope: string, payload: unknown) {
    const requestFingerprint = fingerprint(scope, payload)
    let key = keys.current.get(requestFingerprint)
    if (!key) {
      key = crypto.randomUUID()
      keys.current.set(requestFingerprint, key)
    }
    return key
  }

  function clearKey(scope: string, payload: unknown) {
    keys.current.delete(fingerprint(scope, payload))
  }

  return { getKey, clearKey }
}
