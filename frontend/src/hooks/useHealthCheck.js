import { useCallback, useEffect, useState } from 'react'
import { fetchHealth } from '../services/healthService.js'

const INITIAL_STATE = {
  status: 'checking',
  data: null,
  error: null,
}

/**
 * Checks backend health on mount and on demand.
 * status: 'checking' | 'online' | 'offline'
 */
export function useHealthCheck() {
  const [state, setState] = useState(INITIAL_STATE)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchHealth({ signal: controller.signal })
      .then((data) => {
        setState({ status: 'online', data, error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }

        setState({ status: 'offline', data: null, error: error.message })
      })

    return () => controller.abort()
  }, [attempt])

  const refresh = useCallback(() => {
    setState(INITIAL_STATE)
    setAttempt((previous) => previous + 1)
  }, [])

  return { ...state, refresh }
}
