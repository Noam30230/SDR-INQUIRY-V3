import { useEffect, useState, useCallback, useRef } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { supabaseBrowser } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import AppNav from '@/components/layout/AppNav'

const TIER_COLORS: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#f97316', DQ: '#ef4444',
}
const FUNDING_COLORS = ['#7c3aed', '#a78bfa', '#10b981', '#f59e0b', '#6b7280']
const GAP = 12
const HEADER_H = 57

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

function BigNumber({ value, suffix = '', color = 'white' }: {
  value: string | number; suffix?: string; color?: string
}) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
      <span style={{ fontSize: 'clamp(22px, 3.5vh, 56px)', fontWeight: 700, color, lineHeight: 1, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
        {value}<span style={{ fontSize: 'clamp(10px, 1.5vh, 24px)', opacity: 0.6 }}>{suffix}</span>
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  // Ref so fetchStats always uses the current user's cache key without needing it as a dep
  const userIdRef = useRef('')

  const fetchStats = useCallback(async () => {
    const cacheKey = `inquiry_stats_cache_${userIdRef.current}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setStats(JSON.parse(cached)); setLoading(false) }
    } catch {}
    try {
      const token = await getToken()
      const res = await fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Get session first so the cache key is scoped to the right user before any read
    supabaseBrowser.auth.getSession().then(({ data }) => {
      userIdRef.current = data.session?.user?.id || ''
      fetchStats()
    })
  }, [fetchStats])

  const tierData = stats ? Object.entries(stats.tiers).map(([name, value]) => ({ name, value })) : []

  const spinner = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <AppNav />
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center px-6 shrink-0" style={{ height: HEADER_H, borderBottom: '1px solid var(--border)' }}>
            <div>
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Loading…' : `${stats?.total ?? 0} accounts scored`}
              </p>
            </div>
          </div>

          {/* Fixed 100% CSS grid — fr units fill available height exactly */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: '3fr 3fr 5fr 4fr',
            gap: GAP,
            padding: GAP,
            boxSizing: 'border-box',
          }}>

            {/* Row 1 — KPIs */}
            <div style={{ gridColumn: 'span 4', minHeight: 0 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>Total scored</div>
                {!stats ? spinner : <BigNumber value={stats.total} color="#a78bfa" />}
              </div>
            </div>
            <div style={{ gridColumn: 'span 4', minHeight: 0 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>DQ rate</div>
                {!stats ? spinner : <BigNumber value={stats.dqRate} suffix="%" color={dqRateColor(stats.dqRate)} />}
              </div>
            </div>
            <div style={{ gridColumn: 'span 4', minHeight: 0 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>Average score</div>
                {!stats ? spinner : <BigNumber value={stats.avgScore} suffix="/100" color={avgScoreColor(stats.avgScore)} />}
              </div>
            </div>

            {/* Row 2 — Tier breakdown */}
            <div style={{ gridColumn: 'span 12', minHeight: 0 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>Tier breakdown</div>
                {!stats ? spinner : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 8, minHeight: 0 }}>
                    {tierData.map(({ name, value }) => (
                      <div key={name} style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        borderRadius: 10,
                        background: `${TIER_COLORS[name]}10`,
                        border: `1px solid ${TIER_COLORS[name]}25`,
                      }}>
                        <span style={{ fontSize: 'clamp(14px, 2.5vh, 42px)', fontWeight: 700, color: TIER_COLORS[name], lineHeight: 1 }}>{value}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3 — Activity + Cloud */}
            <div style={{ gridColumn: 'span 7', minHeight: 0 }}>
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
            </div>
            <div style={{ gridColumn: 'span 5', minHeight: 0 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>Top cloud providers</div>
                {!stats ? spinner : (() => {
                  const maxCount = Math.max(...stats.topTechs.map(t => t.count), 1)
                  return (
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
                  )
                })()}
              </div>
            </div>

            {/* Row 4 — Top users + Funding */}
            <div style={{ gridColumn: 'span 6', minHeight: 0 }}>
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
            </div>
            <div style={{ gridColumn: 'span 6', minHeight: 0 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>Funding detected</div>
                {!stats ? spinner : stats.fundingData.length === 0
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No funding data yet</p>
                    </div>
                  : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 16, minHeight: 0, overflow: 'hidden' }}>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <PieChart width={100} height={100}>
                          <Pie data={stats.fundingData} cx={45} cy={45} innerRadius={26} outerRadius={44} dataKey="count" paddingAngle={3}>
                            {stats.fundingData.map((_, idx) => (
                              <Cell key={idx} fill={FUNDING_COLORS[idx % FUNDING_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </div>
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
            </div>

          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
