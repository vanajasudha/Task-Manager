import { useEffect } from 'react'

// Full class strings so Tailwind scanner includes them
const ACCENT = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
}
const ICON_COLOR = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  info:    'text-blue-500',
  warning: 'text-amber-500',
}

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="flex items-stretch bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden min-w-72 max-w-sm animate-fade-in"
      role="alert"
    >
      {/* Colored left accent bar */}
      <div className={`w-1 shrink-0 ${ACCENT[type] ?? ACCENT.info}`} />

      <div className="flex items-center gap-3 flex-1 px-3.5 py-3">
        <span className={`shrink-0 ${ICON_COLOR[type] ?? ICON_COLOR.info}`}>
          <TypeIcon type={type} />
        </span>
        <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function TypeIcon({ type }) {
  if (type === 'success') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  }
  if (type === 'warning') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  }
  // info (default)
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
