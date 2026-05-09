import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps any route that requires authentication.
//
// • Unauthenticated users are redirected to /login.
// • The current path is stored in location state so Login can redirect
//   back to it after a successful sign-in.
// • authLoading is never true here — App.jsx renders AuthLoadingScreen
//   until the startup validation finishes, so this component only renders
//   with a definitive auth state.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
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

  return children
}
