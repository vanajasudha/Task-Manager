import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogoutConfirm = () => {
    setShowConfirm(false)
    logout()
    navigate('/login')
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              ✓
            </div>
            <span className="font-semibold text-gray-900">TaskFlow</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Admin
              </Link>
            )}

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${user?.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}
              >
                {initial}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                <span
                  className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Logout confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-3" aria-hidden="true">👋</div>
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-1">
              Log out?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              You'll be signed out of your TaskFlow session.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                onClick={() => setShowConfirm(false)}
                autoFocus
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                onClick={handleLogoutConfirm}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
