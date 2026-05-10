export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0e17',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#fff',
      padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <svg width="48" height="48" viewBox="0 0 64 64" style={{ marginBottom: '2rem' }}>
        <rect x="10" y="28" width="36" height="8" rx="3.6" fill="#7c3aed" />
        <circle cx="52" cy="32" r="4.2" fill="#7c3aed" />
      </svg>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Inquiry is under maintenance
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '360px', lineHeight: 1.6 }}>
        We're making some improvements. The tool will be back shortly.
      </p>
    </div>
  )
}
