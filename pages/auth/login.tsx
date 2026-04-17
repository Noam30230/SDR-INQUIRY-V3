import { useState, useEffect } from 'react'
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
    <div className="relative w-full">
      <div className="absolute pointer-events-none" style={{
        inset: '-40px -60px',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.22) 0%, transparent 65%)',
        filter: 'blur(30px)',
      }} />
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: '#080e1f',
        border: '1px solid rgba(124,58,237,0.22)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
      }}>
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
        <div className="flex" style={{ minHeight: 480 }}>
          <div className="shrink-0 flex flex-col px-3 py-3 gap-3" style={{ width: 200, background: '#060c18', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
                <span className="text-[8px]">🐶</span>
              </div>
              <span className="text-[9px] font-bold text-white">Account Scorer</span>
            </div>
            <div className="rounded-md px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 56 }}>
              <p className="text-[7px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Pennylane, pennylane.com</p>
              <p className="text-[7px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Qonto, qonto.com</p>
              <p className="text-[7px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Swile, swile.co</p>
            </div>
            <div className="flex gap-1">
              <div className="px-1.5 py-0.5 rounded text-[7px] font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>Standard</div>
              <div className="px-1.5 py-0.5 rounded text-[7px]" style={{ background: 'transparent', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>Deep</div>
            </div>
            <div className="rounded-md py-1.5 text-center text-[8px] font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white' }}>Score →</div>
            <div className="mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[7px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Tier breakdown</p>
              <div className="grid grid-cols-2 gap-1">
                {[['T1','#10b981','4'],['T2','#f59e0b','2'],['T3','#6b7280','1'],['DQ','#ef4444','2']].map(([t,c,n]) => (
                  <div key={t} className="flex items-center justify-between px-1.5 py-0.5 rounded" style={{ background: `${c}11`, border: `1px solid ${c}33` }}>
                    <span className="text-[7px] font-bold" style={{ color: c }}>{t}</span>
                    <span className="text-[7px] font-semibold text-white">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-[10px] font-bold text-white">Scored accounts</span>
                <span className="text-[8px] ml-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>9 accounts</span>
              </div>
              <div className="flex gap-1.5">
                <div className="text-[7px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>All 9</div>
                <div className="text-[7px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>T1</div>
                <div className="text-[7px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>Filter</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <MiniCardScoring company="Swile" />
              <MiniCard tier="T1" company="Pennylane" score={92} funding="Series B" tech="GCP" angle="Just raised Series B — perfect timing to pitch observability" />
              <MiniCard tier="T1" company="Qonto" score={88} funding="Series C+" tech="Azure" angle="Series C+ fintech scaling fast — strong infra gap to fill" />
              <MiniCard tier="T1" company="Doctolib" score={84} funding="Series D" tech="AWS" angle="Scaling healthtech infra across EU — strong cloud monitoring need" />
              <MiniCard tier="T1" company="Alan" score={79} funding="Series E" tech="GCP" angle="Series E insurtech on GCP — APM gap visible in job postings" />
              <MiniCard tier="T2" company="Payfit" score={65} tech="AWS" />
              <MiniCard tier="T2" company="Contentsquare" score={58} tech="GCP" />
              <MiniCard tier="T3" company="Coface" score={34} />
              <MiniCard tier="DQ" company="Accenture" score={8} dimmed />
              <MiniCard tier="DQ" company="Capgemini" score={5} dimmed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>
      </svg>
    ),
    title: 'Tier classification',
    desc: 'Every account is automatically scored T1, T2, T3, or DQ in seconds — no manual research required.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.71 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: 'AI call angle',
    desc: 'Claude writes a one-sentence pitch per account based on what it found — funding, tech stack, growth signals.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Tech stack detection',
    desc: 'Identifies cloud providers, DevOps tools, monitoring stack, and SaaS signals from the company\'s public footprint.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Funding signals',
    desc: 'Detects recent funding rounds (Seed, Series A/B/C+) that indicate growth momentum and infrastructure investment.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
      </svg>
    ),
    title: 'Standard & Deep search',
    desc: 'Choose speed (1 AI search, ~15s) or depth (2 searches, ~30s) depending on how much signal you need.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>
      </svg>
    ),
    title: 'Smart caching',
    desc: 'If a teammate already scored a company, you get the result instantly — no wait, no delay.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Submit your accounts',
    desc: 'Paste company names and websites, one per line. Run batches of 10–20 at a time.',
  },
  {
    number: '02',
    title: 'AI analyzes in seconds',
    desc: 'GitHub signals, website tech detection, and Claude web search combine to build a full account profile.',
  },
  {
    number: '03',
    title: 'Get your score + call angle',
    desc: 'Each account returns with a tier (T1–DQ), a score out of 100, tech stack, and a one-sentence call angle ready to use.',
  },
]

const PLANS = [
  {
    label: 'STARTER',
    name: 'Solo',
    price: '$19',
    period: '/month',
    analyses: '250 analyses / month',
    subline: '~12 accounts/day · 1 user',
    features: ['T1/T2/T3/DQ scoring', 'AI call angle per account', 'Tech stack & funding signals', 'Standard & Deep search', 'CSV export'],
    recommended: false,
    cta: 'Get started',
  },
  {
    label: 'MOST POPULAR',
    name: 'Team',
    price: '$49',
    period: '/month',
    analyses: '750 analyses / month',
    subline: '3–5 SDRs · shared workspace',
    features: ['Everything in Solo', 'Up to 5 users', 'Shared workspace & results', 'Cross-team caching', 'Priority support'],
    recommended: true,
    cta: 'Get started',
  },
  {
    label: 'SCALE',
    name: 'Growth',
    price: '$129',
    period: '/month',
    analyses: '2,500 analyses / month',
    subline: '10+ SDRs · intensive use',
    features: ['Everything in Team', 'Unlimited users', 'Multi-team workspace', 'Dedicated onboarding', 'SLA guarantee'],
    recommended: false,
    cta: 'Get started',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('landing')
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openForm(m: Mode) {
    setMode(m)
    setError('')
    setSuccess('')
    setView('form')
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
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
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>

        <style>{`
          @keyframes shimmer-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .shimmer-btn {
            position: relative; z-index: 0; overflow: hidden;
          }
          .shimmer-btn::before {
            content: ''; position: absolute; inset: -3px; border-radius: 9999px;
            background: conic-gradient(from 0deg, transparent 0deg, #a78bfa 60deg, #7c3aed 120deg, transparent 180deg, transparent 360deg);
            animation: shimmer-rotate 2.5s linear infinite; z-index: -1;
          }
          .shimmer-btn::after {
            content: ''; position: absolute; inset: 2px; border-radius: 9999px;
            background: linear-gradient(135deg, #7c3aed, #6d28d9); z-index: -1;
          }
          @keyframes curtain-up {
            0%   { transform: translateY(0); }
            100% { transform: translateY(-100%); }
          }
          .curtain {
            position: fixed; inset: 0; z-index: 100; pointer-events: none;
            background: #02050d;
            animation: curtain-up 1s cubic-bezier(0.76, 0, 0.24, 1) 0.15s both;
          }
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .reveal { animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
          .reveal-d1 { animation-delay: 0.7s; }
          .reveal-d2 { animation-delay: 0.82s; }
          .reveal-d3 { animation-delay: 0.94s; }
        `}</style>

        {/* Curtain */}
        <div className="curtain" />

        {/* ── NAVBAR ── */}
        <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 h-16 transition-all duration-300"
          style={{
            background: 'rgba(8,14,31,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
          {/* Left: logo */}
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
              <img src="/logo.png" alt="Account Scorer" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">Account Scorer</span>
          </div>
          {/* Center: nav links */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {[['Product', 'features'], ['How it works', 'how-it-works'], ['Pricing', 'pricing']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm transition-colors hover:text-white"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          {/* Right: Need help */}
          <div className="flex-1 flex justify-end">
            <a href="https://mail.google.com/mail/?view=cm&to=noam.ramillon@datadoghq.com" target="_blank" rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}>
              Need help?
            </a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section id="hero" className="relative flex flex-col items-center px-6 pt-32 pb-20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{
              width: 900, height: 500,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 65%)',
              filter: 'blur(50px)',
            }} />
          </div>

          {/* Big card */}
          <div className="reveal reveal-d1 rounded-3xl w-full" style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '64px 80px 0 80px',
            overflow: 'hidden',
          }}>
            <div className="text-center mb-10">
              <h1 className="font-bold mb-7" style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                <span className="text-white">Score your accounts.</span><br />
                <span style={{ color: '#7c3aed' }}>Call the right ones.</span>
              </h1>
              <p className="mb-12" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                AI-powered ICP scoring for Datadog SDRs.<br />
                ~25s per account · T1/T2/T3/DQ tiering.
              </p>
              <div className="flex items-center justify-center gap-3 mb-10">
                <button onClick={() => openForm('signup')}
                  className="shimmer-btn px-8 py-3 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{ boxShadow: '0 0 32px rgba(124,58,237,0.5)' }}>
                  Sign up →
                </button>
                <button onClick={() => openForm('signin')}
                  className="px-7 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{ background: 'transparent', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}>
                  Log in
                </button>
              </div>
            </div>

            {/* Source badges */}
            <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
              {[
                { label: 'Website', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
                { label: 'GitHub', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg> },
                { label: 'Claude AI', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg> },
              ].map(({ label, icon }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
              <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Sources used for every scoring</span>
            </div>

            {/* Illustration — stretched to card edges */}
            <div className="relative -mx-20">
              <DashboardIllustration />
              <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, rgba(8,14,31,1))' }} />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="flex flex-col items-center px-6 py-24" style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.04) 0%, transparent 100%)' }}>
          <div className="w-full" style={{ maxWidth: 1100 }}>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#7c3aed' }}>How it works</p>
              <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>From account list to call priority<br />in under 30 seconds.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <div key={step.number} className="relative rounded-2xl p-8" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderTop: `3px solid ${['#7c3aed','#a78bfa','#6d28d9'][i]}`,
                }}>
                  <div className="text-5xl font-black mb-6 leading-none" style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.04em',
                  }}>{step.number}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES (alternating blocks) ── */}
        <section id="features" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Block 1 — Tier scoring */}
          <div className="flex flex-col lg:flex-row items-center gap-12 px-8 py-20 mx-auto" style={{ maxWidth: 1100 }}>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>Product</p>
              <h2 className="text-3xl font-bold text-white mb-5" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>Score every account<br />in under 30 seconds.</h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Paste a list of companies — the tool collects GitHub signals, website tech, and web search results, then Claude classifies each one as T1, T2, T3, or DQ with a score out of 100.
              </p>
              <ul className="space-y-3">
                {['T1: cloud-native SaaS with active tech team', 'T2: partial signals, worth qualifying', 'T3: low fit, minimal tech stack', 'DQ: ESN, pure consulting, public institutions'].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: '#a78bfa' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Illustration */}
            <div className="flex-1 min-w-0 w-full">
              <div className="rounded-2xl overflow-hidden" style={{
                background: '#080e1f', border: '1px solid rgba(124,58,237,0.2)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
              }}>
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                  <div className="flex-1 mx-4">
                    <div className="mx-auto h-5 rounded flex items-center justify-center px-3" style={{ background: 'rgba(255,255,255,0.04)', maxWidth: 200 }}>
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>account-scorer.vercel.app/scoring</span>
                    </div>
                  </div>
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span className="text-sm font-bold text-white">Scored accounts</span>
                    <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>5 accounts</span>
                  </div>
                  <div className="flex gap-1.5">
                    {['All 5','T1','T2','T3','DQ'].map((f,i) => (
                      <span key={f} className="text-[10px] px-2.5 py-1 rounded-full" style={{
                        background: i===0 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                        color: i===0 ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                        border: i===0 ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.07)',
                      }}>{f}</span>
                    ))}
                  </div>
                </div>
                {/* Account rows */}
                <div className="p-3 space-y-2">
                  {[
                    { tier: 'T1', color: '#10b981', name: 'Pennylane', score: 92, tag: 'Series B', tech: 'GCP' },
                    { tier: 'T1', color: '#10b981', name: 'Qonto', score: 88, tag: 'Series C+', tech: 'Azure' },
                    { tier: 'T2', color: '#f59e0b', name: 'Payfit', score: 65, tech: 'AWS' },
                    { tier: 'T3', color: '#6b7280', name: 'Coface', score: 31 },
                    { tier: 'DQ', color: '#ef4444', name: 'Accenture', score: 8, dimmed: true },
                  ].map(({ tier, color, name, score, tag, tech, dimmed }) => (
                    <div key={name} style={{
                      opacity: dimmed ? 0.4 : 1,
                      background: 'rgba(255,255,255,0.025)',
                      borderLeft: `3px solid ${color}`,
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 8,
                    }}>
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{tier}</span>
                        <span className="text-xs font-semibold text-white flex-1">{name}</span>
                        {tag && <span className="text-[9px] px-2 py-0.5 rounded shrink-0 font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>{tag}</span>}
                        {tech && <span className="text-[9px] px-2 py-0.5 rounded shrink-0" style={{ background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.18)' }}>{tech}</span>}
                        <MiniRing score={score} color={color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Block 2 — Call angle (reversed) */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 px-8 py-20 mx-auto" style={{ maxWidth: 1100 }}>
            {/* Illustration */}
            <div className="flex-1 min-w-0 w-full">
              <div className="rounded-2xl overflow-hidden" style={{
                background: '#080e1f', border: '1px solid rgba(124,58,237,0.2)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
              }}>
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                  <span className="ml-4 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Account detail · Qonto</span>
                </div>
                <div className="p-5">
                  {/* Account header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>T1</span>
                    <span className="text-base font-bold text-white">Qonto</span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>Series C+</span>
                    <div className="ml-auto"><MiniRing score={88} color="#10b981" /></div>
                  </div>
                  {/* Call angle */}
                  <div className="rounded-xl px-4 py-3.5 mb-4" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">📞</span>
                      <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>AI call angle</span>
                    </div>
                    <p className="text-sm italic leading-relaxed text-white">"Series C+ fintech scaling payments across Europe — strong infra gap, perfect timing to pitch observability."</p>
                  </div>
                  {/* Signals */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <p className="text-[9px] font-semibold mb-2" style={{ color: '#6ee7b7' }}>Positive signals</p>
                      <div className="space-y-1">
                        {['SaaS cloud-native fintech','Azure + K8s confirmed','3 active SRE postings','Site built on Next.js'].map(s => (
                          <div key={s} className="flex items-start gap-1.5">
                            <span className="text-[8px] mt-0.5 shrink-0" style={{ color: '#6ee7b7' }}>✓</span>
                            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <p className="text-[9px] font-semibold mb-2" style={{ color: '#fca5a5' }}>Negative signals</p>
                      <div className="space-y-1">
                        {['No public GitHub org','Monitoring not detected'].map(s => (
                          <div key={s} className="flex items-start gap-1.5">
                            <span className="text-[8px] mt-0.5 shrink-0" style={{ color: '#fca5a5' }}>✗</span>
                            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>Product</p>
              <h2 className="text-3xl font-bold text-white mb-5" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>A one-sentence pitch,<br />ready before you dial.</h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                Claude reads each account's funding history, tech stack, and growth signals — then writes a call angle you can use directly. No prep, no research, no guessing.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '💰', title: 'Funding detected automatically', desc: 'Seed, Series A through C+, IPO — recent rounds flag the best entry points.' },
                  { icon: '✅', title: 'Positive & negative signals', desc: 'See what confirms the fit and what works against it, before you pick up the phone.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Block 3 — Tech stack */}
          <div className="flex flex-col lg:flex-row items-center gap-12 px-8 py-20 mx-auto" style={{ maxWidth: 1100 }}>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>Product</p>
              <h2 className="text-3xl font-bold text-white mb-5" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>Tech stack detection<br />across every source.</h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Cloud provider, DevOps tools, monitoring stack, programming languages — collected from the company's website, GitHub, and public job postings, then categorized and ranked.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { cat: 'Cloud', color: '#60a5fa', items: 'AWS, GCP, Azure, Vercel' },
                  { cat: 'DevOps', color: '#a78bfa', items: 'Kubernetes, Terraform, Docker' },
                  { cat: 'Languages', color: '#34d399', items: 'Python, Go, TypeScript' },
                  { cat: 'Monitoring', color: '#f59e0b', items: 'Datadog, Grafana, Prometheus' },
                ].map(({ cat, color, items }) => (
                  <div key={cat} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color }}>{cat}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{items}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Illustration */}
            <div className="flex-1 min-w-0 w-full">
              <div className="rounded-2xl overflow-hidden" style={{
                background: '#080e1f', border: '1px solid rgba(124,58,237,0.2)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
              }}>
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                  <span className="ml-4 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Tech stack · Pennylane</span>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { cat: 'Cloud', color: '#60a5fa', items: ['AWS', 'GCP'] },
                    { cat: 'DevOps', color: '#a78bfa', items: ['Kubernetes', 'Terraform', 'Docker'] },
                    { cat: 'Languages', color: '#34d399', items: ['Python', 'TypeScript', 'Go'] },
                    { cat: 'Monitoring', color: '#f59e0b', items: ['Datadog', 'Grafana'] },
                    { cat: 'Data', color: '#f472b6', items: ['Snowflake', 'dbt'] },
                    { cat: 'AI', color: '#c4b5fd', items: ['OpenAI', 'LangChain'] },
                  ].map(({ cat, color, items }) => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold mb-2" style={{ color, opacity: 0.8 }}>{cat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(item => (
                          <span key={item} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="flex flex-col items-center px-6 py-24">
          <div className="w-full" style={{ maxWidth: 1100 }}>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#7c3aed' }}>Pricing</p>
              <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Simple, transparent pricing.</h2>
              <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Start with 10 free analyses. No credit card required.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {PLANS.map((plan) => (
                <div key={plan.name} className="rounded-2xl p-8 flex flex-col" style={{
                  background: plan.recommended ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.025)',
                  border: plan.recommended ? '2px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  position: 'relative',
                }}>
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: '#10b981', color: '#fff', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}>
                      ★ RECOMMENDED
                    </div>
                  )}
                  <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: plan.recommended ? '#6ee7b7' : 'var(--text-muted)' }}>{plan.label}</p>
                  <p className="text-2xl font-black text-white mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                  </div>
                  <div className="py-4 mb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-sm font-semibold text-white">{plan.analyses}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{plan.subline}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        <span className="shrink-0 mt-0.5" style={{ color: plan.recommended ? '#6ee7b7' : '#a78bfa' }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => openForm('signup')}
                    className="w-full py-2.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                    style={plan.recommended
                      ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }
                      : { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }
                    }>
                    {plan.cta} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="flex flex-col items-center px-6 py-12" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6" style={{ maxWidth: 1100 }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
                <img src="/logo.png" alt="Account Scorer" className="w-4 h-4 object-contain" />
              </div>
              <span className="text-sm font-bold text-white">Account Scorer</span>
              <span className="text-xs mx-1" style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Built by </span>
              <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: '#7c3aed' }}>
                Noam Ramillon
              </a>
            </div>
            <div className="flex items-center gap-6">
              {[['Product', 'features'], ['How it works', 'how-it-works'], ['Pricing', 'pricing']].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
              <a href="https://mail.google.com/mail/?view=cm&to=noam.ramillon@datadoghq.com" target="_blank" rel="noopener noreferrer"
                className="text-xs transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                Contact
              </a>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>© 2025 Account Scorer</p>
          </div>
        </footer>

      </div>
    )
  }

  // ── FORM VIEW ──
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
