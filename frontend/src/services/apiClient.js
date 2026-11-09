import axios from 'axios'

const DEFAULT_BASE_URL = 'http://localhost:8000'

/**
 * Base URL for the FastAPI backend, configured through environment variables.
 * Falls back to the local development server when no `.env` file is present.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    const message =
      (typeof detail === 'string' && detail) ||
      (error.code === 'ECONNABORTED'
        ? 'The API request timed out.'
        : error.message) ||
      'Unable to reach the API.'

    return Promise.reject(new Error(message))
  },
)
