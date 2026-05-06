import { useState, useEffect } from 'react'

const PAD = 14

interface StepDef {
  spotlight?: string
  title: string
  body: React.ReactNode
  cta: string
}

function TierBadge({ tier, color, desc }: { tier: string; color: string; desc: string }) {
  return (
    <div style={{
      background: `${color}14`, border: `1px solid ${color}35`,
      borderRadius: 10, padding: '8px 10px',
    }}>
      <div style={{ color, fontWeight: 700, fontSize: 13, letterSpacing: '0.02em' }}>{tier}</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'monospace', background: 'rgba(124,58,237,0.08)',
      border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8,
      padding: '8px 12px', margin: '10px 0', fontSize: 12,
      color: '#a78bfa', lineHeight: 1.7,
    }}>
      {children}
    </div>
  )
}

const STEPS: StepDef[] = [
  {
    title: 'Welcome to Inquiry 👋',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7 }}>
        <p>
          Inquiry analyzes your B2B accounts in <strong style={{ color: 'white' }}>~25 seconds</strong> and automatically
          classifies them as{' '}
          <span style={{ color: '#10b981', fontWeight: 600 }}>T1</span>,{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>T2</span>,{' '}
          <span style={{ color: '#6b7280', fontWeight: 600 }}>T3</span> or{' '}
          <span style={{ color: '#ef4444', fontWeight: 600 }}>DQ</span>.
        </p>
        <p style={{ marginTop: 10 }}>
          In minutes, you'll know exactly <strong style={{ color: 'white' }}>who to call</strong>,{' '}
          <strong style={{ color: 'white' }}>why</strong>, and <strong style={{ color: 'white' }}>what to say</strong>.
        </p>
        <p style={{ marginTop: 10 }}>Here's a quick 4-step tour to get you started.</p>
      </div>
    ),
    cta: 'Get started →',
  },
  {
    spotlight: '#onboarding-manual-area',
    title: '✏️ Score an account',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>
        <p>
          Enter the company <strong style={{ color: 'white' }}>name</strong> and{' '}
          <strong style={{ color: 'white' }}>domain</strong>, separated by a comma.
          One account per line.
        </p>
        <CodeBlock>
          Pennylane, pennylane.com<br />
          Qonto, qonto.com<br />
          Alan, alan.com
        </CodeBlock>
        <p>
          The <strong style={{ color: 'white' }}>name</strong> helps the AI target its web searches.
          The <strong style={{ color: 'white' }}>domain</strong> is required to analyze the website and tech stack.
          Both together give much more accurate results.
        </p>
      </div>
    ),
    cta: 'Next →',
  },
  {
    spotlight: '#onboarding-tabs',
    title: '📂 Import a CSV list',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>
        <p>
          To score an entire list, switch to the{' '}
          <strong style={{ color: 'white' }}>📂 CSV</strong> tab.
        </p>
        <p style={{ marginTop: 10 }}>
          Drag and drop your file directly into the zone — Inquiry automatically detects
          the <strong style={{ color: 'white' }}>name</strong> and{' '}
          <strong style={{ color: 'white' }}>domain</strong> columns, even if they have different headers.
        </p>
        <p style={{ marginTop: 10 }}>
          Your CSV can also include a <strong style={{ color: 'white' }}>Salesforce ID</strong> column —
          it will be preserved in the export.
        </p>
      </div>
    ),
    cta: 'Next →',
  },
  {
    title: '📊 Reading the results',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ marginBottom: 12 }}>Every account is automatically classified:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <TierBadge tier="T1" color="#10b981" desc="Confirmed SaaS — high priority" />
          <TierBadge tier="T2" color="#f59e0b" desc="Tech signals — needs qualifying" />
          <TierBadge tier="T3" color="#6b7280" desc="Few signals — low priority" />
          <TierBadge tier="DQ" color="#ef4444" desc="Consulting / services — disqualified" />
        </div>
        <p>
          You'll also see a <strong style={{ color: 'white' }}>score 0–100</strong>,{' '}
          <strong style={{ color: 'white' }}>positive/negative signals</strong>,
          the detected <strong style={{ color: 'white' }}>tech stack</strong>,
          and an AI-suggested <strong style={{ color: 'white' }}>call angle</strong>.
        </p>
      </div>
    ),
    cta: "Let's go! 🚀",
  },
]

export default function OnboardingModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isCentered = !current.spotlight

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Get / update spotlight rect
  useEffect(() => {
    if (!current.spotlight) { setRect(null); return }
    function measure() {
      const el = document.querySelector(current.spotlight!)
      if (el) setRect(el.getBoundingClientRect())
    }
    const t = setTimeout(measure, 80)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [step, current.spotlight])

  function next() {
    if (isLast) { localStorage.setItem('inquiry_onboarded', 'true'); onDone() }
    else setStep(s => s + 1)
  }

  function skip() {
    localStorage.setItem('inquiry_onboarded', 'true')
    onDone()
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 18,
    padding: '24px 26px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)',
  }

  function ProgressDots() {
    return (
      <div className="flex items-center gap-1.5" style={{ marginTop: 20 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
            background: i === step ? '#7c3aed' : i < step ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    )
  }

  function CardContent() {
    return (
      <>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>{current.title}</h3>
          <button
            onClick={skip}
            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}
            className="hover:text-white transition-colors"
          >
            Skip
          </button>
        </div>
        <div>{current.body}</div>
        <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
          <ProgressDots />
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 20px rgba(124,58,237,0.5)', flexShrink: 0 }}
          >
            {current.cta}
          </button>
        </div>
      </>
    )
  }

  // Compute tooltip position relative to spotlight
  const tooltipLeft = rect ? Math.min(rect.right + PAD + 12, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 380) : 0
  const tooltipTop = rect ? Math.max(rect.top + rect.height / 2 - 180, 20) : 0

  return (
    <>
      {isCentered ? (
        /* ── CENTERED OVERLAY ── */
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{
            zIndex: 9998,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(4px)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div style={{ ...cardStyle, maxWidth: 440, width: '100%' }}>
            <CardContent />
          </div>
        </div>
      ) : (
        /* ── SPOTLIGHT ── */
        <>
          {/* Dark overlay — pointer events pass through the spotlight hole */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9997, background: 'rgba(0,0,0,0.01)', opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
          />
          {/* Spotlight hole via box-shadow */}
          {rect && (
            <div
              style={{
                position: 'fixed',
                zIndex: 9998,
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                borderRadius: 14,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
                border: '1.5px solid rgba(124,58,237,0.55)',
                pointerEvents: 'none',
                opacity: visible ? 1 : 0,
                transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
              }}
            />
          )}
          {/* Tooltip card */}
          {rect && (
            <div
              style={{
                position: 'fixed',
                zIndex: 9999,
                left: tooltipLeft,
                top: tooltipTop,
                width: 340,
                opacity: visible ? 1 : 0,
                transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
              }}
            >
              {/* Arrow pointing left toward sidebar */}
              <div style={{
                position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%) rotate(45deg)',
                width: 14, height: 14,
                background: 'var(--bg-card)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRight: 'none', borderTop: 'none',
              }} />
              <div style={cardStyle}>
                <CardContent />
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
