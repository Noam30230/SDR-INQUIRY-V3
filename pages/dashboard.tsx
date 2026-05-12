import { useEffect, useState, useCallback, useRef } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { supabaseBrowser } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import AppNav from '@/components/layout/AppNav'

const TIER_COLORS: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#f97316', DQ: '#ef4444',
}
const FUNDING_COLORS = ['#7c3aed', '#a78bfa', '#10b981', '#f59e0b', '#6b7280']
const MARGIN = 12
const HEADER_H = 57
// Bump this when DEFAULT_LAYOUT changes to automatically clear stale/broken saved layouts
const LAYOUT_VERSION = 'v5'

// 4-row layout: KPIs | Tier Breakdown | Activity+Techs | Users+Funding
// Every row fills all 12 columns → vertical compaction can never reorder anything
const DEFAULT_LAYOUT = [
  { i: 'total',    x: 0, y:  0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'dqrate',   x: 4, y:  0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'avg',      x: 8, y:  0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'tiers',    x: 0, y:  3, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'activity', x: 0, y:  5, w: 7,  h: 5, minW: 4, minH: 3 },
  { i: 'techs',    x: 7, y:  5, w: 5,  h: 5, minW: 3, minH: 3 },
  { i: 'users',    x: 0, y: 10, w: 6,  h: 4, minW: 3, minH: 3 },
  { i: 'funding',  x: 6, y: 10, w: 6,  h: 4, minW: 3, minH: 3 },
]
// numRows = 14  →  rowHeight = (availH - 15*MARGIN) / 14

const ALL_WIDGETS = [
  { id: 'total',    label: 'Total scored' },
  { id: 'avg',      label: 'Average score' },
  { id: 'dqrate',   label: 'DQ rate' },
  { id: 'tiers',    label: 'Tier breakdown' },
  { id: 'activity', label: 'Activity (14 days)' },
  { id: 'techs',    label: 'Top cloud providers' },
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
  padding: '14px 16px',
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
  color: 'white',
  marginBottom: 10,
  flexShrink: 0,
}

function dqRateColor(rate: number): string {
  if (rate < 8) return '#10b981'
  if (rate <= 15) return '#f97316'
  return '#ef4444'
}
function avgScoreColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 60) return '#a78bfa'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function BigNumber({ value, suffix = '', color = 'white', pixelH = 120 }: {
  value: string | number; suffix?: string; color?: string; pixelH?: number
}) {
  // Cap at 56px so numbers never overflow the card
  const fontSize = Math.min(56, Math.max(22, (pixelH - 50) * 0.36))
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
      <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
        {value}<span style={{ fontSize: fontSize * 0.42, opacity: 0.6 }}>{suffix}</span>
      </span>
    </div>
  )
}

