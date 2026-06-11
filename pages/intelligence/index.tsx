import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AuthGuard from '@/components/layout/AuthGuard'
import AppNav from '@/components/layout/AppNav'
import { supabaseBrowser } from '@/lib/supabase'
import type { Account, Tier } from '@/types'
import type { DealData } from '@/lib/account-intelligence/types'
import { STAGE_LABELS } from '@/lib/account-intelligence/types'

const TIER_COLORS: Record<Tier, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#f97316', DQ: '#ef4444',
}

async function getToken(): Promise<string> {
  const { data } = await supabaseBrowser.auth.getSession()
  return data.session?.access_token || ''
}

export default function IntelligencePage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      const token = await getToken()
      const res = await fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const all = await res.json() as Account[]
        setAccounts(
          all.filter(a => a.status === 'done' && a.tier)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        )
      }
      setLoading(false)
    })()
  }, [])

  const filtered = accounts.filter(a =>
    !search.trim() ||
    a.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.domain ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AuthGuard>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
        <AppNav />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
                </svg>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>Account Intelligence</h1>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Open a deal room for any scored account — track stakeholders, log every call, and generate a living intelligence brief that follows the whole sales cycle.
              </p>
            </div>

            {/* How it works */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { title: 'Discovery prep', desc: '3 Whys, stakeholder map, value messaging, and call questions built from real signals' },
                { title: 'Living brief', desc: 'Add cold call notes and meeting transcripts — the brief refines itself, version after version' },
                { title: 'Auto-corrections', desc: 'Heard "Azure" on a call when we detected AWS? The account data fixes itself' },
              ].map(({ title, desc }) => (
                <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search accounts…"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'white', outline: 'none', marginBottom: 14, boxSizing: 'border-box',
              }}
            />

            {/* List */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse" style={{ height: 58, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '56px 32px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 6 }}>
                  {accounts.length === 0 ? 'No scored accounts yet' : 'No match'}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {accounts.length === 0 ? 'Score your first accounts on the Scoring page, then come back here.' : 'Try another search.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(account => {
                  const deal = account.raw_data?.deal as DealData | undefined
                  const hasBrief = !!deal?.brief
                  const tier = account.tier as Tier
                  const meetingCount = deal?.meetings?.length ?? 0
                  return (
                    <button
                      key={account.id}
                      onClick={() => router.push(`/intelligence/${account.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                        borderRadius: 12, background: 'var(--bg-card)', textAlign: 'left',
                        border: `1px solid ${hasBrief ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'border-color 0.12s, background 0.12s', width: '100%',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                    >
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, flexShrink: 0,
                        color: TIER_COLORS[tier], background: `${TIER_COLORS[tier]}18`, border: `1px solid ${TIER_COLORS[tier]}40`,
                      }}>
                        {tier}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {account.company_name}
                        </p>
                        {account.domain && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{account.domain}</p>
                        )}
                      </div>
                      {deal?.stage && deal.stage !== 'cold_call' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a78bfa', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}>
                          {STAGE_LABELS[deal.stage]}
                        </span>
                      )}
                      {meetingCount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {meetingCount} meeting{meetingCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {account.score}
                      </span>
                      <span style={{
                        fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                        ...(hasBrief
                          ? { color: '#a78bfa', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }
                          : { color: 'white', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }),
                      }}>
                        {hasBrief ? 'Open deal room →' : 'Start →'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
