import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { getUsers, getStats, promoteUser, demoteUser, deleteUser, getAllTasks, getAllowedEmails, addAllowedEmail, removeAllowedEmail } from '../services/adminService'

// Full class strings for Tailwind scanner
const STAT_CARDS = [
  {
    key:      'total_users',
    label:    'Total Users',
    icon:     '👥',
    iconBg:   'bg-indigo-50',
    numColor: 'text-indigo-600',
  },
  {
    key:      'total_tasks',
    label:    'Total Tasks',
    icon:     '📋',
    iconBg:   'bg-slate-50',
    numColor: 'text-slate-700',
  },
  {
    key:      'completed_tasks',
    label:    'Completed',
    icon:     '✅',
    iconBg:   'bg-emerald-50',
    numColor: 'text-emerald-600',
  },
  {
    key:      'active_tasks',
    label:    'In Progress',
    icon:     '⚡',
    iconBg:   'bg-amber-50',
    numColor: 'text-amber-600',
  },
]

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [users,         setUsers]         = useState([])
  const [stats,         setStats]         = useState(null)
  const [usersLoading,  setUsersLoading]  = useState(true)
  const [statsLoading,  setStatsLoading]  = useState(true)
  const [actionLoading, setActionLoading] = useState(new Set())
  const [toasts,        setToasts]        = useState([])
  const [deleteTarget,  setDeleteTarget]  = useState(null)  // user object to delete

  // All-tasks state (admin task ownership view)
  const [allTasks,       setAllTasks]       = useState([])
  const [tasksLoading,   setTasksLoading]   = useState(true)
  const [taskOwnerFilter,setTaskOwnerFilter] = useState('')
  const [taskSearch,     setTaskSearch]     = useState('')

  // Allowlist state
  const [allowedEmails,     setAllowedEmails]     = useState([])
  const [allowlistLoading,  setAllowlistLoading]  = useState(true)
  const [newEmail,          setNewEmail]          = useState('')
  const [addingEmail,       setAddingEmail]       = useState(false)
  const [removingEmail,     setRemovingEmail]     = useState(null) // email being removed

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const { data } = await getUsers()
      data.sort((a, b) => {
        if (a.id === currentUser?.id) return -1
        if (b.id === currentUser?.id) return 1
        if (a.role === 'admin' && b.role !== 'admin') return -1
        if (b.role === 'admin' && a.role !== 'admin') return 1
        return a.username.localeCompare(b.username)
      })
      setUsers(data)
    } catch {
      addToast('Failed to load users', 'error')
    } finally {
      setUsersLoading(false)
    }
  }, [addToast, currentUser?.id])

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const { data } = await getStats()
      setStats(data)
    } catch {
      addToast('Failed to load stats', 'error')
    } finally {
      setStatsLoading(false)
    }
  }, [addToast])

  const loadAllTasks = useCallback(async () => {
    try {
      setTasksLoading(true)
      const { data } = await getAllTasks({ limit: 200, sort_by: 'created_at', sort_order: 'desc' })
      setAllTasks(data.tasks ?? data)
    } catch {
      addToast('Failed to load tasks', 'error')
    } finally {
      setTasksLoading(false)
    }
  }, [addToast])

  const loadAllowedEmails = useCallback(async () => {
    try {
      setAllowlistLoading(true)
      const { data } = await getAllowedEmails()
      setAllowedEmails(data)
    } catch {
      addToast('Failed to load allowlist', 'error')
    } finally {
      setAllowlistLoading(false)
    }
  }, [addToast])

  const handleAddEmail = async (e) => {
    e.preventDefault()
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    if (!email.endsWith('@gmail.com')) {
      addToast('Only Gmail addresses (@gmail.com) can be added.', 'error')
      return
    }
    setAddingEmail(true)
    try {
      const { data } = await addAllowedEmail(email)
      setAllowedEmails((prev) => [...prev, data])
      setNewEmail('')
      addToast(`${email} added to allowlist`)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add email', 'error')
    } finally {
      setAddingEmail(false)
    }
  }

  const handleRemoveEmail = async (email) => {
    setRemovingEmail(email)
    try {
      await removeAllowedEmail(email)
      setAllowedEmails((prev) => prev.filter((e) => e.email !== email))
      addToast(`${email} removed from allowlist`)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to remove email', 'error')
    } finally {
      setRemovingEmail(null)
    }
  }

  const refreshAll = useCallback(() => {
    loadUsers()
    loadStats()
    loadAllTasks()
    loadAllowedEmails()
  }, [loadUsers, loadStats, loadAllTasks, loadAllowedEmails])

  useEffect(() => { refreshAll() }, [refreshAll])

  // ── Role actions ──────────────────────────────────────────────────────────
  const handleRoleAction = async (userId, action) => {
    setActionLoading((prev) => new Set(prev).add(userId))
    try {
      if (action === 'promote') {
        await promoteUser(userId)
        addToast('User promoted to admin')
      } else {
        await demoteUser(userId)
        addToast('Admin demoted to user')
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: action === 'promote' ? 'admin' : 'user' } : u
        )
      )
      loadStats()
    } catch (err) {
      addToast(err.response?.data?.detail || `Failed to ${action} user`, 'error')
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  // ── Delete action ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    setActionLoading((prev) => new Set(prev).add(target.id))
    try {
      await deleteUser(target.id)
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      addToast(`${target.username} has been deleted`)
      loadStats()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete user', 'error')
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev)
        next.delete(target.id)
        return next
      })
    }
  }

  // Map owner_id → { username, role } for fast lookup
  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  )

  // Client-side filter for the tasks table
  const filteredTasks = useMemo(() => {
    let list = allTasks
    if (taskOwnerFilter) list = list.filter((t) => t.owner_id === taskOwnerFilter)
    if (taskSearch.trim()) {
      const q = taskSearch.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (userMap[t.owner_id]?.username ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [allTasks, taskOwnerFilter, taskSearch, userMap])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 overflow-hidden">

        {/* ── Top bar ───────────────────────────────────────────── */}
        <header className="shrink-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="h-14 px-4 sm:px-6 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-gray-400 truncate">Dashboard</span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-900 truncate">Admin Panel</span>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                <ShieldIcon size={11} />
                Admin
              </span>
              <button
                onClick={refreshAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
              >
                <RefreshIcon />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* ── Scrollable content ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

            {/* Page heading */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Platform overview and user management.
                </p>
              </div>
            </div>

            {/* ── Stats grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {STAT_CARDS.map(({ key, label, icon, iconBg, numColor }) => (
                <div
                  key={key}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3.5"
                >
                  <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center text-lg shrink-0`}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-none mb-1 truncate">
                      {label}
                    </p>
                    {statsLoading ? (
                      <div className="h-7 w-10 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <p className={`text-2xl font-bold ${numColor} leading-none`}>
                        {stats?.[key] ?? 0}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Secondary stats row ─────────────────────────────── */}
            {!statsLoading && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Admins',        value: stats.admin_users,   color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
                  { label: 'Members',       value: stats.regular_users, color: 'text-slate-600',   bg: 'bg-slate-50'   },
                  { label: 'Todo Tasks',    value: stats.todo_tasks,    color: 'text-violet-600',  bg: 'bg-violet-50'  },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <span className={`text-sm font-bold ${color} px-2 py-0.5 ${bg} rounded-lg`}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Task completion bar ──────────────────────────────── */}
            {!statsLoading && stats && stats.total_tasks > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Platform task completion</p>
                  <span className="text-sm font-bold text-emerald-600">
                    {Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {stats.completed_tasks} done
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    {stats.active_tasks} active
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                    {stats.todo_tasks} todo
                  </span>
                </div>
              </div>
            )}

            {/* ── All Tasks (ownership view) ───────────────────────── */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Task Overview
                  {!tasksLoading && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {filteredTasks.length} of {allTasks.length} tasks
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {/* search */}
                  <input
                    type="search"
                    placeholder="Search tasks or users…"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full sm:w-44"
                  />
                  {/* user filter */}
                  <select
                    value={taskOwnerFilter}
                    onChange={(e) => setTaskOwnerFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full sm:w-auto"
                  >
                    <option value="">All users</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                  {(taskOwnerFilter || taskSearch) && (
                    <button
                      onClick={() => { setTaskOwnerFilter(''); setTaskSearch('') }}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      × Clear
                    </button>
                  )}
                </div>
              </div>

              {tasksLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-4xl">📋</span>
                  <p className="text-sm font-semibold text-gray-600">No tasks found</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredTasks.map((task) => {
                          const owner = userMap[task.owner_id]
                          return (
                            <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                              {/* Task */}
                              <td className="px-5 py-3.5 max-w-xs">
                                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                                )}
                              </td>
                              {/* Owner */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${owner?.role === 'admin' ? 'bg-indigo-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                    {(owner?.username?.[0] ?? '?').toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{owner?.username ?? <span className="text-gray-400 italic">unknown</span>}</p>
                                    {owner?.role === 'admin' && (
                                      <span className="text-[10px] text-indigo-600 font-semibold">admin</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {/* Priority */}
                              <td className="px-5 py-3.5">
                                <TaskPriorityBadge priority={task.priority} />
                              </td>
                              {/* Status */}
                              <td className="px-5 py-3.5">
                                <TaskStatusBadge status={task.status} />
                              </td>
                              {/* Created */}
                              <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                {task.created_at
                                  ? new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ── User table ───────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  User Management
                  {!usersLoading && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {users.length} {users.length === 1 ? 'account' : 'accounts'}
                    </span>
                  )}
                </h2>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <span className="text-4xl">👥</span>
                  <p className="text-base font-semibold text-gray-700">No users found</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.map((u) => {
                          const isSelf    = u.id === currentUser?.id
                          const isLoading = actionLoading.has(u.id)
                          return (
                            <tr
                              key={u.id}
                              className={`hover:bg-gray-50/60 transition-colors ${isSelf ? 'bg-indigo-50/30' : ''}`}
                            >
                              {/* Avatar + name */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0
                                      ${u.role === 'admin' ? 'bg-indigo-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}
                                  >
                                    {u.username[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{u.username}</p>
                                    {isSelf && (
                                      <span className="inline-block text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold mt-0.5">
                                        you
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>

                              {/* Role badge */}
                              <td className="px-6 py-4">
                                <RoleBadge role={u.role} />
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4">
                                {isSelf ? (
                                  <span className="flex justify-end text-gray-300 text-sm">—</span>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Promote / Demote */}
                                    {u.role === 'user' ? (
                                      <button
                                        onClick={() => handleRoleAction(u.id, 'promote')}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors"
                                      >
                                        {isLoading
                                          ? <><span className="btn-spinner" />Promoting…</>
                                          : <><ArrowUpIcon />Promote</>
                                        }
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRoleAction(u.id, 'demote')}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-60 rounded-lg transition-colors"
                                      >
                                        {isLoading
                                          ? <><span className="btn-spinner" />Demoting…</>
                                          : <><ArrowDownIcon />Demote</>
                                        }
                                      </button>
                                    )}

                                    {/* Delete */}
                                    <button
                                      onClick={() => setDeleteTarget(u)}
                                      disabled={isLoading}
                                      title="Delete user"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-60 rounded-lg transition-colors"
                                    >
                                      <TrashIcon />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ── Allowed-email allowlist ──────────────────────────── */}
            <div>
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Allowed Registrations
                  {!allowlistLoading && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {allowedEmails.length} {allowedEmails.length === 1 ? 'email' : 'emails'}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Only emails on this list can create an account.
                </p>
              </div>

              {/* Add email form */}
              <form onSubmit={handleAddEmail} className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="submit"
                  disabled={addingEmail || !newEmail.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl transition-colors shadow-sm"
                >
                  {addingEmail ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Adding…</>
                  ) : (
                    <>+ Add Email</>
                  )}
                </button>
              </form>

              {/* List */}
              {allowlistLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : allowedEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 bg-white rounded-xl border border-dashed border-gray-200">
                  <span className="text-3xl">📧</span>
                  <p className="text-sm font-semibold text-gray-600">No emails allowed yet</p>
                  <p className="text-xs text-gray-400">Add an email above to allow that person to register.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[380px]">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Added by</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Added on</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allowedEmails.map((entry) => {
                        const isRegistered = users.some((u) => u.email === entry.email)
                        const isRemoving   = removingEmail === entry.email
                        return (
                          <tr key={entry.email} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                                  {entry.email[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate max-w-[160px] sm:max-w-xs">{entry.email}</p>
                                  {isRegistered && (
                                    <span className="text-[10px] text-emerald-600 font-semibold">account exists</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell">
                              {entry.added_by}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-400 hidden md:table-cell">
                              {entry.added_at
                                ? new Date(entry.added_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleRemoveEmail(entry.email)}
                                disabled={isRemoving}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-60 rounded-lg transition-colors"
                              >
                                {isRemoving
                                  ? <><span className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin inline-block" /> Removing…</>
                                  : 'Remove'
                                }
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ──────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.username ?? 'user'}?`}
        message={`This will permanently delete ${deleteTarget?.username ?? 'this user'} and all their tasks. This action cannot be undone.`}
        confirmLabel="Delete user"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Toasts ───────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
        <ShieldIcon size={10} />
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      <UserIcon />
      User
    </span>
  )
}

function TaskPriorityBadge({ priority }) {
  const MAP = {
    low:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Low'    },
    medium: { cls: 'bg-amber-50   text-amber-700   border-amber-200',   label: 'Medium' },
    high:   { cls: 'bg-red-50     text-red-700     border-red-200',     label: 'High'   },
  }
  const cfg = MAP[priority] ?? { cls: 'bg-gray-50 text-gray-600 border-gray-200', label: priority }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function TaskStatusBadge({ status }) {
  const MAP = {
    todo:        { cls: 'bg-slate-100  text-slate-600  border-slate-200',  label: 'To Do'       },
    in_progress: { cls: 'bg-amber-50   text-amber-700  border-amber-200',  label: 'In Progress' },
    done:        { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Done'      },
  }
  const cfg = MAP[status] ?? { cls: 'bg-gray-50 text-gray-600 border-gray-200', label: status }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function ShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}
