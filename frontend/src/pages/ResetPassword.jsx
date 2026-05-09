import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'

export default function ResetPassword() {
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()
  const token                   = searchParams.get('token') || ''

  const [newPassword,    setNewPassword]    = useState('')
  const [confirmPassword,setConfirmPassword]= useState('')
  const [showPw,         setShowPw]         = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [success,        setSuccess]        = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invalid reset link</h1>
          <p className="text-sm text-gray-500">This link is missing the reset token. Please request a new one.</p>
          <Link to="/forgot-password"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors">
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, new_password: newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.')
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
            Set a new<br />password.
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            Choose something strong that you haven't used before.
          </p>

          <ul className="space-y-4">
            {[
              { icon: '🔑', title: 'One-time use',       desc: 'The reset link expires after use'  },
              { icon: '💪', title: 'Make it strong',      desc: 'Mix letters, numbers & symbols'    },
              { icon: '✅', title: 'You\'re almost in',  desc: 'Password change is instant'        },
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
          "Security is not a product, but a process." — Bruce Schneier
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

            {success ? (
              /* ── Success state ──────────────────────────────────── */
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Password updated!</h1>
                <p className="text-sm text-gray-500">
                  Your password has been changed successfully. Redirecting you to Sign In…
                </p>
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <Link to="/login"
                  className="inline-block text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                  Go to Sign In now →
                </Link>
              </div>
            ) : (
              /* ── Form state ─────────────────────────────────────── */
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
                  <p className="text-gray-500 text-sm mt-1">Must be at least 6 characters.</p>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
                    <span className="mt-0.5 shrink-0 text-red-500"><AlertCircleIcon /></span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* New password */}
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="new_password"
                        type={showPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400"
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
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm password
                    </label>
                    <input
                      id="confirm_password"
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:border-transparent transition placeholder-gray-400 ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-300 focus:ring-red-400'
                          : 'border-gray-200 focus:ring-indigo-500'
                      }`}
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (confirmPassword.length > 0 && confirmPassword !== newPassword)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm shadow-indigo-200 mt-1"
                  >
                    {loading
                      ? <><span className="btn-spinner" />Updating…</>
                      : 'Update Password →'
                    }
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                    ← Back to Sign In
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
