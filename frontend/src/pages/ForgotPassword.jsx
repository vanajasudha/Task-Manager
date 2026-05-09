import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authService'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState(null)   // { message, reset_token? }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await forgotPassword({ email })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800
                      flex-col items-center justify-center p-12 text-white">

        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-500/25 rounded-full blur-3xl" />
        <div className="absolute inset-0 hero-grid opacity-100" />

        <div className="relative z-10 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-xl font-bold ring-1 ring-white/30">
              ✓
            </div>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>

          <h2 className="text-3xl font-bold leading-snug mb-3">
            Forgot your<br />password?
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            No worries — enter your email and we'll get you back in.
          </p>

          <ul className="space-y-4">
            {[
              { icon: '📧', title: 'Check your inbox',    desc: "We'll send a secure reset link"  },
              { icon: '⏱️', title: 'Link expires in 15m', desc: "For your account's safety"       },
              { icon: '🔒', title: 'Secure by design',    desc: 'Tokens are single-use JWTs'      },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5">
                  {icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-auto text-xs text-indigo-300 text-center max-w-xs">
          "Every expert was once a beginner." — Helen Hayes
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">✓</div>
            <span className="text-lg font-bold text-gray-900">TaskFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

            {result ? (
              /* ── Success state ──────────────────────────────────── */
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Check your instructions</h1>
                <p className="text-sm text-gray-500">{result.message}</p>

                {/* Dev-mode token display */}
                {result.reset_token && (
                  <div className="mt-4 text-left space-y-3">
                    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                      <p className="font-semibold mb-1">Development mode — no email sent</p>
                      <p>In production this token would arrive by email. Use the link below to reset your password.</p>
                    </div>
                    <Link
                      to={`/reset-password?token=${encodeURIComponent(result.reset_token)}`}
                      className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm shadow-indigo-200"
                    >
                      Reset my password →
                    </Link>
                  </div>
                )}

                <Link
                  to="/login"
                  className="inline-block text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors mt-2"
                >
                  ← Back to Sign In
                </Link>
              </div>
            ) : (
              /* ── Form state ─────────────────────────────────────── */
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Enter the email tied to your account and we'll send you a reset link.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
                    <span className="mt-0.5 shrink-0 text-red-500"><AlertCircleIcon /></span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm shadow-indigo-200 mt-1"
                  >
                    {loading
                      ? <><span className="btn-spinner" />Sending…</>
                      : 'Send Reset Link →'
                    }
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Remembered it?{' '}
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
