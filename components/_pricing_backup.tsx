// ─────────────────────────────────────────────────────────────────────────────
// PRICING SECTION BACKUP
// To restore: add PLANS const before the LoginPage component,
// paste the <section> block back between the Features section and the Footer,
// and add 'Pricing' back to the navbar + footer link arrays.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. PLANS const (paste before `export default function LoginPage()`) ──────

/*
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
*/

// ── 2. PRICING SECTION JSX (paste between Features section and Footer) ────────

/*
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
*/

// ── 3. NAVBAR link to restore (in the nav links array) ───────────────────────
// Add back: ['Pricing', 'pricing']
// Full array: [['Product', 'features'], ['How it works', 'how-it-works'], ['Pricing', 'pricing']]

// ── 4. FOOTER link to restore (same pattern) ─────────────────────────────────
// Add back: ['Pricing', 'pricing']
// Full array: [['Product', 'features'], ['How it works', 'how-it-works'], ['Pricing', 'pricing']]

export {}
