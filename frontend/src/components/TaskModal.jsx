import { useState, useEffect, useRef } from 'react'

const EMPTY_FORM = {
  title:       '',
  description: '',
  status:      'todo',
  priority:    'medium',
  due_date:    '',
}

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do',       symbol: '○' },
  { value: 'in_progress', label: 'In Progress', symbol: '◑' },
  { value: 'done',        label: 'Done',        symbol: '●' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

// Full class strings for Tailwind scanner
const STATUS_ACTIVE = {
  todo:        'bg-slate-100 text-slate-700 ring-2 ring-slate-300',
  in_progress: 'bg-blue-50 text-blue-700 ring-2 ring-blue-300',
  done:        'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400',
}

const PRIORITY_ACTIVE = {
  low:    'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400',
  medium: 'bg-amber-50 text-amber-700 ring-2 ring-amber-400',
  high:   'bg-red-50 text-red-700 ring-2 ring-red-400',
}

const PRIORITY_DOT = {
  low:    'bg-emerald-400',
  medium: 'bg-amber-400',
  high:   'bg-red-400',
}

const PICKER_IDLE = 'bg-gray-50 text-gray-600 hover:bg-gray-100'

export default function TaskModal({ open, task, onClose, onSave }) {
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [errors,      setErrors]      = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (task) {
      setForm({
        title:       task.title,
        description: task.description ?? '',
        status:      task.status,
        priority:    task.priority,
        due_date:    task.due_date ? task.due_date.slice(0, 10) : '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
    setSubmitError('')
    setTimeout(() => titleRef.current?.focus(), 60)
  }, [task, open])

  if (!open) return null

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())
      e.title = 'Title is required.'
    else if (form.title.trim().length > 200)
      e.title = 'Title must be 200 characters or fewer.'
    if (form.description.length > 1000)
      e.description = 'Description must be 1000 characters or fewer.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      return
    }

    const payload = { ...form }
    if (payload.due_date) {
      payload.due_date = new Date(payload.due_date).toISOString()
    } else {
      delete payload.due_date
    }
    if (!payload.description.trim()) delete payload.description

    setSubmitError('')
    setSubmitting(true)
    try {
      await onSave(payload)
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = Boolean(task)
  const titleLen  = form.title.length
  const descLen   = form.description.length

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
              {isEditing ? '✎' : '+'}
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {/* API error banner */}
          {submitError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fade-in">
              <span className="font-bold shrink-0">!</span>
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="tm-title" className="text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${titleLen > 180 ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                {titleLen}/200
              </span>
            </div>
            <input
              id="tm-title"
              ref={titleRef}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="What needs to be done?"
              maxLength={200}
              className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="tm-desc" className="text-sm font-medium text-gray-700">
                Description <span className="text-xs text-gray-400 font-normal">— optional</span>
              </label>
              {descLen > 0 && (
                <span className={`text-xs ${descLen > 900 ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                  {descLen}/1000
                </span>
              )}
            </div>
            <textarea
              id="tm-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Add more details…"
              maxLength={1000}
              rows={3}
              className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          {/* Status picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => set('status', s.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${form.status === s.value ? STATUS_ACTIVE[s.value] : PICKER_IDLE}`}
                >
                  <span>{s.symbol}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => set('priority', p.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${form.priority === p.value ? PRIORITY_ACTIVE[p.value] : PICKER_IDLE}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[p.value]}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="tm-due" className="block text-sm font-medium text-gray-700 mb-1.5">
              Due Date <span className="text-xs text-gray-400 font-normal">— optional</span>
            </label>
            <input
              id="tm-due"
              type="date"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {submitting
                ? <><span className="btn-spinner" />{isEditing ? 'Saving…' : 'Creating…'}</>
                : isEditing ? 'Save Changes' : 'Create Task'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
