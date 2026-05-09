import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { registerUser, loginUser, getMe } from '../services/authService'

function passwordStrength(pw) {
  if (!pw) return null
  if (pw.length < 6) return { level: 0, label: 'Too short', bar: 'w-1/4 bg-red-400',    text: 'text-red-500' }
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)]
  const score  = checks.filter(Boolean).length
  if (score <= 1) return { level: 1, label: 'Weak',   bar: 'w-1/4 bg-red-400',    text: 'text-red-500'    }
  if (score === 2) return { level: 2, label: 'Fair',   bar: 'w-2/4 bg-amber-400',  text: 'text-amber-500'  }
  if (score === 3) return { level: 3, label: 'Good',   bar: 'w-3/4 bg-yellow-400', text: 'text-yellow-600' }
  return                 { level: 4, label: 'Strong', bar: 'w-full bg-emerald-500',text: 'text-emerald-600'}
}

export default function Register() {
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Only Gmail addresses (@gmail.com) are allowed to register.')
      return
    }
    setLoading(true)
    try {
      await registerUser(form)
      const { data: { access_token } } = await loginUser({ email: form.email, password: form.password })
      localStorage.setItem('token', access_token)
      const { data: userData } = await getMe()
      login(userData, access_token)
      navigate('/dashboard')
    } catch (err) {
      localStorage.removeItem('token')
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(form.password)

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── brand ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col items-center justify-center p-12 text-white">

        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl" />

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots2)" />
        </svg>

        <div className="relative z-10 max-w-sm text-center">
          <div className="inline-flex w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl items-center justify-center text-3xl font-bold mb-6 shadow-lg ring-1 ring-white/30">
            ✓
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Start your journey</h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-8">
            Create a free account and start managing your work smarter, not harder.
          </p>
          <ul className="space-y-3 text-sm text-left">
            {[
              { icon: '🚀', text: 'Free to get started, no credit card' },
              { icon: '✅', text: 'Create unlimited tasks and projects' },
              { icon: '🤝', text: 'Collaborate with your team' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-indigo-100">
                <span className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-base shrink-0">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-12 text-xs text-indigo-300 text-center max-w-xs">
          "A goal without a plan is just a wish."
          <span className="block mt-1 text-indigo-400">— Antoine de Saint-Exupéry</span>
        </p>
      </div>

      {/* ── Right panel ── form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">✓</div>
            <span className="text-lg font-bold text-gray-900">TaskFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
              <p className="text-gray-500 text-sm mt-1">Fill in the details below to get started</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
                <span className="mt-0.5 shrink-0"><AlertIcon /></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  required
                  minLength={3}
                  maxLength={50}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">3–50 characters, letters/numbers/underscores</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">Must be a Gmail address (@gmail.com)</p>
              </div>

              {/* Password + strength */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-gray-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Strength meter */}
                {form.password && strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.bar}`} />
                    </div>
                    <p className={`text-xs font-medium ${strength.text}`}>{strength.label}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm mt-2"
              >
                {loading
                  ? <><span className="btn-spinner" />Creating account…</>
                  : 'Create Account'
                }
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
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
