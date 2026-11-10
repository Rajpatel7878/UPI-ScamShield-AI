import axios from 'axios'

/** Base URL for the FastAPI backend, read from Vite environment. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Creates an Axios instance with JWT auth interceptor.
 * The interceptor reads the access token from the AuthContext storage.
 *
 * @param {string} [baseURL] - Optional base URL override
 * @returns {import('axios').AxiosInstance} Configured axios instance
 */
export function createApiClient(baseURL) {
  const baseUrl = baseURL || API_BASE_URL

  const apiClient = axios.create({
    baseURL: baseUrl.replace(/^\/+|\/+$/g, ''),
    timeout: 15000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor: attach JWT access token
  apiClient.interceptors.request.use(
    (config) => {
      // Read token from localStorage (set by auth login)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // Response interceptor: handle common HTTP errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status
        const detail = error.response.data?.detail

        // 401: Unauthorized - clear stale token and reject
        if (status === 401) {
          // Attempt to clear token; best-effort in interceptor
          try {
            typeof window !== 'undefined' && localStorage.removeItem('access_token')
          } catch (e) {
            // best-effort only
          }
          return Promise.reject(new Error('Unauthenticated. Please log in again.'))
        }

        // 403: Forbidden
        if (status === 403) {
          return Promise.reject(new Error(detail || 'Access denied.'))
        }

        // 422: Validation error
        if (status === 422) {
          const validationDetail = detail || 'Validation failed'
          return Promise.reject(new Error(validationDetail))
        }

        // Network / server errors
        return Promise.reject(
          new Error(
            (error.response.data?.detail ||
              error.response.data?.message ||
              'Request failed'),
          ),
        )
      }

      // Network error (no response)
      return Promise.reject(
        new Error(
          error.message || 'Unable to reach the API. Check your connection.',
        ),
      )
    },
  )

  return apiClient
}

/** Pre-configured axios instance for the backend. */
export const apiClient = createApiClient()