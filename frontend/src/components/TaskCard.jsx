import { useState, useEffect, useRef } from 'react'

// Full class strings for Tailwind scanner
const PRIORITY_TOP_BAR = {
  low:    'bg-emerald-400',
  medium: 'bg-amber-400',
  high:   'bg-red-500',
}

const PRIORITY_PILL = {
  low:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  high:   'bg-red-50 text-red-700 border border-red-200',
}

// Includes hover classes so Tailwind scans the full strings
const STATUS_CHIP = {
  todo:        'bg-slate-100 text-slate-600 hover:bg-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  done:        'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       symbol: '○' },
  in_progress: { label: 'In Progress', symbol: '◑' },
  done:        { label: 'Done',        symbol: '●' },
}

// Click cycles forward through statuses
const STATUS_CYCLE = {
  todo:        'in_progress',
  in_progress: 'done',
  done:        'todo',
}

// Maps new status → which flash animation to play
const FLASH_CLASS = {
  done:        'task-flash-done',
  in_progress: 'task-flash-active',
  todo:        'task-flash-todo',
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false
  return new Date(dateStr) < new Date()
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isDragging = false,
  flashKey,
}) {
  const [flashClass, setFlashClass] = useState('')
  const prevFlashKey = useRef(undefined)

  // Replay the glow animation each time flashKey changes (new object ref = new flash)
  useEffect(() => {
    if (!flashKey || flashKey === prevFlashKey.current) return
    prevFlashKey.current = flashKey
    const cls = FLASH_CLASS[flashKey.status] ?? ''
    if (!cls) return
    setFlashClass(cls)
    const t = setTimeout(() => setFlashClass(''), 800)
    return () => clearTimeout(t)
  }, [flashKey])

  const status   = STATUS_CONFIG[task.status] ?? { label: task.status, symbol: '○' }
  const due      = task.due_date ? new Date(task.due_date) : null
  const overdue  = isOverdue(task.due_date, task.status)
  const dueLabel = due
    ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const isDone = task.status === 'done'

  const stopAndCall = (fn) => (e) => { e.stopPropagation(); fn() }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.effectAllowed = 'move'
        // Tiny delay so the ghost captures the card at full opacity
        setTimeout(() => onDragStart?.(task.id), 0)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={[
        'group bg-white rounded-2xl border border-gray-100',
        'shadow-sm hover:shadow-lg hover:-translate-y-1',
        'transition-all duration-200 overflow-hidden',
        'cursor-grab active:cursor-grabbing select-none',
        isDone     ? 'opacity-70'           : '',
        isDragging ? 'opacity-30 scale-95'  : '',
        flashClass,
      ].filter(Boolean).join(' ')}
    >
      {/* Priority accent bar */}
      <div className={`h-1 w-full ${PRIORITY_TOP_BAR[task.priority] ?? 'bg-gray-200'}`} />

      <div className="p-4 flex flex-col gap-3">

        {/* Row 1: priority pill + edit / delete */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize
              ${PRIORITY_PILL[task.priority] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {task.priority}
          </span>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={stopAndCall(() => onEdit(task))}
              title="Edit task"
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <EditIcon />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={stopAndCall(() => onDelete(task.id))}
              title="Delete task"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Row 2: quick-complete circle + title */}
        <div className="flex items-start gap-2.5">
          {/* Quick-complete toggle */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={stopAndCall(() => onStatusChange(task.id, isDone ? 'todo' : 'done'))}
            title={isDone ? 'Mark as to-do' : 'Mark as done'}
            className="shrink-0 mt-0.5 focus:outline-none"
          >
            {isDone ? (
              <span className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors duration-150">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 flex items-center justify-center transition-all duration-150" />
            )}
          </button>

          <h3
            className={[
              'text-sm font-semibold text-gray-900 leading-snug line-clamp-2',
              isDone ? 'line-through text-gray-400' : '',
            ].join(' ')}
          >
            {task.title}
          </h3>
        </div>

        {/* Row 3: description */}
        {task.description ? (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{task.description}</p>
        ) : (
          <p className="text-xs text-gray-300 italic">No description</p>
        )}

        {/* Row 4: status chip (cycles on click) + due date */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 mt-auto">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={stopAndCall(() => onStatusChange(task.id, STATUS_CYCLE[task.status] ?? 'todo'))}
            title="Click to advance status"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors
              ${STATUS_CHIP[task.status] ?? 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <span>{status.symbol}</span>
            {status.label}
          </button>

          {dueLabel ? (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium
                ${overdue ? 'text-red-500' : 'text-gray-400'}`}
            >
              {overdue ? <WarnIcon /> : <CalIcon />}
              {overdue ? `${dueLabel} · Overdue` : dueLabel}
            </span>
          ) : (
            <span className="text-xs text-gray-300">No due date</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

function CalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
