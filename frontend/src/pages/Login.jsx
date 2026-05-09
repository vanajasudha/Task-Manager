import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { loginUser, getMe } from '../services/authService'

export default function Login() {
  const [form,       setForm]       = useState({ email: '', password: '' })
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [showPw,     setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const { login, isAuthenticated } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />
  }

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: { access_token } } = await loginUser(form)
      localStorage.setItem('token', access_token)
      const { data: userData } = await getMe()
      login(userData, access_token)
      if (!rememberMe) {
        sessionStorage.setItem('token', access_token)
        sessionStorage.setItem('user', JSON.stringify(userData))
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      setError(err.response?.data?.detail || 'Login failed. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-bg relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Ambient orbs ─────────────────────────────────────────────────── */}
      <div className="orb-1 pointer-events-none absolute -top-52 -left-52 w-[700px] h-[700px] rounded-full bg-violet-600/[0.18] blur-[130px]" />
      <div className="orb-2 pointer-events-none absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.18] blur-[110px]" />
      <div className="orb-3 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/[0.08] blur-3xl" />

      {/* ── Grid overlay ─────────────────────────────────────────────────── */}
      <div className="auth-grid pointer-events-none absolute inset-0" />

      {/* ── Floating card ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4 my-8"
      >
        {/* Glow halo behind the card */}
        <div className="auth-card-halo absolute -inset-px rounded-3xl blur-lg" />

        {/* Card */}
        <div className="auth-card relative rounded-3xl border border-white/[0.1] p-8 shadow-2xl">

          {/* ── Logo ───────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.12, duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 shrink-0">
              <CheckIcon />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] tracking-tight leading-none">TaskFlow</p>
              <p className="text-white/40 text-[11px] mt-0.5 tracking-wide">Work smarter, ship faster</p>
            </div>
          </motion.div>

          {/* ── Heading ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.18, duration: 0.4, ease: 'easeOut' }}
            className="mb-7"
          >
            <h1 className="text-[26px] font-bold text-white tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-white/45 text-sm mt-1.5 leading-relaxed">
              Sign in to continue to your workspace
            </p>
          </motion.div>

          {/* ── Error banner ───────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0   }}
                animate={{ opacity: 1, y: 0,  height: 'auto' }}
                exit={{    opacity: 0, y: -4, height: 0   }}
                transition={{ duration: 0.25 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-red-300 text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="mt-0.5 shrink-0 text-red-400"><AlertIcon /></span>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form ───────────────────────────────────────────────────── */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1  }}
            transition={{ delay: 0.25, duration: 0.35 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>
              <label htmlFor="email" className="auth-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoFocus
                className="auth-input"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="auth-label">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors tracking-wide uppercase"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="auth-input pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/65 transition-colors p-0.5"
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group py-0.5">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-[17px] h-[17px] rounded-[4px] border border-white/25 peer-checked:bg-indigo-600 peer-checked:border-indigo-500 bg-white/[0.06] transition-colors flex items-center justify-center">
                  {rememberMe && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-white/45 group-hover:text-white/70 transition-colors">
                Remember me
              </span>
              <span className="ml-auto text-[11px] text-white/25 font-medium">
                {rememberMe ? 'Persistent session' : 'Session only'}
              </span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.012, y: -1 } : {}}
              whileTap={!loading   ? { scale: 0.988        } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="auth-btn-primary group relative w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white mt-1 overflow-hidden"
            >
              {/* Shine sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
              {loading ? (
                <><span className="btn-spinner" />Signing in…</>
              ) : (
                <><span>Sign in</span><ArrowRightIcon /></>
              )}
            </motion.button>

          </motion.form>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[11px] text-white/25 font-medium tracking-wide">New to TaskFlow?</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* ── Register link ──────────────────────────────────────────── */}
          <Link
            to="/register"
            className="auth-btn-ghost w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Create a free account
          </Link>

        </div>
      </motion.div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <p className="pointer-events-none absolute bottom-5 inset-x-0 text-center text-[11px] text-white/[0.18] tracking-wide">
        © 2025 TaskFlow · Secure · Fast · Reliable
      </p>

    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
