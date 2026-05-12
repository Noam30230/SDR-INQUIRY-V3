import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'

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

function getDisplayName(email: string): string {
  if (!email) return ''
  const local = email.split('@')[0]
  const first = local.split('.')[0]
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export default function AppNav() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email || '')
    })
  }, [])

  const displayName = getDisplayName(email)
  const initial = displayName ? displayName[0].toUpperCase() : '?'

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
                background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                color: active ? '#a78bfa' : 'var(--text-muted)',
                border: 'none',
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

      {/* Profile at bottom */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(124,58,237,0.18)',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#a78bfa',
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
