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
    title: 'Bienvenue sur Inquiry 👋',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7 }}>
        <p>
          Inquiry analyse vos comptes B2B en <strong style={{ color: 'white' }}>~25 secondes</strong> et les classe
          automatiquement en{' '}
          <span style={{ color: '#10b981', fontWeight: 600 }}>T1</span>,{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>T2</span>,{' '}
          <span style={{ color: '#6b7280', fontWeight: 600 }}>T3</span> ou{' '}
          <span style={{ color: '#ef4444', fontWeight: 600 }}>DQ</span>.
        </p>
        <p style={{ marginTop: 10 }}>
          En 2 minutes, vous saurez exactement <strong style={{ color: 'white' }}>qui appeler</strong>,{' '}
          <strong style={{ color: 'white' }}>pourquoi</strong>, et <strong style={{ color: 'white' }}>quoi dire</strong>.
        </p>
        <p style={{ marginTop: 10 }}>On vous fait faire le tour en 4 étapes rapides.</p>
      </div>
    ),
    cta: 'Commencer →',
  },
  {
    spotlight: '#onboarding-manual-area',
    title: '✏️ Saisir un compte',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>
        <p>
          Entrez le <strong style={{ color: 'white' }}>nom</strong> et le{' '}
          <strong style={{ color: 'white' }}>domaine</strong> de l'entreprise, séparés par une virgule.
          Une ligne par compte.
        </p>
        <CodeBlock>
          Pennylane, pennylane.com<br />
          Qonto, qonto.com<br />
          Alan, alan.com
        </CodeBlock>
        <p>
          Le <strong style={{ color: 'white' }}>nom</strong> aide l'IA à cibler ses recherches web.
          Le <strong style={{ color: 'white' }}>domaine</strong> est indispensable pour analyser le site et la stack technique.
          Les deux ensemble donnent des résultats bien plus précis.
        </p>
      </div>
    ),
    cta: 'Suivant →',
  },
  {
    spotlight: '#onboarding-tabs',
    title: '📂 Importer une liste CSV',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>
        <p>
          Pour scorer une liste entière, cliquez sur l'onglet{' '}
          <strong style={{ color: 'white' }}>📂 CSV</strong> ci-contre.
        </p>
        <p style={{ marginTop: 10 }}>
          Glissez votre fichier directement dans la zone — Inquiry détecte automatiquement
          les colonnes <strong style={{ color: 'white' }}>nom</strong> et{' '}
          <strong style={{ color: 'white' }}>domaine</strong>, même si elles ont des noms différents.
        </p>
        <p style={{ marginTop: 10 }}>
          Votre CSV peut aussi contenir un{' '}
          <strong style={{ color: 'white' }}>Salesforce ID</strong> par ligne — il sera conservé dans l'export.
        </p>
      </div>
    ),
    cta: 'Suivant →',
  },
  {
    title: '📊 Lire les résultats',
    body: (
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ marginBottom: 12 }}>Chaque compte est classé automatiquement :</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <TierBadge tier="T1" color="#10b981" desc="SaaS confirmé — priorité haute" />
          <TierBadge tier="T2" color="#f59e0b" desc="Signaux tech — à qualifier" />
          <TierBadge tier="T3" color="#6b7280" desc="Peu de signaux — faible priorité" />
          <TierBadge tier="DQ" color="#ef4444" desc="Consulting / services — disqualifié" />
        </div>
        <p>
          Vous verrez aussi le <strong style={{ color: 'white' }}>score 0–100</strong>,
          les <strong style={{ color: 'white' }}>signaux positifs/négatifs</strong>,
          la <strong style={{ color: 'white' }}>stack technique</strong> détectée,
          et un <strong style={{ color: 'white' }}>angle d'appel</strong> suggéré par l'IA.
        </p>
      </div>
    ),
    cta: "C'est parti ! 🚀",
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
            Passer
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
