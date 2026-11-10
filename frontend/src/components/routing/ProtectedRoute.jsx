import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AppContext.js'

/**
 * Renders children if the user is authenticated.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoadingAuth, logout, refreshAuth } = useAuth()
  const location = useLocation()

  // If still loading auth state, render nothing (avoid redirect flicker)
  if (isLoadingAuth) {
    return null
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // User is authenticated; render children
  return children
}

/** Optional: expose the logout function for use in UI */
export function useAuthActions() {
  const { logout, refreshAuth } = useAuth()
  return { logout, refreshAuth }
}