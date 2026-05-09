import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'

/* ─── animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7, delay },
})

function RevealSection({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/* ─── navbar ─── */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)
  const handleScroll = (id) => { scrollTo(id); close() }

  return (
    <motion.nav
      {...fadeIn(0)}
      className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100"
    >
      {/* ── main bar ── */}
      <div className="flex items-center justify-between px-5 sm:px-8 md:px-16 h-16">
        {/* brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('top')}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200">
            ✓
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">TaskFlow</span>
        </div>

        {/* desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <button onClick={() => handleScroll('what-is')} className="hover:text-indigo-600 transition-colors">About</button>
          <button onClick={() => handleScroll('how-it-works')} className="hover:text-indigo-600 transition-colors">How it works</button>
          <button onClick={() => handleScroll('features')} className="hover:text-indigo-600 transition-colors">Features</button>
        </div>

        {/* auth actions + hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-4 py-2 rounded-xl transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="hidden sm:inline-flex text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all duration-200"
          >
            Create account
          </Link>
          {/* hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── mobile dropdown ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-5 py-4 shadow-lg space-y-1">
          {[
            { id: 'what-is',      label: 'About'        },
            { id: 'how-it-works', label: 'How it works' },
            { id: 'features',     label: 'Features'     },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleScroll(id)}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={close}
              className="w-full text-center px-4 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={close}
              className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl shadow-sm"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </motion.nav>
  )
}

/* ─── hero ─── */
function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-300/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-purple-200/15 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(to right,#6366f1 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="text-center max-w-4xl px-6 md:px-12 flex flex-col items-center gap-6">
        {/* badge */}
        <motion.div {...fadeUp(0.1)}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full tracking-wide">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Task Management · Built for teams
          </span>
        </motion.div>

        {/* headline */}
        <motion.h1
          {...fadeUp(0.2)}
          className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight"
        >
          Meet{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </motion.h1>

        {/* what it is — clear, direct */}
        <motion.p
          {...fadeUp(0.3)}
          className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed font-medium"
        >
          A task management platform where your team creates, tracks, and completes work — with role-based access, real-time analytics, and a clean dashboard that actually makes sense.
        </motion.p>

        {/* secondary tagline */}
        <motion.p {...fadeUp(0.38)} className="text-base text-gray-400 max-w-xl">
          From solo devs to full teams — organize your projects, stay on top of priorities, and never lose track of what matters.
        </motion.p>

        {/* actions */}
        <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <button
            onClick={() => scrollTo('how-it-works')}
            className="group flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-400 hover:scale-105 transition-all duration-200"
          >
            See how it works
            <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
          </button>
          <Link
            to="/login"
            className="flex items-center gap-2 text-base font-semibold text-gray-700 bg-white border border-gray-200 px-8 py-3.5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 hover:scale-105 transition-all duration-200"
          >
            Already have an account? Log in
          </Link>
        </motion.div>
      </div>

      {/* app preview */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-16 w-full max-w-4xl mx-auto px-6"
      >
        <HeroDashboardPreview />
      </motion.div>
    </section>
  )
}

function HeroDashboardPreview() {
  const tasks = [
    { title: 'Design system audit', priority: 'High', status: 'In Progress', assignee: 'A' },
    { title: 'API integration tests', priority: 'Medium', status: 'Todo', assignee: 'B' },
    { title: 'Auth flow refactor', priority: 'High', status: 'Done', assignee: 'C' },
    { title: 'Deploy to production', priority: 'Low', status: 'Todo', assignee: 'D' },
  ]
  const statusColor = {
    'In Progress': 'bg-amber-100 text-amber-700',
    Todo: 'bg-slate-100 text-slate-600',
    Done: 'bg-emerald-100 text-emerald-700',
  }
  const priorityDot = { High: 'bg-red-400', Medium: 'bg-amber-400', Low: 'bg-emerald-400' }
  const avatarColor = {
    A: 'from-indigo-400 to-violet-500',
    B: 'from-pink-400 to-rose-500',
    C: 'from-emerald-400 to-teal-500',
    D: 'from-amber-400 to-orange-500',
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-100/60 border border-gray-100 overflow-hidden">
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/80">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-gray-400 font-mono">taskflow.app/dashboard</span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden md:flex flex-col gap-2 w-44 p-4 border-r border-gray-100 bg-slate-50/50">
          {['Dashboard', 'My Tasks', 'Analytics', 'Team', 'Settings'].map((item, i) => (
            <div
              key={item}
              className={`text-xs font-medium px-3 py-2 rounded-lg ${
                i === 0
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* main */}
        <div className="flex-1 p-5 space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total Tasks', value: '42', color: 'text-indigo-600' },
              { label: 'In Progress', value: '12', color: 'text-amber-600' },
              { label: 'Completed', value: '28', color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
          {tasks.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[t.priority]}`} />
              <span className="flex-1 text-xs font-medium text-gray-700 truncate">{t.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>
                {t.status}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarColor[t.assignee]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
              >
                {t.assignee}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── what is it section ─── */
function WhatIsSection() {
  const points = [
    {
      icon: '📋',
      title: 'Create & assign tasks',
      desc: 'Add tasks with a title, priority, and status. Assign them to yourself or your team.',
    },
    {
      icon: '📊',
      title: 'Track progress visually',
      desc: 'Watch tasks move from Todo → In Progress → Done. Analytics show you where things stand.',
    },
    {
      icon: '🔒',
      title: 'Secure & role-aware',
      desc: 'Every account is protected by JWT. Admins manage users; members manage tasks.',
    },
  ]

  return (
    <section id="what-is" className="py-24 px-6 md:px-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <RevealSection className="text-center mb-14">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">What is TaskFlow?</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Your team's single source of truth
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            TaskFlow is a web application where you log in, create tasks, track their progress, and
            manage your team — all in one place. No spreadsheets, no sticky notes, no chaos.
          </p>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p) => (
            <RevealSection key={p.title}>
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-violet-50/40 border border-indigo-100/50">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── how it works ─── */
function HowItWorksSection() {
  const steps = [
    {
      step: '1',
      title: 'Create your account',
      desc: 'Register with your email and a password. Takes 30 seconds. You get a personal dashboard immediately — no setup wizard, no onboarding email chain.',
      action: { label: 'Create account →', to: '/register' },
      color: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      step: '2',
      title: 'Add and manage your tasks',
      desc: 'Hit "+ New Task" to add anything on your plate. Set a priority (Low / Medium / High) and a status (Todo / In Progress / Done). Filter, search, and sort as you go.',
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      step: '3',
      title: 'Track progress & manage your team',
      desc: "Your dashboard shows live counts — how many tasks are done, how many are pending. If you're an admin, you also see all users, promote teammates, and view platform-wide analytics.",
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ]

  return (
    <section id="how-it-works" className="py-28 px-6 md:px-16 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white">
      <div className="max-w-6xl mx-auto">
        <RevealSection className="text-center mb-16">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">How it works</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Three simple steps — from zero to a fully working task board.
          </p>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-purple-200" />

          {steps.map((s) => (
            <RevealSection key={s.step}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative bg-white rounded-2xl border ${s.border} p-7 shadow-sm hover:shadow-lg hover:shadow-indigo-50/80 transition-all duration-300 h-full flex flex-col`}
              >
                {/* step badge */}
                <div className={`w-11 h-11 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center text-white text-lg font-extrabold shadow-md mb-5 flex-shrink-0`}>
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{s.desc}</p>
                {s.action && (
                  <Link
                    to={s.action.to}
                    className={`mt-6 inline-flex items-center text-sm font-semibold text-white bg-gradient-to-r ${s.color} px-5 py-2.5 rounded-xl shadow-sm hover:scale-105 transition-transform duration-200 self-start`}
                  >
                    {s.action.label}
                  </Link>
                )}
              </motion.div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── features ─── */
const features = [
  {
    icon: '🔐',
    title: 'JWT Authentication',
    desc: 'Sign in with your email and password. Sessions are secured with JSON Web Tokens — your data stays yours.',
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: '✅',
    title: 'Task Management',
    desc: 'Create tasks, set priorities, update statuses, and filter your board. Everything you need to stay organized.',
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: '⚡',
    title: 'Admin Dashboard',
    desc: 'Admins get a dedicated panel to manage users, promote roles, and view platform-wide task data.',
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: '📈',
    title: 'Analytics & Charts',
    desc: 'Visual charts show task completion trends, priority distribution, and team productivity at a glance.',
    gradient: 'from-fuchsia-500 to-fuchsia-600',
    bg: 'bg-fuchsia-50',
  },
  {
    icon: '🛡️',
    title: 'Role-Based Access',
    desc: 'Two roles — Admin and Member. Admins control the platform; members manage their own tasks.',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: '📱',
    title: 'Works on Any Device',
    desc: 'Fully responsive — use TaskFlow on your laptop, tablet, or phone. The layout adjusts automatically.',
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6 md:px-16 bg-white">
      <RevealSection className="text-center mb-16">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Features</span>
        <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          What's inside TaskFlow
        </h2>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Everything built in. No plugins, no integrations, no extra cost.
        </p>
      </RevealSection>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((f) => (
          <RevealSection key={f.title}>
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group relative bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 cursor-default overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-violet-50/0 group-hover:from-indigo-50/60 group-hover:to-violet-50/40 transition-all duration-300 rounded-2xl" />
              <div className={`relative w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm`}>
                {f.icon}
              </div>
              <h3 className="relative text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="relative text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${f.gradient} transition-all duration-500 rounded-b-2xl`} />
            </motion.div>
          </RevealSection>
        ))}
      </div>
    </section>
  )
}

/* ─── dashboard preview ─── */
function DashboardPreviewSection() {
  return (
    <section className="py-28 px-6 md:px-16 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <RevealSection className="text-center mb-16">
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Inside the app</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            A dashboard that tells the whole story
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Log in and you'll see this — live task counts, your week's progress, and your team's
            workload, all without digging through menus.
          </p>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-5">
          <RevealSection className="md:col-span-2">
            <AnalyticsCard />
          </RevealSection>
          <RevealSection>
            <div className="flex flex-col gap-5 h-full">
              <QuickStatsCard />
              <AdminPreviewCard />
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  )
}

function AnalyticsCard() {
  const bars = [65, 80, 45, 92, 58, 74, 88]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-indigo-50/80 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900">Task Completion</h3>
          <p className="text-xs text-gray-400 mt-0.5">Weekly performance</p>
        </div>
        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-semibold">
          +18% this week
        </span>
      </div>
      <div className="flex items-end gap-3 h-32">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
            style={{ originY: 1, height: `${h}%` }}
            viewport={{ once: true }}
            className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {days.map((d) => (
          <span key={d} className="flex-1 text-center text-xs text-gray-400">{d}</span>
        ))}
      </div>
    </div>
  )
}

function QuickStatsCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200/60">
      <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-3">Your Stats</p>
      <div className="space-y-3">
        {[
          { label: 'Active Tasks', value: '24', icon: '📋' },
          { label: 'Team Members', value: '8', icon: '👥' },
          { label: 'Done Today', value: '11', icon: '✅' },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-sm text-indigo-100 flex items-center gap-2">
              <span>{s.icon}</span>{s.label}
            </span>
            <span className="text-base font-bold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPreviewCard() {
  const users = [
    { name: 'Alex M.', role: 'Admin', color: 'from-indigo-400 to-violet-500' },
    { name: 'Sara K.', role: 'Member', color: 'from-pink-400 to-rose-500' },
    { name: 'James T.', role: 'Member', color: 'from-emerald-400 to-teal-500' },
  ]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-indigo-50/80 p-5 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm">Team Members</h3>
        <span className="text-xs text-indigo-500 font-medium">Admin view</span>
      </div>
      <div className="space-y-2.5">
        {users.map((u) => (
          <div key={u.name} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {u.name[0]}
            </div>
            <span className="text-xs text-gray-700 flex-1 font-medium">{u.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              u.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── ready to try section (replaces aggressive CTA) ─── */
function ReadySection() {
  return (
    <section className="py-28 px-6 md:px-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <RevealSection>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Ready to try it?</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              You've seen what it does.<br />Now use it.
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">
              Create a free account and get your dashboard in under a minute. Already signed up?
              Just log in — your tasks are waiting.
            </p>

            {/* two clear paths */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-400 hover:scale-105 transition-all duration-200"
              >
                Create a free account
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-7 py-3.5 rounded-xl hover:bg-indigo-100 hover:scale-105 transition-all duration-200"
              >
                Log in →
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-400">No payment info needed. Free to use.</p>
          </RevealSection>

          {/* what you get list */}
          <RevealSection>
            <div className="space-y-4">
              {[
                { icon: '✅', text: 'A personal task dashboard — ready the moment you sign up' },
                { icon: '🔐', text: 'Secure login with JWT — your data is yours, always' },
                { icon: '📊', text: 'Analytics that show your progress without any setup' },
                { icon: '👥', text: 'Admin tools if you need to manage a team' },
                { icon: '📱', text: 'Works on desktop, tablet, and phone — no app to install' },
                { icon: '🚀', text: 'No tutorial needed — the UI is simple enough to figure out' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-200">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  )
}

/* ─── footer ─── */
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-14 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-10">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <span className="text-base font-bold text-white">TaskFlow</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              A task management platform built for modern teams. Track work, manage people, ship faster.
            </p>
          </div>

          {/* quick links */}
          <div className="flex flex-wrap gap-x-10 gap-y-6">
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-3">App</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Log in', to: '/login' },
                  { label: 'Create account', to: '/register' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-3">Learn</h4>
              <ul className="space-y-2">
                {['How it works', 'Features', 'Dashboard preview'].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-3">Legal</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">© 2026 TaskFlow. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {['Twitter', 'GitHub', 'LinkedIn'].map((s) => (
              <span key={s} className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── page composition ─── */
export default function LandingPage() {
  return (
    <div className="font-sans antialiased">
      <Navbar />
      <Hero />
      <WhatIsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <DashboardPreviewSection />
      <ReadySection />
      <Footer />
    </div>
  )
}
