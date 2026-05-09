import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import { getAnalytics } from '../services/taskService'

// ── Colour palettes (full literals for Tailwind scanner) ──────────────────────

const STATUS_COLORS = {
  todo:        '#94a3b8',
  in_progress: '#f59e0b',
  done:        '#10b981',
}

const PRIORITY_COLORS = {
  Low:    '#10b981',
  Medium: '#f59e0b',
  High:   '#ef4444',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-28">
      {label && <p className="font-semibold text-gray-700 mb-1.5">{label}</p>}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-bold text-gray-800 ml-auto pl-2">{p.value}{p.name === 'Rate %' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton({ height = 220 }) {
  return <div className="skeleton-shimmer rounded-xl" style={{ height }} aria-hidden="true" />
}

function ChartCard({ title, subtitle, children, loading, height = 220 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? <ChartSkeleton height={height} /> : children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsSection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    getAnalytics()
      .then(({ data: d }) => setData(d))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center my-2">
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  const statusData   = data?.status_distribution   ?? []
  const priorityData = data?.priority_distribution ?? []
  const weeklyData   = data?.weekly_activity        ?? []
  const trendData    = data?.monthly_trend          ?? []

  return (
    <div className="space-y-4">

      {/* ── Summary KPI strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Tasks',
            value: loading ? null : (data?.total_tasks ?? 0),
            bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/40',
            border: 'border-indigo-100',
            numColor: 'text-indigo-700',
            labelColor: 'text-indigo-500',
            iconBg: 'bg-indigo-500',
            Icon: BarChartIcon,
          },
          {
            label: 'Completion Rate',
            value: loading ? null : `${data?.completion_rate ?? 0}%`,
            bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40',
            border: 'border-emerald-100',
            numColor: 'text-emerald-700',
            labelColor: 'text-emerald-600',
            iconBg: 'bg-emerald-500',
            Icon: TrendIcon,
          },
          {
            label: 'In Progress',
            value: loading ? null : (statusData.find((s) => s.status === 'in_progress')?.count ?? 0),
            bg: 'bg-gradient-to-br from-amber-50 to-amber-100/40',
            border: 'border-amber-100',
            numColor: 'text-amber-700',
            labelColor: 'text-amber-600',
            iconBg: 'bg-amber-400',
            Icon: ActiveIcon,
          },
          {
            label: 'Completed',
            value: loading ? null : (statusData.find((s) => s.status === 'done')?.count ?? 0),
            bg: 'bg-gradient-to-br from-violet-50 to-violet-100/40',
            border: 'border-violet-100',
            numColor: 'text-violet-700',
            labelColor: 'text-violet-500',
            iconBg: 'bg-violet-500',
            Icon: DoneIcon,
          },
        ].map(({ label, value, bg, border, numColor, labelColor, iconBg, Icon }) => (
          <div key={label} className={`${bg} rounded-xl border ${border} p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}>{label}</p>
              {value === null
                ? <div className="h-6 w-10 skeleton-shimmer rounded mt-1" />
                : <p className={`text-2xl font-bold ${numColor} leading-tight`}>{value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weekly Activity */}
        <ChartCard
          title="Weekly Activity"
          subtitle="Tasks created vs completed — last 7 days"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={4} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              />
              <Bar dataKey="created"   name="Created"   fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard
          title="Status Distribution"
          subtitle="Share of tasks by current status"
          loading={loading}
        >
          {statusData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-300">
              No data yet
            </div>
          ) : (
            <div className="flex items-center gap-4 h-[220px]">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#e2e8f0'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center gap-3.5 flex-1">
                {statusData.map((entry) => {
                  const pct   = data?.total_tasks ? Math.round(entry.count / data.total_tasks * 100) : 0
                  const label = entry.status === 'in_progress' ? 'In Progress'
                              : entry.status === 'todo'        ? 'To Do'
                              : 'Done'
                  const color = STATUS_COLORS[entry.status] ?? '#e2e8f0'
                  return (
                    <div key={entry.status}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-xs font-medium text-gray-600">{label}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{entry.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Productivity Trend */}
        <ChartCard
          title="Productivity Trend"
          subtitle="Completion rate (%) over the last 8 weeks"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e0e7ff', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="rate"
                name="Rate %"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#trendGrad)"
                dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Priority Breakdown */}
        <ChartCard
          title="Priority Breakdown"
          subtitle="Number of tasks at each priority level"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="priority"
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                axisLine={false} tickLine={false}
                width={56}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}

function ActiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function DoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}
