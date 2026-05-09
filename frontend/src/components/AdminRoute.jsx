import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Allows only authenticated admins.
//
// • Unauthenticated  → /login  (with `from` state for post-login redirect)
// • Authenticated non-admin → /dashboard
// • authLoading is always false here (App.jsx blocks route rendering until done)
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
