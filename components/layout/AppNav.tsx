import { useRouter } from 'next/router'

const InquiryLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="28" width="36" height="8" rx="3.6" fill="#7c3aed" />
    <circle cx="52" cy="32" r="4.2" fill="#7c3aed" />
  </svg>
)

const IconScoring = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
  </svg>
)

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="8" rx="1"/><rect x="13" y="3" width="9" height="5" rx="1"/>
    <rect x="13" y="12" width="9" height="9" rx="1"/><rect x="2" y="15" width="7" height="6" rx="1"/>
  </svg>
)

const NAV_ITEMS = [
  { path: '/scoring',   label: 'Scoring',   Icon: IconScoring },
  { path: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
]

export default function AppNav() {
  const router = useRouter()

  return (
    <div
      style={{
        width: 56,
        minWidth: 56,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        gap: 4,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 16 }}>
        <InquiryLogo size={28} />
      </div>

      <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0 8px' }} />

      {/* Nav items */}
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        const active = router.pathname === path
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            title={label}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{
              background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: active ? '#a78bfa' : 'var(--text-muted)',
              border: active ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
            }}
          >
            <Icon />
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: -1,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  borderRadius: '0 3px 3px 0',
                  background: '#7c3aed',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