// Load saved layout — clears corrupted/old-version layouts automatically
function loadSavedLayout(): typeof DEFAULT_LAYOUT {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  try {
    // Version mismatch → wipe old layout so user gets the clean default
    if (localStorage.getItem('inquiry_layout_version') !== LAYOUT_VERSION) {
      localStorage.removeItem('inquiry_dashboard_layout')
      localStorage.setItem('inquiry_layout_version', LAYOUT_VERSION)
      return DEFAULT_LAYOUT
    }
    const saved = localStorage.getItem('inquiry_dashboard_layout')
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_LAYOUT
}

function loadSavedWidgets(): Set<string> {
  if (typeof window === 'undefined') return new Set(ALL_WIDGETS.map(w => w.id))
  try {
    const saved = localStorage.getItem('inquiry_dashboard_widgets')
    if (saved) return new Set<string>(JSON.parse(saved))
  } catch {}
  return new Set(ALL_WIDGETS.map(w => w.id))
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  // Lazy initializers: read localStorage on first render (before GridLayout fires onLayoutChange)
  const [layout, setLayout] = useState<typeof DEFAULT_LAYOUT>(loadSavedLayout)
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(loadSavedWidgets)
  const [showWidgetMenu, setShowWidgetMenu] = useState(false)
  const [containerWidth, setContainerWidth] = useState(900)
  const [rowHeight, setRowHeight] = useState(60)
  const gridRef = useRef<HTMLDivElement>(null)
  // Tracks the current layout without creating reactive deps (avoids feedback loop on drag)
  const layoutRef = useRef<typeof DEFAULT_LAYOUT>(layout)

  // visibleWidgetsRef lets calcRowHeight always read the latest set without stale closure
  const visibleWidgetsRef = useRef(visibleWidgets)
  useEffect(() => { visibleWidgetsRef.current = visibleWidgets }, [visibleWidgets])

  // Measure grid container directly (no hardcoded HEADER_H, no window formula)
  const calcRowHeight = useCallback(() => {
    const el = gridRef.current
    if (!el || el.clientHeight === 0) return
    setContainerWidth(el.offsetWidth)
    const availH = el.clientHeight - MARGIN * 2          // actual inner height
    const widgets = visibleWidgetsRef.current
    const visibleItems = layoutRef.current.filter(l => widgets.has(l.i))
    const numRows = visibleItems.length ? Math.max(...visibleItems.map(l => l.y + l.h)) : 8
    const rh = Math.max(36, (availH - (numRows + 1) * MARGIN) / numRows)
    setRowHeight(rh)
  }, [])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    calcRowHeight()                                        // immediate (layout already resolved)
    const raf = requestAnimationFrame(() => calcRowHeight()) // backup after next paint
    const ro = new ResizeObserver(() => calcRowHeight())   // ongoing: window resize etc.
    ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [calcRowHeight, visibleWidgets])

  const fetchStats = useCallback(async () => {
    try {
      const cached = localStorage.getItem('inquiry_stats_cache')
      if (cached) { setStats(JSON.parse(cached)); setLoading(false) }
    } catch {}
    try {
      const token = await getToken()
      const res = await fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        localStorage.setItem('inquiry_stats_cache', JSON.stringify(data))
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Only called after an explicit user drag or resize — safe to persist
  function persistLayout(newLayout: typeof DEFAULT_LAYOUT) {
    localStorage.setItem('inquiry_dashboard_layout', JSON.stringify(newLayout))
    localStorage.setItem('inquiry_layout_version', LAYOUT_VERSION)
  }

  // Only updates visual state — never touches localStorage
  // (prevents mount-time compaction from overwriting the saved layout)
  function handleLayoutChange(newLayout: typeof DEFAULT_LAYOUT) {
    layoutRef.current = newLayout
    setLayout(newLayout)
  }

  function toggleWidget(id: string) {
    setVisibleWidgets(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        setLayout(prevLayout => {
          if (!prevLayout.find(l => l.i === id)) {
            const def = DEFAULT_LAYOUT.find(l => l.i === id)
            if (def) {
              const updated = [...prevLayout, def]
              layoutRef.current = updated  // keep ref in sync so calcRowHeight sees new item
              return updated
            }
          }
          return prevLayout
        })
      }
      localStorage.setItem('inquiry_dashboard_widgets', JSON.stringify([...next]))
      return next
    })
  }

  function resetLayout() {
    layoutRef.current = DEFAULT_LAYOUT
    setLayout(DEFAULT_LAYOUT)
    const all = new Set(ALL_WIDGETS.map(w => w.id))
    setVisibleWidgets(all)
    localStorage.removeItem('inquiry_dashboard_layout')
    localStorage.removeItem('inquiry_dashboard_widgets')
    localStorage.setItem('inquiry_layout_version', LAYOUT_VERSION)
    requestAnimationFrame(() => calcRowHeight())
  }

  const tierData = stats ? Object.entries(stats.tiers).map(([name, value]) => ({ name, value })) : []
  const visibleLayout = layout.filter(l => visibleWidgets.has(l.i))

  function renderWidget(id: string) {
    const layoutItem = visibleLayout.find(l => l.i === id)
    const h = layoutItem?.h ?? 2
    const pixelH = h * rowHeight + (h - 1) * MARGIN

    const spinner = (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
      </div>
    )

    switch (id) {
      case 'total':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Total scored</div>
            {!stats ? spinner : <BigNumber value={stats.total} color="#a78bfa" pixelH={pixelH} />}
          </div>
        )
      case 'avg':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Average score</div>
            {!stats ? spinner : <BigNumber value={stats.avgScore} suffix="/100" color={avgScoreColor(stats.avgScore)} pixelH={pixelH} />}
          </div>
        )
      case 'dqrate':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>DQ rate</div>
            {!stats ? spinner : <BigNumber value={stats.dqRate} suffix="%" color={dqRateColor(stats.dqRate)} pixelH={pixelH} />}
          </div>
        )
      case 'tiers': {
        // Cap tier font so it never overflows the card height
        const tierFontSize = Math.min(42, Math.max(14, (pixelH - 50) * 0.28))
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Tier breakdown</div>
            {!stats ? spinner : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 8, minHeight: 0, overflow: 'hidden' }}>
                {tierData.map(({ name, value }) => (
                  <div key={name} style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    borderRadius: 10, overflow: 'hidden',
                    background: `${TIER_COLORS[name]}10`,
                    border: `1px solid ${TIER_COLORS[name]}25`,
                  }}>
                    <span style={{ fontSize: tierFontSize, fontWeight: 700, color: TIER_COLORS[name], lineHeight: 1 }}>{value}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
      case 'activity':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Activity — last 14 days</div>
            {!stats ? spinner : (
              <div style={{ flex: 1, minHeight: 0 }}>
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
            )}
          </div>
        )
      case 'techs': {
        const maxCount = stats ? Math.max(...stats.topTechs.map(t => t.count), 1) : 1
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Top cloud providers</div>
            {!stats ? spinner : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.topTechs.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 16 }}>No data yet</p>
                  : stats.topTechs.map(({ name, count }) => {
                      const pct = Math.round((count / maxCount) * 100)
                      return (
                        <div key={name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}>
                            <div style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg,#6d28d9,#7c3aed)', width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            )}
          </div>
        )
      }
      case 'users':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Top users</div>
            {!stats ? spinner : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stats.topUsers.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 16 }}>No data yet</p>
                  : stats.topUsers.map(({ name }, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: i < stats.topUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: i === 0 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${i === 0 ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          color: i === 0 ? '#a78bfa' : 'var(--text-muted)',
                        }}>
                          {name[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'white' : 'rgba(255,255,255,0.7)' }}>
                          {name}
                        </span>
                      </div>
                    ))
                }
              </div>
            )}
          </div>
        )
      case 'funding':
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Funding detected</div>
            {!stats ? spinner : stats.fundingData.length === 0
              ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No funding data yet</p>
                </div>
              : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 16, minHeight: 0, overflow: 'hidden' }}>
                  {/* Pie chart — centered vertically in its wrapper */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <PieChart width={100} height={100}>
                      <Pie data={stats.fundingData} cx={45} cy={45} innerRadius={26} outerRadius={44} dataKey="count" paddingAngle={3}>
                        {stats.fundingData.map((_, idx) => (
                          <Cell key={idx} fill={FUNDING_COLORS[idx % FUNDING_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                  {/* Scrollable legend — takes full height so overflow-y works */}
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stats.fundingData.map(({ name, count }, idx) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: FUNDING_COLORS[idx % FUNDING_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{name}</span>
                        <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div>
        )
      default:
        return null
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <AppNav />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 shrink-0" style={{ height: HEADER_H, borderBottom: '1px solid var(--border)' }}>
            <div>
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Loading…' : `${stats?.total ?? 0} accounts scored`}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                >
                  + Widgets
                </button>
                {showWidgetMenu && (
                  <div className="absolute right-0 top-full mt-1 rounded-xl py-1.5 z-50 min-w-[180px]"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {ALL_WIDGETS.map(w => (
                      <button key={w.id} onClick={() => toggleWidget(w.id)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors hover:bg-white/5"
                        style={{ color: visibleWidgets.has(w.id) ? 'white' : 'var(--text-muted)' }}>
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

          {/* Grid — scrollable so extended widgets don't get cut */}
          <div ref={gridRef} className="flex-1 overflow-y-auto" style={{ padding: MARGIN }}>
            <GridLayout
              className="layout"
              layout={visibleLayout}
              cols={12}
              rowHeight={rowHeight}
              width={containerWidth - MARGIN * 2}
              onLayoutChange={handleLayoutChange}
              onResizeStop={(newLayout) => { persistLayout(newLayout as typeof DEFAULT_LAYOUT); calcRowHeight() }}
              onDragStop={(newLayout) => { persistLayout(newLayout as typeof DEFAULT_LAYOUT); calcRowHeight() }}
              draggableHandle=".drag-handle"
              margin={[MARGIN, MARGIN]}
              containerPadding={[MARGIN, MARGIN]}
              compactType={null}
              preventCollision={true}
            >
              {visibleLayout.map(item => (
                <div key={item.i} style={{ cursor: 'default' }}>
                  <div className="drag-handle"
                    style={{ position: 'absolute', top: 8, right: 10, cursor: 'grab', padding: '4px 6px', borderRadius: 6, zIndex: 10 }}
                    title="Drag">
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
