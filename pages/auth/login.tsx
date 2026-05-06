import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '@/lib/supabase'

const InquiryLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="28" width="36" height="8" rx="3.6" fill="#7c3aed" />
    <circle cx="52" cy="32" r="4.2" fill="#7c3aed" />
  </svg>
)

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
        <span className="text-[10px] font-semibold text-white shrink-0">{company}</span>
        <MiniRing score={score} color={color} />
        {funding && <span className="text-[7px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>{funding}</span>}
        {tech && <span className="text-[7px] px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>{tech}</span>}
        <div className="flex-1" />
        {!dimmed && <span className="text-[7px] px-2 py-0.5 rounded shrink-0 font-medium" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>▼ Details</span>}
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
              <span className="text-[9px] font-bold text-white">Inquiry</span>
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
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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

  const FAQ_ITEMS = [
    { q: 'What is Inquiry?', a: 'Inquiry is an AI-powered account scoring tool for sales teams. It analyzes companies in ~25 seconds and returns a tier (T1/T2/T3/DQ), a score out of 100, a tech stack breakdown, and a one-sentence call angle ready to use.' },
    { q: 'What sources does it use?', a: 'Inquiry cross-references the company website (tech stack, SaaS signals), GitHub (dev activity, tools used), DNS/ASN data (real cloud provider), Pappers (French company data), and Claude AI web search (funding rounds, growth signals).' },
    { q: "What's the difference between Standard and Deep search?", a: 'Standard runs 1 AI search (~15s) — ideal for batch scoring 50+ accounts. Deep runs 2 searches (~30s) and delivers more thorough signal detection. Use Deep for your highest-priority accounts.' },
    { q: 'What does T1 / T2 / T3 / DQ mean?', a: 'T1 = top priority (confirmed SaaS, strong tech signals), T2 = medium priority (likely SaaS, partial signals), T3 = low priority (few tech signals, traditional sector), DQ = disqualified (IT consulting, services companies, public institutions).' },
    { q: 'Can I import a CSV?', a: 'Yes. Inquiry accepts CSV files with company name, domain, and optionally a Salesforce org ID. Columns are auto-detected regardless of their names — drag and drop your export directly.' },
  ]

  if (view === 'landing') {
    return (
      <div style={{ background: '#020817', minHeight: '100vh', color: 'white' }}>

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
            background: #020817;
            animation: curtain-up 1s cubic-bezier(0.76, 0, 0.24, 1) 0.15s both;
          }
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .reveal  { animation: fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both; }
          .reveal-d1 { animation-delay: 0.6s; }
          .reveal-d2 { animation-delay: 0.72s; }
          .reveal-d3 { animation-delay: 0.84s; }
          .reveal-d4 { animation-delay: 0.96s; }
          @keyframes marquee-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .marquee-track { animation: marquee-scroll 22s linear infinite; display: flex; gap: 32px; width: max-content; }
          .marquee-wrap { overflow: hidden; position: relative; }
          .marquee-wrap::before, .marquee-wrap::after {
            content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none;
          }
          .marquee-wrap::before { left: 0; background: linear-gradient(to right, #020817, transparent); }
          .marquee-wrap::after  { right: 0; background: linear-gradient(to left, #020817, transparent); }
          @keyframes border-beam {
            0%   { offset-distance: 0%; }
            100% { offset-distance: 100%; }
          }
          .faq-chevron { transition: transform 0.25s ease; }
          .faq-chevron.open { transform: rotate(180deg); }
          .faq-body { overflow: hidden; transition: max-height 0.3s ease, opacity 0.25s ease; }
        `}</style>

        {/* Curtain */}
        <div className="curtain" />

        {/* ── NAVBAR ── */}
        <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 h-16"
          style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 flex-1">
            <InquiryLogo size={36} />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white tracking-wide">Inquiry</span>
              <a href="https://www.linkedin.com/in/noam-ramillon" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors" style={{ color: '#7c3aed' }}>by Noam Ramillon</a>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {[['Product', 'features'], ['How it works', 'how-it-works'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 flex justify-end items-center gap-3">
            <a href="https://mail.google.com/mail/?view=cm&to=noam.ramillon@datadoghq.com" target="_blank" rel="noopener noreferrer"
              className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Contact
            </a>
            <button onClick={() => openForm('signin')}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', background: 'none' }}>
              Log in
            </button>
            <button onClick={() => openForm('signup')}
              className="px-4 py-1.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
              Get started
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative flex flex-col items-center text-center px-6 pt-40 pb-24 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.3) 0%, transparent 60%)',
          }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="reveal reveal-d1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 8px #a78bfa' }} />
              AI-powered · ~25s per account · T1/T2/T3/DQ
            </div>

            {/* Headline */}
            <h1 className="reveal reveal-d2 font-bold mb-6" style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
              Score your accounts.<br />
              <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto' }}>
                Call the right ones.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="reveal reveal-d3 mb-10 mx-auto" style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 560 }}>
              Inquiry analyzes companies in ~25 seconds and tells you who to call first — with tier ranking, tech stack detection, and an AI-generated call angle.
            </p>

            {/* CTAs */}
            <div className="reveal reveal-d4 flex items-center justify-center gap-4 mb-6">
              <button onClick={() => openForm('signup')}
                className="shimmer-btn px-8 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ boxShadow: '0 0 32px rgba(124,58,237,0.5)' }}>
                Get started free →
              </button>
              <button onClick={() => openForm('signin')}
                className="px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                Log in
              </button>
            </div>
            <p className="text-xs mb-16" style={{ color: 'rgba(255,255,255,0.25)' }}>No credit card required · 10 free analyses to start</p>
          </div>

          {/* Dashboard screenshot */}
          <div className="reveal reveal-d4 relative w-full max-w-5xl mx-auto">
            <div className="absolute -inset-px rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.3) 0%, transparent 60%)', borderRadius: 18 }} />
            <div className="rounded-2xl overflow-hidden" style={{
              border: '1px solid rgba(124,58,237,0.25)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
                <div className="flex-1 mx-4">
                  <div className="mx-auto h-5 rounded flex items-center justify-center px-3" style={{ background: 'rgba(255,255,255,0.04)', maxWidth: 220 }}>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>inquiry.vercel.app/scoring</span>
                  </div>
                </div>
              </div>
              <DashboardIllustration />
            </div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none rounded-b-2xl" style={{ background: 'linear-gradient(to bottom, transparent, #020817)' }} />
          </div>
        </section>

        {/* ── MARQUEE — sources ── */}
        <section className="py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-center text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: 'rgba(255,255,255,0.25)' }}>Real data sources — no hallucination</p>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {[...Array(2)].flatMap(() => [
                { icon: '🌐', label: 'Website scraping' },
                { icon: '🐙', label: 'GitHub analysis' },
                { icon: '✦', label: 'Claude AI search' },
                { icon: '🔗', label: 'DNS / ASN lookup' },
                { icon: '📋', label: 'Pappers (FR)' },
                { icon: '⚡', label: '~25s per account' },
                { icon: '💰', label: 'Funding detection' },
                { icon: '🛡️', label: 'Tech stack detection' },
                { icon: '📊', label: 'T1/T2/T3/DQ scoring' },
                { icon: '📞', label: 'AI call angle' },
              ]).map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-5 py-2.5 rounded-full shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="flex flex-col items-center px-6 py-28">
          <div className="w-full" style={{ maxWidth: 1100 }}>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>The problem</p>
              <h2 className="text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                Still scoring accounts<br />by hand?
              </h2>
              <p className="text-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>Here's why that's costing you calls.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: '📋', title: 'Hours wasted on research', desc: 'Manually checking LinkedIn, websites, and Crunchbase for 150+ accounts eats directly into your best prospecting hours. You end up spending your morning on admin, not selling.' },
                { icon: '📞', title: 'Calling the wrong companies', desc: 'Without prioritization, you spend your best hours on T3 accounts that will never convert. Meanwhile, your top T1s are being called by a competitor who scored them first.' },
                { icon: '🔍', title: 'Missing the right moment', desc: 'The company that just raised Series B, migrated to Kubernetes, or hired 20 engineers — you found out three weeks too late, or not at all. Timing is everything in outbound.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="rounded-2xl p-7 flex flex-col gap-4" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {icon}
                  </div>
                  <h3 className="text-lg font-bold text-white" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="flex flex-col items-center px-6 py-24" style={{ background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-full" style={{ maxWidth: 1100 }}>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>How it works</p>
              <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}>From account list to call priority<br />in under 30 seconds.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <div key={step.number} className="relative rounded-2xl p-8" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 text-sm font-black" style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.15))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    color: '#a78bfa',
                  }}>{['01','02','03'][i]}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES (alternating blocks) ── */}
        <section id="features" className="flex flex-col items-center px-6 py-24">
          <div className="w-full" style={{ maxWidth: 1100 }}>
            <div className="text-center mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>Product</p>
              <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}>Everything you need to<br />prioritize your territory.</h2>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
              {[
                { icon: '⭐', title: 'Tier classification', desc: 'Every account is scored T1, T2, T3, or DQ in seconds — no manual research required. Score out of 100 with full reasoning.', color: '#f59e0b' },
                { icon: '📞', title: 'AI call angle', desc: 'Claude writes a one-sentence pitch per account based on funding, tech stack, and growth signals. Ready to use before you dial.', color: '#a78bfa' },
                { icon: '🛠️', title: 'Tech stack detection', desc: 'Cloud provider, DevOps tools, monitoring stack — collected from website, GitHub, and DNS. Only real signals, no inference.', color: '#60a5fa' },
                { icon: '💰', title: 'Funding signals', desc: 'Detects Seed, Series A through C+ automatically. Recent rounds flag the best entry points and add context to your call angle.', color: '#34d399' },
                { icon: '🔍', title: 'Standard & Deep search', desc: 'Standard is fast (~15s, 1 AI search). Deep is thorough (~30s, 2 searches). Choose based on how much signal you need.', color: '#f472b6' },
                { icon: '⚡', title: 'Smart caching', desc: 'If a teammate already scored a company, you get the result instantly — no AI cost, no wait time. Shared across your team.', color: '#fb923c' },
              ].map(({ icon, title, desc, color }) => (
                <div key={title} className="rounded-2xl p-7 flex gap-5" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'border-color 0.2s',
                }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Big feature illustration — account list */}
            <div className="rounded-2xl overflow-hidden" style={{
              background: '#060c18',
              border: '1px solid rgba(124,58,237,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}>
              <div className="flex items-center gap-1.5 px-5 py-3.5" style={{ background: '#040810', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
                <div className="flex-1 mx-4">
                  <div className="mx-auto h-5 rounded flex items-center justify-center px-3" style={{ background: 'rgba(255,255,255,0.04)', maxWidth: 220 }}>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>inquiry.vercel.app/scoring</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span className="text-sm font-bold text-white">Scored accounts</span>
                  <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>5 accounts</span>
                </div>
                <div className="flex gap-2">
                  {['All 5','T1','T2','T3','DQ'].map((f,i) => (
                    <span key={f} className="text-xs px-3 py-1 rounded-full" style={{
                      background: i===0 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: i===0 ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                      border: i===0 ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    }}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { tier: 'T1', color: '#10b981', name: 'Pennylane', score: 92, tag: 'Series B', tech: 'GCP', angle: 'Just raised Series B — perfect timing to pitch observability as they scale infra.' },
                  { tier: 'T1', color: '#10b981', name: 'Qonto', score: 88, tag: 'Series C+', tech: 'Azure', angle: 'Series C+ fintech scaling EU payments — strong infra gap, ideal moment.' },
                  { tier: 'T2', color: '#f59e0b', name: 'Payfit', score: 65, tech: 'AWS', angle: 'Fast-growing HR SaaS on AWS — monitoring signals worth exploring.' },
                  { tier: 'T3', color: '#6b7280', name: 'Coface', score: 31 },
                  { tier: 'DQ', color: '#ef4444', name: 'Accenture', score: 8, dimmed: true },
                ].map(({ tier, color, name, score, tag, tech, angle, dimmed }) => (
                  <div key={name} style={{
                    opacity: dimmed ? 0.35 : 1,
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${color}`,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                  }}>
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{tier}</span>
                      <span className="text-sm font-semibold text-white shrink-0">{name}</span>
                      <MiniRing score={score} color={color} />
                      {tag && <span className="text-xs px-2 py-0.5 rounded shrink-0 font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>{tag}</span>}
                      {tech && <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.18)' }}>{tech}</span>}
                      <div className="flex-1" />
                      {!dimmed && <span className="text-xs px-3 py-1 rounded shrink-0 font-medium" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.22)' }}>▼ Details</span>}
                    </div>
                    {angle && (
                      <div className="px-4 pb-2.5 flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'rgba(167,139,250,0.5)' }}>📞</span>
                        <span className="text-xs italic" style={{ color: 'rgba(167,139,250,0.65)' }}>{angle}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="flex flex-col items-center px-6 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-full" style={{ maxWidth: 720 }}>
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7c3aed' }}>FAQ</p>
              <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>Got questions?</h2>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${openFaq === i ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'border-color 0.2s',
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span className="text-base font-semibold text-white pr-4">{item.q}</span>
                    <svg className={`faq-chevron shrink-0 ${openFaq === i ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <div className="faq-body" style={{ maxHeight: openFaq === i ? 200 : 0, opacity: openFaq === i ? 1 : 0 }}>
                    <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm mt-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
              More questions?{' '}
              <a href="https://mail.google.com/mail/?view=cm&to=noam.ramillon@datadoghq.com" target="_blank" rel="noopener noreferrer"
                className="transition-colors hover:text-white" style={{ color: '#a78bfa' }}>
                Reach out →
              </a>
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="flex flex-col items-center px-6 py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          }} />
          <div className="relative z-10 text-center" style={{ maxWidth: 600 }}>
            <h2 className="text-4xl font-bold text-white mb-5" style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}>
              Start scoring your territory today.
            </h2>
            <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
              Stop guessing. Know exactly who to call, when to call, and what to say — in seconds.
            </p>
            <button onClick={() => openForm('signup')}
              className="shimmer-btn inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ boxShadow: '0 0 48px rgba(124,58,237,0.6)' }}>
              Get started free →
            </button>
            <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>No credit card required · 10 free analyses</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 px-10 py-14 mx-auto" style={{ maxWidth: 1100 }}>
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <InquiryLogo size={32} />
                <span className="text-sm font-bold text-white">Inquiry</span>
              </div>
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>AI-powered account scoring</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Built by{' '}
                <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
                  className="transition-colors hover:text-white" style={{ color: '#7c3aed' }}>
                  Noam Ramillon
                </a>
              </p>
            </div>
            {/* Links */}
            <div className="flex gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Product</p>
                <div className="flex flex-col gap-3">
                  {[['Product', 'features'], ['How it works', 'how-it-works'], ['FAQ', 'faq']].map(([label, id]) => (
                    <button key={id} onClick={() => scrollTo(id)}
                      className="text-sm text-left transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Contact</p>
                <div className="flex flex-col gap-3">
                  <a href="https://mail.google.com/mail/?view=cm&to=noam.ramillon@datadoghq.com" target="_blank" rel="noopener noreferrer"
                    className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Send email
                  </a>
                  <a href="https://www.linkedin.com/in/noamramillon/" target="_blank" rel="noopener noreferrer"
                    className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-10 py-5 mx-auto" style={{ maxWidth: 1100, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2025 Inquiry. All rights reserved.</p>
            <button onClick={() => openForm('signup')} className="text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Get started →
            </button>
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
        <InquiryLogo size={36} />
        <span className="text-sm font-bold text-white">Inquiry</span>
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
