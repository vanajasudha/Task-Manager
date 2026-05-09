import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getMe } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Hydrate synchronously from localStorage (avoids a flash on refresh)
  const [user,  setUser]  = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? sessionStorage.getItem('user') ?? 'null')
    } catch { return null }
  })
  const [token, setToken] = useState(
    () => localStorage.getItem('token') || sessionStorage.getItem('token') || null
  )

  // true while the startup /auth/me validation is in-flight.
  // AppRoutes renders a loading screen until this becomes false so no route
  // is ever rendered with stale / unverified credentials.
  const [authLoading, setAuthLoading] = useState(true)

  // ── logout ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  // ── login ───────────────────────────────────────────────────
  const login = useCallback((userData, accessToken) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }, [])

  // ── Startup token validation ────────────────────────────────
  // Called once on mount. If a token exists, verify it with the backend
  // so expired / revoked JWTs are caught before the user sees protected UI.
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')

    if (!storedToken) {
      // No token at all — definitely unauthenticated
      setAuthLoading(false)
      return
    }

    getMe()
      .then(({ data }) => {
        // Token valid — refresh user data from server (role may have changed)
        login(data, storedToken)
      })
      .catch((err) => {
        // 401 / 403 → token expired or revoked → sign out
        // Network errors (no status) → keep the token; the user will get
        // an error on their first action instead of being logged out offline.
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout()
        }
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for 401s on protected routes ─────────────────────
  // The axios interceptor dispatches this event instead of doing a hard
  // window.location redirect, so React Router handles the navigation.
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      authLoading,
      isAuthenticated: !!token,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
