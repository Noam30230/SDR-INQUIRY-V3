import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

const FEATURES = [
  { icon: '🎯', title: 'AI-powered scoring', desc: 'T1/T2/T3/DQ tiering in seconds using 7 data sources' },
  { icon: '⚡', title: 'Full tech stack detection', desc: 'Cloud, DevOps, Monitoring, Languages — auto-detected' },
  { icon: '🌐', title: 'Web quality analysis', desc: 'Site quality, hosting provider, job postings extracted' },
  { icon: '📰', title: 'Real-time signals', desc: 'Funding rounds, press coverage, hiring signals' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* LEFT — Marketing */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-14 py-12 relative overflow-hidden">
        {/* Gradient blob */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(-40%, -40%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Account Scorer</div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#7c3aed' }}>
              by Noam Ramillon
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            <span className="text-white">Score your accounts.</span><br />
            <span style={{ color: '#7c3aed' }}>Call the right ones.</span>
          </h1>
          <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>
            AI-powered ICP scoring for Datadog SDR. Stop guessing, start prioritizing.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
            {[
              { value: '7', label: 'data sources' },
              { value: '<60s', label: 'per account' },
              { value: 'T1/T2/T3/DQ', label: 'tiering system' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3.5">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  {f.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="w-full lg:w-[540px] flex flex-col justify-center px-8 lg:px-14"
        style={{ background: '#0c1020', borderLeft: '1px solid var(--border)' }}>

        <div className="w-full max-w-sm mx-auto">

          {/* Personal workspace badge */}
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg w-fit"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span className="text-xs">🔐</span>
            <span className="text-xs font-medium" style={{ color: '#a78bfa' }}>Personal workspace — your accounts, your data</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Enter your email to receive a magic link.<br />
            <span className="text-xs">New here? Your account is created automatically.</span>
          </p>

          {sent ? (
            <div className="rounded-xl p-5 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-3xl mb-3">📬</div>
              <p className="font-semibold text-white">Check your inbox</p>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Magic link sent to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                You&apos;ll land directly in your workspace with all your accounts.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@datadoghq.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                {loading ? 'Sending...' : 'Log in to Account Scorer →'}
              </button>
            </form>
          )}

          {/* Session persistence note */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-xs" style={{ color: '#6ee7b7' }}>
              ✓ Your scored accounts are saved and available every time you log back in.
            </p>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Built by <span className="font-semibold" style={{ color: '#7c3aed' }}>Noam Ramillon</span> · Datadog SDR 🐶
          </p>
        </div>
      </div>
    </div>
  )
}
