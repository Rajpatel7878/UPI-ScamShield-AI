import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AppContext.jsx'

/**
 * Renders children if the user is authenticated.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth()
  const location = useLocation()

  if (isLoadingAuth) {
    return (
      <div role="status" aria-live="polite" className="py-10 text-center text-sm text-slate-400">
        Checking your session…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

/** Expose auth actions for UI components. */
export function useAuthActions() {
  const { logout, refreshAuth } = useAuth()
  return { logout, refreshAuth }
}
