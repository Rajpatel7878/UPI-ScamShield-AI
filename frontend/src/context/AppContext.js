import { createContext, useContext, useState, useEffect } from 'react'

/** Default context value when no authentication is set up. */
const defaultContext = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  login: () => {},
  logout: () => {},
  refreshAuth: () => {},
}

/** Authentication context providing user state and auth actions. */
export const AuthContext = createContext(defaultContext)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/** Provides authentication state and token management. */
export function AuthProvider({ children }) {
  // Check for existing token on mount
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      // Validate token by fetching user profile
      fetch('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) {
            setUser({ id: res.id, email: res.email, name: res.name })
            setIsLoadingAuth(false)
          } else {
            localStorage.removeItem('access_token')
            setUser(null)
            setIsLoadingAuth(false)
          }
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          setUser(null)
          setIsLoadingAuth(false)
        })
    } else {
      setIsLoadingAuth(false)
    }
  }, [])

  const login = (tokens) => {
    // tokens: { access_token, refresh_token? }
    if (tokens.access_token) {
      typeof window !== 'undefined' && localStorage.setItem('access_token', tokens.access_token)
    }
    // Fetch user profile to populate context
    fetch('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((userData) => {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
            })
            setIsLoadingAuth(false)
          })
        } else {
          localStorage.removeItem('access_token')
          setUser(null)
          setIsLoadingAuth(false)
        }
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        setUser(null)
        setIsLoadingAuth(false)
      })
    setIsLoadingAuth(false)
  }

  const logout = () => {
    try {
      typeof window !== 'undefined' && localStorage.removeItem('access_token')
    } catch (e) {
      // best-effort
    }
    setUser(null)
  }

  const refreshAuth = () => {
    setIsLoadingAuth(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      fetch('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) {
            res.json().then((userData) => {
              setUser({
                id: userData.id,
                email: userData.email,
                name: userData.name,
              })
            })
          } else {
            localStorage.removeItem('access_token')
            setUser(null)
          }
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          setUser(null)
        })
    }
    setIsLoadingAuth(false)
  }

  if (isLoadingAuth) {
    return null // show nothing while loading auth state
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}