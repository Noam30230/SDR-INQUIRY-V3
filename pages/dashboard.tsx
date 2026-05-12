import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import AuthGuard from '@/components/layout/AuthGuard'
import { supabaseBrowser } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const InquiryLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="28" width="36" height="8" rx="3.6" fill="#7c3aed" />
    <circle cx="52" cy="32" r="4.2" fill="#7c3aed" />
  </svg>
)

const TIER_COLORS: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444',
}
const FUNDING_COLORS = ['#7c3aed', '#a78bfa', '#10b981', '#f59e0b', '#6b7280']

const DEFAULT_LAYOUT = [
  { i: 'total',    x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'avg',      x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'dqrate',   x: 4, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'tiers',    x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
  { i: 'activity', x: 0, y: 2, w: 7, h: 4, minW: 4, minH: 3 },
  { i: 'techs',    x: 7, y: 2, w: 5, h: 4, minW: 4, minH: 3 },
  { i: 'users',    x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'funding',  x: 4, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
]

const ALL_WIDGETS = [
  { id: 'total',    label: 'Total scored' },
  { id: 'avg',      label: 'Average score' },
  { id: 'dqrate',   label: 'DQ rate' },
  { id: 'tiers',    label: 'Tier breakdown' },
  { id: 'activity', label: 'Activity (14 days)' },
  { id: 'techs',    label: 'Top technologies' },
  { id: 'users',    label: 'Top users' },
  { id: 'funding',  label: 'Funding detected' },
]

interface Stats {
  total: number
  tiers: Record<string, number>
  avgScore: number
  dqRate: number
  topTechs: { name: string; count: number }[]
  activityData: { date: string; count: number }[]
  topUsers: { name: string; count: number; pct: number }[]
  fundingData: { name: string; count: number }[]
}

async function getToken(): Promise<string> {
  const { data } = await supabaseBrowser.auth.getSession()
  return data.session?.access_token || ''
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '16px 18px',
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 8,
}

function BigNumber({ value, suffix = '', color = 'white', h = 2 }: { value: string | number; suffix?: string; color?: string; h?: number }) {
  const fontSize = Math.max(24, Math.min(72, h * 22))
  return (
    <div className="flex-1 flex items-center justify-center">
      <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: fontSize * 0.5, opacity: 0.6 }}>{suffix}</span>
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(new Set(ALL_WIDGETS.map(w => w.id)))
  const [showWidgetMenu, setShowWidgetMenu] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const updateWidth = () => {
      const el = document.getElementById('dashboard-grid')
      if (el) setContainerWidth(el.offsetWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Load saved layout
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inquiry_dashboard_layout')
      if (saved) setLayout(JSON.parse(saved))
      const savedWidgets = localStorage.getItem('inquiry_dashboard_widgets')
      if (savedWidgets) setVisibleWidgets(new Set(JSON.parse(savedWidgets)))
    } catch {}
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  function handleLayoutChange(newLayout: typeof DEFAULT_LAYOUT) {
    setLayout(newLayout)
    localStorage.setItem('inquiry_dashboard_layout', JSON.stringify(newLayout))
  }

  function toggleWidget(id: string) {
    setVisibleWidgets(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // Restore layout item from DEFAULT_LAYOUT if it was removed
        setLayout(prevLayout => {
          if (!prevLayout.find(l => l.i === id)) {
            const defaultItem = DEFAULT_LAYOUT.find(l => l.i === id)
            if (defaultItem) return [...prevLayout, defaultItem]
          }
          return prevLayout
        })
      }
      localStorage.setItem('inquiry_dashboard_widgets', JSON.stringify([...next]))
      return next
    })
  }

  function resetLayout() {
    setLayout(DEFAULT_LAYOUT)
    setVisibleWidgets(new Set(ALL_WIDGETS.map(w => w.id)))
    localStorage.removeItem('inquiry_dashboard_layout')
    localStorage.removeItem('inquiry_dashboard_widgets')
  }

  const tierData = stats ? Object.entries(stats.tiers).map(([name, value]) => ({ name, value })) : []

  function renderWidget(id: string) {
    const layoutItem = visibleLayout.find(l => l.i === id)
    const h = layoutItem?.h ?? 2

    if (!stats) return <div style={cardStyle}><div style={labelStyle}>{id}</div><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} /></div></div>

    switch (id) {
      case 'total':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Total scored</div>
            <BigNumber value={stats.total} color="#a78bfa" h={h} />
          </div>
        )
      case 'avg':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Average score</div>
            <BigNumber value={stats.avgScore} suffix="/100" color="#10b981" h={h} />
          </div>
        )
      case 'dqrate':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>DQ rate</div>
            <BigNumber value={stats.dqRate} suffix="%" color="#ef4444" h={h} />
          </div>
        )
      case 'tiers': {
        const tierFontSize = Math.max(18, Math.min(40, h * 14))
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Tier breakdown</div>
            <div className="flex-1 flex items-stretch gap-2 min-h-0">
              {tierData.map(({ name, value }) => (
                <div key={name} className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl overflow-hidden"
                  style={{ background: `${TIER_COLORS[name]}10`, border: `1px solid ${TIER_COLORS[name]}25` }}>
                  <span style={{ fontSize: tierFontSize, fontWeight: 700, color: TIER_COLORS[name], lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'activity':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Activity — last 14 days</div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.activityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'white' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a78bfa' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      case 'techs':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Top technologies</div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topTechs} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'white' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      case 'users':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Top users</div>
            <div className="flex-1 flex flex-col justify-center gap-3">
              {stats.topUsers.map(({ name, pct }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                    {name[0]}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{name}</span>
                    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: i === 0 ? '#7c3aed' : 'rgba(124,58,237,0.4)' }} />
                    </div>
                  </div>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No data yet</p>
              )}
            </div>
          </div>
        )
      case 'funding':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Funding detected</div>
            {stats.fundingData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No funding data yet</p>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={stats.fundingData} cx={55} cy={55} innerRadius={32} outerRadius={52} dataKey="count" paddingAngle={3}>
                    {stats.fundingData.map((_, idx) => (
                      <Cell key={idx} fill={FUNDING_COLORS[idx % FUNDING_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-1.5 flex-1">
                  {stats.fundingData.map(({ name, count }, idx) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: FUNDING_COLORS[idx % FUNDING_COLORS.length] }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{name}</span>
                      <span style={{ fontSize: 12, color: 'white', marginLeft: 'auto', fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const visibleLayout = layout.filter(l => visibleWidgets.has(l.i))

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {/* Sidebar minimal */}
        <aside style={{ width: 56, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 8 }}>
          <div style={{ marginBottom: 8 }}><InquiryLogo size={28} /></div>
          <button
            onClick={() => router.push('/scoring')}
            title="Scoring"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
          </button>
          <button
            title="Dashboard"
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="7" height="8" rx="1"/><rect x="13" y="3" width="9" height="5" rx="1"/>
              <rect x="13" y="12" width="9" height="9" rx="1"/><rect x="2" y="15" width="7" height="6" rx="1"/>
            </svg>
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Loading…' : `${stats?.total ?? 0} accounts scored in total`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetLayout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                Reset layout
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowWidgetMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                >
                  + Widgets
                </button>
                {showWidgetMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-xl py-1.5 z-50 min-w-[180px]"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  >
                    {ALL_WIDGETS.map(w => (
                      <button
                        key={w.id}
                        onClick={() => toggleWidget(w.id)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-white/5"
                        style={{ color: visibleWidgets.has(w.id) ? 'white' : 'var(--text-muted)' }}
                      >
                        <span className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                          style={{ background: visibleWidgets.has(w.id) ? 'rgba(124,58,237,0.4)' : 'transparent', border: `1px solid ${visibleWidgets.has(w.id) ? 'rgba(124,58,237,0.7)' : 'var(--border)'}` }}>
                          {visibleWidgets.has(w.id) && <span style={{ fontSize: 8, color: '#a78bfa' }}>✓</span>}
                        </span>
                        {w.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto p-4" id="dashboard-grid">
            <GridLayout
              className="layout"
              layout={visibleLayout}
              cols={12}
              rowHeight={60}
              width={containerWidth - 32}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              margin={[12, 12]}
              compactType="vertical"
              preventCollision={false}
            >
              {visibleLayout.map(item => (
                <div key={item.i} style={{ cursor: 'default' }}>
                  <div className="drag-handle" style={{ position: 'absolute', top: 8, right: 36, cursor: 'grab', padding: '4px 6px', borderRadius: 6, zIndex: 10 }}
                    title="Drag to move">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      {[0,3,6].map(y => [0,3,6].map(x => (
                        <circle key={`${x}-${y}`} cx={x+1} cy={y+1} r="0.8" fill="#4b5563" />
                      )))}
                    </svg>
                  </div>
                  {renderWidget(item.i)}
                </div>
              ))}
            </GridLayout>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
