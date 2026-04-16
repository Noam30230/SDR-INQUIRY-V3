import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'

type Mode = 'signin' | 'signup'
type View = 'landing' | 'form'

const TIER_COLOR: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444',
}

function MiniRing({ score, color }: { score: number; color: string }) {
  const size = 26, stroke = 2.5, radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

function MiniCard({ tier, company, score, funding, tech, angle, dimmed }: {
  tier: string; company: string; score: number; funding?: string; tech?: string; angle?: string; dimmed?: boolean
}) {
  const color = TIER_COLOR[tier]
  return (
    <div style={{ opacity: dimmed ? 0.35 : 1, borderLeft: `3px solid ${color}`, background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.06)`, borderLeftColor: color, borderRadius: 7 }}>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${color}22`, color }}>{tier}</span>
        <span className="text-[10px] font-semibold text-white flex-1 truncate">{company}</span>
        {funding && <span className="text-[7px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>{funding}</span>}
        <MiniRing score={score} color={color} />
        {tech && <span className="text-[7px] px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>{tech}</span>}
      </div>
      {angle && (
        <div className="px-2.5 pb-1.5 flex items-center gap-1">
          <span className="text-[7px]" style={{ color: 'rgba(167,139,250,0.5)' }}>📞</span>
          <span className="text-[7px] italic truncate" style={{ color: 'rgba(167,139,250,0.7)' }}>{angle}</span>
        </div>
      )}
    </div>
  )
}

function MiniCardScoring({ company }: { company: string }) {
  return (
    <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderLeft: '3px solid rgba(124,58,237,0.5)', borderRadius: 7 }}>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <div className="w-3 h-3 rounded-full shrink-0 animate-spin" style={{ border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#a78bfa' }} />
        <span className="text-[10px] font-semibold text-white flex-1">{company}</span>
        <span className="text-[7px]" style={{ color: '#a78bfa' }}>Scoring...</span>
      </div>
    </div>
  )
}

function DashboardIllustration() {
  return (
    <div className="relative w-full mt-10" style={{ maxWidth: 900 }}>
      {/* Glow behind the window */}
      <div className="absolute pointer-events-none" style={{
        inset: '-40px -60px',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.22) 0%, transparent 65%)',
        filter: 'blur(30px)',
      }} />

      {/* Browser chrome */}
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: '#080e1f',
        border: '1px solid rgba(124,58,237,0.22)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
      }}>
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
          <div className="flex-1 mx-3">
            <div className="mx-auto w-40 h-3.5 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.2)' }}>account-scorer.vercel.app</span>
            </div>
          </div>
        </div>

        {/* App layout: sidebar + main */}
        <div className="flex" style={{ minHeight: 320 }}>

          {/* Left sidebar */}
          <div className="shrink-0 flex flex-col px-3 py-3 gap-3" style={{
            width: 200,
            background: '#060c18',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* Logo */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
                <span className="text-[8px]">🐶</span>
              </div>
              <span className="text-[9px] font-bold text-white">Account Scorer</span>
            </div>

            {/* Textarea mock */}
            <div className="rounded-md px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 56 }}>
              <p className="text-[7px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Pennylane, pennylane.com</p>
              <p className="text-[7px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Qonto, qonto.com</p>
              <p className="text-[7px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Swile, swile.co</p>
            </div>

            {/* Search depth chips */}
            <div className="flex gap-1">
              <div className="px-1.5 py-0.5 rounded text-[7px] font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>Standard</div>
              <div className="px-1.5 py-0.5 rounded text-[7px]" style={{ background: 'transparent', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>Deep</div>
            </div>

            {/* Score button */}
            <div className="rounded-md py-1.5 text-center text-[8px] font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white' }}>
              Score →
            </div>

            {/* Tier stats */}
            <div className="mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[7px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Tier breakdown</p>
              <div className="grid grid-cols-2 gap-1">
                {[['T1','#10b981','2'],['T2','#f59e0b','1'],['T3','#6b7280','0'],['DQ','#ef4444','1']].map(([t,c,n]) => (
                  <div key={t} className="flex items-center justify-between px-1.5 py-0.5 rounded" style={{ background: `${c}11`, border: `1px solid ${c}33` }}>
                    <span className="text-[7px] font-bold" style={{ color: c }}>{t}</span>
                    <span className="text-[7px] font-semibold text-white">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-[10px] font-bold text-white">Scored accounts</span>
                <span className="text-[8px] ml-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>4 accounts</span>
              </div>
              <div className="flex gap-1.5">
                <div className="text-[7px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>All 4</div>
                <div className="text-[7px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>T1</div>
                <div className="text-[7px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>Filter</div>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-1.5">
              <MiniCardScoring company="Swile" />
              <MiniCard tier="T1" company="Pennylane" score={92} funding="Series B" tech="GCP" angle="Just raised Series B — perfect timing to pitch observability" />
              <MiniCard tier="T1" company="Qonto" score={88} funding="Series C+" tech="Azure" angle="Series C+ fintech scaling fast — strong infra gap to fill" />
              <MiniCard tier="T2" company="Payfit" score={65} tech="AWS" />
              <MiniCard tier="DQ" company="Accenture" score={8} dimmed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('landing')
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function openForm(m: Mode) {
    setMode(m)
    setError('')
    setSuccess('')
    setView('form')
  }

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

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center px-8 py-12 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>

        <style>{`
          @keyframes shimmer-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .shimmer-btn {
            position: relative;
            z-index: 0;
            overflow: hidden;
          }
          .shimmer-btn::before {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 9999px;
            background: conic-gradient(from 0deg, transparent 0deg, #a78bfa 60deg, #7c3aed 120deg, transparent 180deg, transparent 360deg);
            animation: shimmer-rotate 2.5s linear infinite;
            z-index: -1;
          }
          .shimmer-btn::after {
            content: '';
            position: absolute;
            inset: 2px;
            border-radius: 9999px;
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            z-index: -1;
          }
        `}</style>

        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
          width: 900, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }} />

        {/* Nav bar */}
        <div className="w-full flex items-center justify-between mb-16 relative z-10" style={{ maxWidth: 960 }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
              <img src="/logo.png" alt="Datadog" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">Account Scorer</span>
            <span className="text-xs mx-1" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by </span>
            <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: '#7c3aed' }}>
              Noam Ramillon
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openForm('signin')}
              className="px-4 py-1.5 text-sm transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              Log in
            </button>
            <button onClick={() => openForm('signup')}
              className="shimmer-btn px-5 py-1.5 rounded-full text-sm font-bold text-white"
              style={{ boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
              Sign up →
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center relative z-10" style={{ maxWidth: 680 }}>
          <h1 className="font-bold leading-tight mb-5" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.5rem)' }}>
            <span className="text-white">Score your accounts.</span><br />
            <span style={{ color: '#7c3aed' }}>Call the right ones.</span>
          </h1>
          <p className="text-lg mb-10" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            AI-powered ICP scoring for Datadog SDRs.<br />
            3 data sources · ~25s per account · T1/T2/T3/DQ tiering.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => openForm('signup')}
              className="shimmer-btn px-8 py-3 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ boxShadow: '0 0 32px rgba(124,58,237,0.5)' }}
            >
              Sign up →
            </button>
            <button
              onClick={() => openForm('signin')}
              className="px-7 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: 'transparent', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}
            >
              Log in
            </button>
          </div>
        </div>

        {/* Dashboard illustration — wide */}
        <div className="w-full flex justify-center relative z-10" style={{ maxWidth: 960 }}>
          <DashboardIllustration />
        </div>
      </div>
    )
  }

  // Form view
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #7c3aed 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <button onClick={() => setView('landing')} className="absolute top-6 left-6 text-xs transition-opacity hover:opacity-80 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        ← Back
      </button>

      <div className="flex items-center gap-2.5 mb-8 relative z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
          <img src="/logo.png" alt="Datadog" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-sm font-bold text-white">Account Scorer</span>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <h2 className="text-2xl font-bold text-white mb-1 text-center">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-sm mb-6 text-center" style={{ color: 'var(--text-muted)' }}>
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
              : (mode === 'signin' ? 'Log in →' : 'Create my account →')}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Built by <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
            className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#7c3aed' }}>Noam Ramillon</a> · Datadog SDR 🐶
        </p>
      </div>
    </div>
  )
}
