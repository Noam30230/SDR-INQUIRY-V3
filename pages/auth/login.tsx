import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

const TIER_COLOR: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444',
}

function MiniRing({ score, color }: { score: number; color: string }) {
  const size = 28, stroke = 2.5, radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

function MiniCard({ tier, company, score, funding, tech, angle, dimmed }: {
  tier: string; company: string; score: number; funding?: string; tech?: string; angle?: string; dimmed?: boolean
}) {
  const color = TIER_COLOR[tier]
  return (
    <div style={{ opacity: dimmed ? 0.45 : 1, borderLeft: `3px solid ${color}`, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`, borderLeftColor: color, borderRadius: 8 }}>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>{tier}</span>
        <span className="text-[11px] font-semibold text-white flex-1 truncate">{company}</span>
        {funding && <span className="text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>{funding}</span>}
        <MiniRing score={score} color={color} />
        {tech && <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>{tech}</span>}
      </div>
      {angle && (
        <div className="px-2.5 pb-1.5 flex items-center gap-1">
          <span className="text-[8px]" style={{ color: 'rgba(167,139,250,0.5)' }}>📞</span>
          <span className="text-[8px] italic truncate" style={{ color: 'rgba(167,139,250,0.7)' }}>{angle}</span>
        </div>
      )}
    </div>
  )
}

function MiniCardScoring({ company }: { company: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid rgba(124,58,237,0.4)', borderRadius: 8 }}>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin shrink-0" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
        <span className="text-[11px] font-semibold text-white flex-1">{company}</span>
        <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Scoring...</span>
      </div>
    </div>
  )
}

function DashboardIllustration() {
  return (
    <div className="relative mt-8" style={{ transform: 'perspective(1200px) rotateY(-4deg) rotateX(1deg)', transformOrigin: 'left center' }}>
      {/* Glow */}
      <div className="absolute pointer-events-none" style={{ inset: '-20px', background: 'radial-gradient(ellipse at 40% 60%, rgba(124,58,237,0.25) 0%, transparent 65%)', filter: 'blur(20px)' }} />

      {/* Window */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: '#080e1f', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}>

        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
          <div className="flex-1 mx-3">
            <div className="mx-auto w-32 h-3.5 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>account-scorer.vercel.app</span>
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <span className="text-[10px] font-bold text-white">Scored accounts</span>
            <span className="text-[8px] ml-1.5" style={{ color: 'var(--text-muted)' }}>5 accounts</span>
          </div>
          <div className="flex gap-1.5">
            <div className="text-[8px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>All 5</div>
            <div className="text-[8px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>Filter</div>
          </div>
        </div>

        {/* Cards */}
        <div className="p-2.5 space-y-1.5">
          <MiniCard tier="T1" company="Pennylane" score={92} funding="Series B" tech="GCP" angle="Just raised Series B — perfect timing to pitch observability" />
          <MiniCard tier="T1" company="Qonto" score={88} funding="Series C+" tech="Azure" angle="Series C+ fintech scaling fast — strong infra gap to fill" />
          <MiniCardScoring company="Swile" />
          <MiniCard tier="T2" company="Payfit" score={65} tech="AWS" />
          <MiniCard tier="DQ" company="Accenture" score={8} dimmed />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signin') {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message.includes('Invalid login credentials')
          ? "Incorrect credentials. No account yet? Click Sign up."
          : error.message)
      } else {
        router.replace('/scoring')
      }
    } else {
      const { data, error } = await supabaseBrowser.auth.signUp({ email, password })
      if (error) {
        setError(error.message.includes('already registered')
          ? "This email already has an account. Click Log in."
          : error.message)
      } else if (data.session) {
        router.replace('/scoring')
      } else {
        setSuccess("Account created! You can now log in.")
        setMode('signin')
        setPassword('')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* LEFT */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-12 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <img src="/logo.png" alt="Datadog" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Account Scorer</div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by </span>
            <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: '#7c3aed' }}>
              Noam Ramillon
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            <span className="text-white">Score your accounts.</span><br />
            <span style={{ color: '#7c3aed' }}>Call the right ones.</span>
          </h1>
          <p className="text-base mb-6" style={{ color: 'var(--text-muted)' }}>
            AI-powered ICP scoring for Datadog SDRs. Stop guessing, start prioritizing.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pb-6 mb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            {[
              { value: '4', label: 'data sources' },
              { value: '~35s', label: 'per account' },
              { value: 'T1→DQ', label: 'tiering system' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Illustration */}
          <DashboardIllustration />
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="w-full lg:w-[520px] flex flex-col justify-center px-8 lg:px-14"
        style={{ background: '#0c1020', borderLeft: '1px solid var(--border)' }}>

        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' ? 'Log in to your workspace' : 'Start scoring your accounts'}
          </p>

          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
                style={{ background: mode === m ? 'var(--primary)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-muted)' }}>
                {m === 'signin' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Work email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@datadoghq.com" required
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }} />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg text-sm"
                style={{ color: '#6ee7b7', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                ✓ {success}
              </div>
            )}

            <button type="submit" disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
              {loading
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                : (mode === 'signin' ? 'Log in to Account Scorer →' : 'Create my account →')}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Built by <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
              className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#7c3aed' }}>Noam Ramillon</a> · Datadog SDR 🐶
          </p>
        </div>
      </div>
    </div>
  )
}
