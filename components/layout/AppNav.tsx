import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'
import { PLAN_LABELS } from '@/lib/subscription'
import UpgradeModal from '@/components/ui/UpgradeModal'

interface UsageInfo {
  analysesUsed: number
  analysesLimit: number
  subscriptionStatus: string
  subscriptionPlan: string | null
  trialEndsAt: string | null
}

const InquiryLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="28" width="36" height="8" rx="3.6" fill="#7c3aed" />
    <circle cx="52" cy="32" r="4.2" fill="#7c3aed" />
  </svg>
)

const IconDashboard = ({ active }: { active?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="8" rx="1"/><rect x="13" y="3" width="9" height="5" rx="1"/>
    <rect x="13" y="12" width="9" height="9" rx="1"/><rect x="2" y="15" width="7" height="6" rx="1"/>
  </svg>
)

const IconScoring = ({ active }: { active?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
  </svg>
)

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { path: '/scoring',   label: 'Scoring',   Icon: IconScoring },
]

export default function AppNav() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      setEmail(user?.email || '')

      // Name from user_metadata (always available in JWT)
      const meta = user?.user_metadata || {}
      const first = (meta.first_name || '').trim()
      const last = (meta.last_name || '').trim().toUpperCase()
      if (first || last) setDisplayName(`${first} ${last}`.trim())

      const uid = user?.id
      if (!uid) return
      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('analyses_used, analyses_limit, subscription_status, subscription_plan, trial_ends_at')
        .eq('id', uid)
        .single()
      if (profile) {
        setUsage({
          analysesUsed: profile.analyses_used ?? 0,
          analysesLimit: profile.analyses_limit ?? 30,
          subscriptionStatus: profile.subscription_status ?? 'trial',
          subscriptionPlan: profile.subscription_plan ?? null,
          trialEndsAt: profile.trial_ends_at ?? null,
        })
      }
    })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const nameToShow = displayName || email.split('@')[0]
  const initial = nameToShow ? nameToShow[0].toUpperCase() : '?'

  async function handleBillingPortal() {
    setProfileOpen(false)
    const { data } = await supabaseBrowser.auth.getSession()
    const token = data.session?.access_token || ''
    const res = await fetch('/api/stripe/portal', { headers: { Authorization: `Bearer ${token}` } })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleLogout() {
    // Eagerly clear caches before signing out so the next user sees a blank slate instantly
    const { data } = await supabaseBrowser.auth.getSession()
    const uid = data.session?.user?.id || ''
    try {
      localStorage.removeItem(`inquiry_accounts_cache_${uid}`)
      localStorage.removeItem(`inquiry_stats_cache_${uid}`)
      // Also wipe any legacy generic keys left over from older sessions
      localStorage.removeItem('inquiry_accounts_cache')
      localStorage.removeItem('inquiry_stats_cache')
    } catch {}
    supabaseBrowser.auth.signOut()
    setProfileOpen(false)
  }

  function handleReplayTour() {
    window.dispatchEvent(new CustomEvent('inquiry:replayTour'))
    setProfileOpen(false)
  }

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 20,
        paddingBottom: 0,
      }}
    >
      {/* Logo + brand */}
      <div style={{ padding: '0 16px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <InquiryLogo size={26} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'white', letterSpacing: '-0.01em' }}>Inquiry</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>by</span>
          <a
            href="https://www.linkedin.com/in/noamramillon/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', textDecoration: 'none', transition: 'opacity 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Noam Ramillon
          </a>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active = router.pathname === path
          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                background: active ? 'rgba(124,58,237,0.14)' : 'transparent',
                color: active ? '#c4b5fd' : 'var(--text-muted)',
                border: 'none',
                borderLeft: active ? '3px solid #7c3aed' : '3px solid transparent',
                paddingLeft: active ? 9 : 12,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textAlign: 'left',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Icon active={active} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Usage widget */}
      {usage && (
        <div style={{ margin: '8px 10px', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: usage.subscriptionStatus === 'trial' ? '#fbbf24' : '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {PLAN_LABELS[usage.subscriptionPlan ?? usage.subscriptionStatus] ?? 'Trial'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {usage.analysesUsed}/{usage.analysesLimit}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 2,
              width: `${Math.min(100, (usage.analysesUsed / (usage.analysesLimit || 1)) * 100)}%`,
              background: usage.analysesUsed >= usage.analysesLimit
                ? '#ef4444'
                : usage.subscriptionStatus === 'trial'
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          {/* Upgrade button for trial users or near-limit */}
          {(usage.subscriptionStatus === 'trial' || usage.subscriptionStatus === 'canceled') && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                marginTop: 8, width: '100%', padding: '5px 0',
                borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white', border: 'none', cursor: 'pointer',
                transition: 'opacity 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Upgrade →
            </button>
          )}
        </div>
      )}

      {/* Profile section — clickable, opens dropdown */}
      <div ref={profileRef} style={{ position: 'relative', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        {/* Dropdown (opens upward) */}
        {profileOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 8,
            right: 8,
            marginBottom: 6,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
          }}>
            {usage?.subscriptionStatus === 'active' && (
              <button
                onClick={handleBillingPortal}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 14px',
                  fontSize: 12, color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg> Manage billing
              </button>
            )}
            {router.pathname === '/scoring' && (
              <button
                onClick={handleReplayTour}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 14px',
                  fontSize: 12, color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg> Replay tour
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 14px',
                fontSize: 12, color: 'var(--text-muted)', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg> Log out
            </button>
          </div>
        )}

        {/* Profile row */}
        <button
          onClick={() => setProfileOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(124,58,237,0.18)',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#a78bfa',
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nameToShow || 'User'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={email}>
              {email.length > 22 ? email.slice(0, 19) + '…' : email}
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      </div>
    </aside>

    {showUpgradeModal && (
      <UpgradeModal reason="voluntary" onClose={() => setShowUpgradeModal(false)} />
    )}
  </>
  )
}
