import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService'
import AnalyticsSection from '../components/AnalyticsSection'

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first'  },
  { value: 'created_at:asc',  label: 'Oldest first'  },
  { value: 'due_date:asc',    label: 'Due date ↑'    },
  { value: 'updated_at:desc', label: 'Last updated'  },
  { value: 'title:asc',       label: 'Title A–Z'     },
]

// Full class strings for Tailwind content scanner
const STAT_CARDS = [
  { key: 'total',      label: 'Total Tasks',   iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', numColor: 'text-indigo-600', barColor: 'bg-indigo-500', Icon: AllTasksIcon  },
  { key: 'todo',       label: 'To Do',          iconBg: 'bg-slate-100',  iconColor: 'text-slate-500',  numColor: 'text-slate-700',  barColor: 'bg-slate-400',  Icon: TodoIcon      },
  { key: 'inProgress', label: 'In Progress',    iconBg: 'bg-amber-100',  iconColor: 'text-amber-500',  numColor: 'text-amber-500',  barColor: 'bg-amber-400',  Icon: ProgressIcon  },
  { key: 'done',       label: 'Completed',      iconBg: 'bg-emerald-100',iconColor: 'text-emerald-600',numColor: 'text-emerald-600',barColor: 'bg-emerald-500', Icon: DoneIcon      },
]

const PRIORITY_DOT = {
  low:    'bg-emerald-400',
  medium: 'bg-amber-400',
  high:   'bg-red-500',
}

// Full class strings for Tailwind scanner — drag/drop status zones
const DROP_ZONES = [
  {
    status:      'todo',
    label:       'To Do',
    symbol:      '○',
    idleClass:   'bg-slate-50 border-slate-200 text-gray-400',
    activeClass: 'bg-slate-100 border-slate-400 text-slate-700 scale-105',
  },
  {
    status:      'in_progress',
    label:       'In Progress',
    symbol:      '◑',
    idleClass:   'bg-blue-50 border-blue-200 text-gray-400',
    activeClass: 'bg-blue-100 border-blue-400 text-blue-700 scale-105',
  },
  {
    status:      'done',
    label:       'Done',
    symbol:      '●',
    idleClass:   'bg-emerald-50 border-emerald-200 text-gray-400',
    activeClass: 'bg-emerald-100 border-emerald-400 text-emerald-700 scale-105',
  },
]

// ── Stat icon components ──────────────────────────────────────────────────────

function AllTasksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}
function TodoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function ProgressIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function DoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" aria-hidden="true">
      <div className="h-1 w-full skeleton-shimmer" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-16 rounded-full skeleton-shimmer" />
          <div className="h-5 w-8 rounded skeleton-shimmer" />
        </div>
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-2/3 rounded skeleton-shimmer" />
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          <div className="h-5 w-16 rounded-full skeleton-shimmer" />
          <div className="h-4 w-20 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isTaskOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false
  return new Date(dateStr) < new Date()
}

