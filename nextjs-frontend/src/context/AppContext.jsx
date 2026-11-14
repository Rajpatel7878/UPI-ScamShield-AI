"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiClient } from '../services/apiClient.js'

const TOKEN_KEY = 'access_token'

/** Application metadata context (name, version, backend health). */
export const AppContext = createContext(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

/** Authentication context default (also used outside the provider in tests). */
const defaultContext = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
}

export const AuthContext = createContext(defaultContext)

export function useAuth() {
  return useContext(AuthContext)
}

function readToken() {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage can be unavailable in private browsing; the in-memory session
    // still works until reload.
  }
}

async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me')
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    name: data.full_name || data.email,
    created_at: data.created_at,
  }
}

/** Provides authentication state and token management. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const clearSession = useCallback(() => {
    storeToken(null)
    setUser(null)
  }, [])

  const refreshAuth = useCallback(async () => {
    if (!readToken()) {
      setUser(null)
      setIsLoadingAuth(false)
      return null
    }
    try {
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      clearSession()
      return null
    } finally {
      setIsLoadingAuth(false)
    }
  }, [clearSession])

  useEffect(() => {
    // refreshAuth performs the token check and clears the loading flag itself.
    refreshAuth()
  }, [refreshAuth])

  // A 401 from any API call clears the in-memory session immediately.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async (email, password) => {
    setIsLoadingAuth(true)
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      storeToken(data.access_token)
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      clearSession()
      throw error
    } finally {
      setIsLoadingAuth(false)
    }
  }, [clearSession])

  const register = useCallback(async ({ fullName, email, password }) => {
    setIsLoadingAuth(true)
    try {
      await apiClient.post('/auth/register', {
        full_name: fullName,
        email,
        password,
      })
      const { data } = await apiClient.post('/auth/login', { email, password })
      storeToken(data.access_token)
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      clearSession()
      throw error
    } finally {
      setIsLoadingAuth(false)
    }
  }, [clearSession])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Logout is client-side for stateless JWTs; ignore network failures.
    }
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      login,
      register,
      logout,
      refreshAuth,
    }),
    [user, isLoadingAuth, login, register, logout, refreshAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
