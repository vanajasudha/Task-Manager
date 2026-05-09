import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ConfirmModal'

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleLogoutConfirm = () => {
    setConfirmLogout(false)
    logout()
    navigate('/login')
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? '?'

  const navItems = [
    { to: '/dashboard', label: 'Dashboard',   Icon: HomeIcon    },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', Icon: ShieldIcon }] : []),
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100
          flex flex-col sidebar-transition
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Brand ─────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-200">
            ✓
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900">TaskFlow</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Workspace</p>
          </div>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="ml-auto lg:hidden p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────── */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Menu
          </p>
          {navItems.map(({ to, label, Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={onMobileClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className={`shrink-0 transition-colors ${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  <Icon />
                </span>
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Profile + Logout ──────────────────────────────────── */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                ${isAdmin ? 'bg-indigo-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <span
                className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide
                  ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={confirmLogout}
        title="Sign out of TaskFlow?"
        message="You'll need to sign in again to access your tasks."
        confirmLabel="Sign out"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
