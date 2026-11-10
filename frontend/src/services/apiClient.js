import axios from 'axios'

// Local development talks to the FastAPI server on port 8000. Production
// builds must never fall back to localhost: the deployed API URL comes from
// VITE_API_BASE_URL, set in the Vercel project environment.
const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

if (import.meta.env.PROD && !ENV_API_BASE_URL) {
  console.error(
    'VITE_API_BASE_URL is not set for this production build. Set it in the ' +
      'hosting project environment and redeploy; API requests will fail until then.',
  )
}

const CONFIGURED_BASE_URL =
  ENV_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '')

/**
 * Base URL for the FastAPI backend. The API is versioned under /api/v1; if the
 * environment value omits it, it is appended once.
 */
export const API_BASE_URL = /\/api\/v\d+$/i.test(CONFIGURED_BASE_URL.replace(/\/+$/, ''))
  ? CONFIGURED_BASE_URL.replace(/\/+$/, '')
  : `${CONFIGURED_BASE_URL.replace(/\/+$/, '')}/api/v1`

function detailToMessage(data) {
  if (!data) return null
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join(' ')
  }
  if (Array.isArray(data.errors)) {
    return data.errors
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(' ')
  }
  return data.message || null
}

/**
 * Creates an Axios instance with JWT auth interceptor.
 * @param {string} [baseURL] - Optional base URL override
 * @returns {import('axios').AxiosInstance}
 */
export function createApiClient(baseURL) {
  const apiClient = axios.create({
    baseURL: baseURL || API_BASE_URL,
    timeout: 20000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  apiClient.interceptors.request.use(
    (config) => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        return Promise.reject(
          new Error(
            error.code === 'ECONNABORTED'
              ? 'The request timed out. Please try again.'
              : error.message || 'Unable to reach the API. Check your connection.',
          ),
        )
      }

      const { status, data } = error.response
      const detail = detailToMessage(data)

      if (status === 401) {
        try {
          if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
            localStorage.removeItem('access_token')
            window.dispatchEvent(new Event('auth:unauthorized'))
          }
        } catch {
          // Best-effort storage cleanup.
        }
        return Promise.reject(
          new Error(detail || 'Your session expired. Please log in again.'),
        )
      }

      if (status === 403) {
        return Promise.reject(new Error(detail || 'Access denied.'))
      }

      if (status === 429) {
        return Promise.reject(
          new Error(detail || 'Too many requests. Please wait a moment.'),
        )
      }

      return Promise.reject(
        new Error(detail || (status >= 500 ? 'The server could not complete the request.' : 'Request failed')),
      )
    },
  )

  return apiClient
}

/** Pre-configured axios instance for the backend. */
export const apiClient = createApiClient()
