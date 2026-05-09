import axios from 'axios'

// Uses the Vite proxy (/api → http://localhost:8000) so no CORS issues in dev.
// Override with VITE_API_BASE_URL env var for production deployments.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach JWT ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle 401 ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url    = error.config?.url || ''
    const status = error.response?.status

    console.error(
      `[API] ${error.config?.method?.toUpperCase()} ${url} → ${status ?? 'NO RESPONSE'}`,
      error.response?.data ?? error.message,
    )

    // Auth routes (/auth/login, /auth/register, /auth/me) handle their own
    // errors — don't interfere with them.
    const isAuthRoute = url.includes('/auth/')

    if (status === 401 && !isAuthRoute) {
      // Dispatch a DOM event instead of doing window.location.href so that
      // AuthContext can call logout() and React Router handles the redirect
      // without a full page reload.
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }

    return Promise.reject(error)
  },
)

export default api
