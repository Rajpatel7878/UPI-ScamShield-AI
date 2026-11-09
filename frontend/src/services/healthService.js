import { apiClient } from './apiClient.js'

/**
 * Fetches backend health information.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{status: string, database: string, service: string}>}
 */
export async function fetchHealth({ signal } = {}) {
  const { data } = await apiClient.get('/health', { signal })
  return data
}

/**
 * Fetches the backend service metadata.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export async function fetchServiceInfo({ signal } = {}) {
  const { data } = await apiClient.get('/', { signal })
  return data
}