function buildPageWindows(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', total)
  } else if (current >= total - 3) {
    pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '…', current - 1, current, current + 1, '…', total)
  }
  return pages
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  const [search,          setSearch]          = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [sort,    setSort]    = useState('created_at:desc')
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(20)

  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const [modal,         setModal]         = useState({ open: false, task: null })
  const [toasts,        setToasts]        = useState([])
  const [confirmDelete, setConfirmDelete] = useState({ open: false, taskId: null })
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [viewMode, setViewMode] = useState('board') // 'board' | 'history'

  // Drag-and-drop state
  const [draggingId,   setDraggingId]   = useState(null)
  const [dragOverZone, setDragOverZone] = useState(null)
  // Maps taskId → { status, ts } — changing the object reference triggers TaskCard's flash useEffect
  const [flashKeys,    setFlashKeys]    = useState(new Map())

  // Debounce search 300 ms
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const switchToHistory = () => {
    setViewMode('history')
    setFilters({ status: 'done', priority: '' })
    setSort('updated_at:desc')
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  const switchToBoard = () => {
    setViewMode('board')
    setFilters({ status: '', priority: '' })
    setSort('created_at:desc')
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const [sortBy, sortOrder] = sort.split(':')
      const params = { skip: (page - 1) * limit, limit, sort_by: sortBy, sort_order: sortOrder }
      if (filters.status)   params.status   = filters.status
      if (filters.priority) params.priority = filters.priority
      if (debouncedSearch)  params.search   = debouncedSearch
      const { data } = await getTasks(params)
      setTasks(data.tasks)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      addToast('Failed to load tasks', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, limit, sort, filters, debouncedSearch, addToast])

  useEffect(() => { loadTasks() }, [loadTasks])

  const changeFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1) }
  const changeSort   = (value) => { setSort(value);          setPage(1) }
  const changeLimit  = (value) => { setLimit(Number(value)); setPage(1) }

  const handleSave = async (formData) => {
    if (modal.task) {
      await updateTask(modal.task.id, formData)
      addToast('Task updated')
    } else {
      await createTask(formData)
      addToast('Task created')
    }
    setModal({ open: false, task: null })
    loadTasks()
  }

  const handleDelete = (id) => setConfirmDelete({ open: true, taskId: id })

  const handleDeleteConfirm = async () => {
    const id = confirmDelete.taskId
    setConfirmDelete({ open: false, taskId: null })
    try {
      await deleteTask(id)
      addToast('Task deleted')
      loadTasks()
    } catch {
      addToast('Failed to delete task', 'error')
    }
  }

  // ── Quick status change (optimistic) ─────────────────────────────────────
  const handleStatusChange = async (taskId, newStatus) => {
    const prev = tasks.find((t) => t.id === taskId)
    if (!prev || prev.status === newStatus) return

    // Optimistic update — UI reflects change immediately
    setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))

    // Trigger glow flash on the card
    setFlashKeys((m) => new Map(m).set(taskId, { status: newStatus, ts: Date.now() }))

    try {
      await updateTask(taskId, { status: newStatus })
    } catch {
      // Revert on failure
      setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, status: prev.status } : t))
      addToast('Failed to update task status', 'error')
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const stats = {
    total,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done:       tasks.filter((t) => t.status === 'done').length,
  }

  const pageCount    = stats.todo + stats.inProgress + stats.done
  const completionPct = pageCount > 0 ? Math.round((stats.done / pageCount) * 100) : 0

  const now      = new Date()
  const hour     = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today    = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  const hasActiveFilters = filters.status || filters.priority || debouncedSearch.trim()

  const clearFilters = () => {
    setFilters({ status: '', priority: '' })
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  // Upcoming tasks from current page (not done, have due date, sorted soonest first)
  const upcomingTasks = [...tasks]
    .filter((t) => t.due_date && t.status !== 'done')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  const selectCls = 'px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-700'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* ── Main area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 overflow-hidden">

        {/* Sticky top bar */}
        <header className="shrink-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">

            {/* Left: hamburger + title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 leading-none">
                  {viewMode === 'history' ? 'Task History' : 'My Tasks'}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{today}</p>
              </div>
            </div>

            {/* Center: view tabs (tablet+) */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={switchToBoard}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                My Tasks
              </button>
              <button
                onClick={switchToHistory}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ✓ History
              </button>
            </div>

            {/* Right: analytics toggle + new task button */}
            <div className="flex items-center gap-2">
              {viewMode === 'board' && (
                <button
                  onClick={() => setShowAnalytics((v) => !v)}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${showAnalytics ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  title={showAnalytics ? 'Hide analytics' : 'Show analytics'}
                >
                  <AnalyticsIcon />
                  <span className="hidden sm:inline">{showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
                </button>
              )}
              {viewMode === 'board' && (
                <button
                  onClick={() => setModal({ open: true, task: null })}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200"
                >
                  <PlusIcon />
                  <span className="hidden sm:inline">New Task</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile-only tab strip */}
          <div className="sm:hidden border-t border-gray-100 px-4 py-2">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={switchToBoard}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                My Tasks
              </button>
              <button
                onClick={switchToHistory}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ✓ History
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1440px] mx-auto">

            {/* ── Hero card ────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl p-6 text-white mb-6">
              <div className="absolute inset-0 hero-grid" />
              {/* Blob accents */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 left-1/3 w-32 h-32 bg-violet-400/20 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-indigo-200 text-sm font-medium mb-1">{today}</p>
                  <h2 className="text-2xl font-bold">
                    {greeting}, <span className="text-indigo-100">{user?.username}</span>! 👋
                  </h2>
                  <p className="text-indigo-200 text-sm mt-2 max-w-xs leading-relaxed">
                    {viewMode === 'history'
                      ? total === 0
                        ? 'No completed tasks yet. Finish some tasks and they\'ll appear here.'
                        : `${total} completed task${total !== 1 ? 's' : ''} — your full completion history.`
                      : total === 0
                        ? "You're all caught up! Hit 'New Task' to get started."
                        : `${total} task${total !== 1 ? 's' : ''} in your workspace${stats.done > 0 ? ` · ${stats.done} completed` : ''}.`
                    }
                  </p>
                </div>

                {total > 0 && (
                  <div className="sm:min-w-52 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Progress</p>
                      <span className="text-xl font-bold text-white">{completionPct}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-indigo-200 mt-2">
                      {stats.done} of {pageCount} tasks done
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats row ────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {STAT_CARDS.map(({ key, label, iconBg, iconColor, numColor, Icon }) => (
                <div
                  key={key}
                  className="stat-card bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3.5 transition-all duration-200 cursor-default"
                >
                  <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${iconColor} shrink-0`}>
                    <Icon />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-none mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${numColor} leading-none`}>{stats[key]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Analytics section (toggle) ───────────────────── */}
            {showAnalytics && (
              <div className="mb-6">
                <AnalyticsSection />
              </div>
            )}

            {/* ── Main content + right panel ───────────────────── */}
            <div className="flex gap-5">

              {/* Task area */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* Filter / search bar */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
                  <div className="relative flex-1 min-w-44">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <SearchIcon />
                    </span>
                    <input
                      type="search"
                      placeholder="Search tasks…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <select value={filters.status}   onChange={(e) => changeFilter('status',   e.target.value)} className={selectCls}>
                    <option value="">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  <select value={filters.priority} onChange={(e) => changeFilter('priority', e.target.value)} className={selectCls}>
                    <option value="">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  <select value={sort} onChange={(e) => changeSort(e.target.value)} className={selectCls}>
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      × Clear
                    </button>
                  )}
                  <button
                    onClick={loadTasks}
                    title="Refresh"
                    className="px-3 py-2 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ↻
                  </button>
                </div>

                {/* Result count */}
                {!loading && (
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>
                      {total === 0 ? 'No tasks' : `${total} task${total !== 1 ? 's' : ''}`}
                      {hasActiveFilters ? ' matching' : ''}
                    </span>
                    {pages > 1 && <span>Page {page} / {pages}</span>}
                  </div>
                )}

                {/* Status drop zones — slide in while a card is being dragged */}
                <div className={`drop-zone-strip grid grid-cols-3 gap-3 ${draggingId ? 'max-h-24 opacity-100 mb-1' : 'max-h-0 opacity-0 mb-0'}`}>
                  {DROP_ZONES.map((zone) => {
                    const isOver = dragOverZone === zone.status
                    return (
                      <div
                        key={zone.status}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverZone(zone.status) }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverZone(null) }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const id = e.dataTransfer.getData('taskId')
                          if (id) handleStatusChange(id, zone.status)
                          setDraggingId(null)
                          setDragOverZone(null)
                        }}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 border-dashed transition-all duration-150 ${isOver ? zone.activeClass : zone.idleClass}`}
                      >
                        <span className="text-base leading-none">{zone.symbol}</span>
                        <span className="text-xs font-semibold">{zone.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Task grid / skeleton / empty state */}
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {Array.from({ length: Math.min(limit, 6) }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    {hasActiveFilters ? (
                      <>
                        <EmptyFilteredSVG />
                        <p className="text-base font-semibold text-gray-700">No tasks match your filters</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
                        <button
                          onClick={clearFilters}
                          className="mt-1 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <EmptyBoardSVG />
                        <p className="text-base font-semibold text-gray-700">No tasks yet</p>
                        <p className="text-sm text-gray-400">Create your first task to get started.</p>
                        <button
                          onClick={() => setModal({ open: true, task: null })}
                          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                        >
                          <PlusIcon /> New Task
                        </button>
                      </>
                    )}
                  </div>
                ) : viewMode === 'history' ? (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <HistoryListItem key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={(t)  => setModal({ open: true, task: t })}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onDragStart={(id) => setDraggingId(id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverZone(null) }}
                        isDragging={draggingId === task.id}
                        flashKey={flashKeys.get(task.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && pages > 1 && (
                  <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Prev
                      </button>

                      {buildPageWindows(page, pages).map((n, i) =>
                        n === '…' ? (
                          <span key={`e-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${n === page ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            {n}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= pages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>

                    <select
                      value={limit}
                      onChange={(e) => changeLimit(e.target.value)}
                      className={selectCls}
                      title="Items per page"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} / page</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ── Right panel (xl+ only) ──────────────────────── */}
              <div className="hidden xl:flex flex-col gap-4 w-64 shrink-0">

                {/* Productivity summary */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Productivity</p>
                  <div className="text-center py-1 mb-3">
                    <p className={`text-4xl font-bold ${completionPct >= 75 ? 'text-emerald-500' : completionPct >= 40 ? 'text-amber-500' : 'text-indigo-600'}`}>
                      {completionPct}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">completion rate</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${completionPct >= 75 ? 'bg-emerald-500' : completionPct >= 40 ? 'bg-amber-400' : 'bg-indigo-600'}`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center">{stats.done} of {pageCount || total} completed</p>

                  {/* Mini breakdown */}
                  {pageCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-1 text-center">
                      {[
                        { label: 'Todo',    count: stats.todo,       color: 'text-slate-500' },
                        { label: 'Active',  count: stats.inProgress, color: 'text-amber-500' },
                        { label: 'Done',    count: stats.done,       color: 'text-emerald-500' },
                      ].map(({ label, count, color }) => (
                        <div key={label}>
                          <p className={`text-lg font-bold ${color}`}>{count}</p>
                          <p className="text-[10px] text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming deadlines */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-400"><CalendarIcon /></span>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Upcoming</p>
                  </div>
                  {upcomingTasks.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">
                      {total === 0 ? 'No tasks yet' : 'No open deadlines'}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {upcomingTasks.map((task) => {
                        const over = isTaskOverdue(task.due_date, task.status)
                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setModal({ open: true, task })}
                            title="Click to edit"
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-gray-300'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-800 truncate">{task.title}</p>
                              <p className={`text-xs mt-0.5 ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                {over ? '⚠ Overdue · ' : ''}
                                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setModal({ open: true, task: null })}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    >
                      <PlusIcon /> Create New Task
                    </button>
                    <button
                      onClick={() => { changeFilter('status', 'in_progress'); setPage(1) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      <ProgressIcon /> View In Progress
                    </button>
                    <button
                      onClick={() => { changeFilter('priority', 'high'); setPage(1) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <HighPriorityIcon /> High Priority
                    </button>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        × Clear Filters
                      </button>
                    )}
                  </div>
                </div>

              </div>{/* end right panel */}
            </div>{/* end flex gap */}

          </div>{/* end content padding */}
        </div>{/* end overflow-y-auto */}
      </div>{/* end main area */}

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Modals */}
      <TaskModal
        open={modal.open}
        task={modal.task}
        onClose={() => setModal({ open: false, task: null })}
        onSave={handleSave}
      />
      <ConfirmModal
        open={confirmDelete.open}
        title="Delete this task?"
        message="This will permanently remove the task. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ open: false, taskId: null })}
      />
    </div>
  )
}

// ── Icon components ───────────────────────────────────────────────────────────

function AnalyticsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function HighPriorityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function EmptyBoardSVG() {
  return (
    <svg className="w-36 h-28 opacity-50" viewBox="0 0 160 120" fill="none">
      <rect x="28" y="18" width="104" height="84" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
      <rect x="56" y="10" width="48" height="18" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="42" y="42" width="76" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="42" y="58" width="58" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="42" y="74" width="66" height="8" rx="4" fill="#e2e8f0"/>
      <circle cx="120" cy="96" r="14" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5"/>
      <line x1="120" y1="90" x2="120" y2="102" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
      <line x1="114" y1="96" x2="126" y2="96" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function EmptyFilteredSVG() {
  return (
    <svg className="w-36 h-28 opacity-50" viewBox="0 0 160 120" fill="none">
      <circle cx="66" cy="56" r="32" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2.5"/>
      <circle cx="66" cy="56" r="20" fill="white" stroke="#cbd5e1" strokeWidth="2"/>
      <line x1="82" y1="74" x2="106" y2="98" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round"/>
      <line x1="58" y1="48" x2="74" y2="64" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="74" y1="48" x2="58" y2="64" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── History list item ─────────────────────────────────────────────────────────

const HIST_PRIORITY_DOT   = { low: 'bg-emerald-400', medium: 'bg-amber-400', high: 'bg-red-500' }
const HIST_PRIORITY_PILL  = { low: 'bg-emerald-50 text-emerald-700 border-emerald-200', medium: 'bg-amber-50 text-amber-700 border-amber-200', high: 'bg-red-50 text-red-700 border-red-200' }
const HIST_PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }

function HistoryListItem({ task }) {
  const completedAt = task.updated_at ? new Date(task.updated_at) : null
  const daysAgo = completedAt ? Math.floor((Date.now() - completedAt.getTime()) / 86_400_000) : null

  const relativeLabel = daysAgo === null ? null
    : daysAgo === 0 ? 'today'
    : daysAgo === 1 ? 'yesterday'
    : `${daysAgo}d ago`

  const formattedDate = completedAt
    ? completedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all group">
      {/* priority dot */}
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${HIST_PRIORITY_DOT[task.priority] ?? 'bg-gray-300'}`} />

      {/* title + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}
      </div>

      {/* priority badge */}
      <span className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${HIST_PRIORITY_PILL[task.priority] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
        {HIST_PRIORITY_LABEL[task.priority] ?? task.priority}
      </span>

      {/* done badge */}
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0">
        ✓ Done
      </span>

      {/* date */}
      <div className="text-right flex-shrink-0 min-w-[72px]">
        <p className="text-xs font-medium text-gray-500">{formattedDate}</p>
        {relativeLabel && <p className="text-xs text-gray-300">{relativeLabel}</p>}
      </div>
    </div>
  )
}
