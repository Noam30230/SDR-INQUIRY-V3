import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

type Reason = 'trial_expired' | 'usage_limit_reached' | 'subscription_inactive' | 'voluntary'

interface UpgradeModalProps {
  reason: Reason
  onClose: () => void
}

const PLANS = [
  {
    id: 'solo' as const,
    name: 'Solo',
    price: '€19',
    analyses: '250 analyses / month',
    features: ['T1/T2/T3/DQ scoring', 'AI call angle', 'Tech stack & funding', 'Standard & Deep search', 'CSV export'],
    popular: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '€49',
    analyses: '750 analyses / month',
    features: ['Everything in Solo', 'Up to 5 users', 'Shared workspace', 'Cross-team caching', 'Priority support'],
    popular: true,
  },
  {
    id: 'growth' as const,
    name: 'Growth',
    price: '€129',
    analyses: '2,500 analyses / month',
    features: ['Everything in Pro', 'Unlimited users', 'Multi-team workspace', 'Dedicated onboarding', 'SLA guarantee'],
    popular: false,
  },
]

const REASON_LABELS: Record<Reason, { title: string; subtitle: string }> = {
  trial_expired: {
    title: 'Your trial has ended',
    subtitle: 'You\'ve used your 3-day free trial. Upgrade to keep scoring accounts.',
  },
  usage_limit_reached: {
    title: 'Monthly limit reached',
    subtitle: 'You\'ve used all your analyses for this month. Upgrade for more.',
  },
  subscription_inactive: {
    title: 'Subscription inactive',
    subtitle: 'Your subscription is no longer active. Reactivate to keep scoring.',
  },
  voluntary: {
    title: 'Upgrade your plan',
    subtitle: 'More analyses, more features. Choose the plan that fits your team.',
  },
}

export default function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    setLoading(planId)
    setError(null)
    try {
      const { data } = await supabaseBrowser.auth.getSession()
      const token = data.session?.access_token || ''
      const res = await fetch(`/api/stripe/create-checkout?plan=${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await res.json()
      if (body.url) {
        window.location.href = body.url
      } else {
        setError(body.error || 'Stripe error — check Vercel env vars (STRIPE_SECRET_KEY, STRIPE_PRICE_PRO…)')
        setLoading(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
      setLoading(null)
    }
  }

  const { title, subtitle } = REASON_LABELS[reason]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            </div>
            <button onClick={onClose} className="text-sm transition-opacity hover:opacity-60 ml-4 mt-0.5" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-7 mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="px-7 pb-7 grid grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className="relative flex flex-col rounded-xl p-5"
              style={{
                background: plan.popular ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
                border: plan.popular ? '1.5px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-bold text-white">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/month</span>
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: plan.popular ? '#a78bfa' : 'var(--text-muted)' }}>{plan.analyses}</p>
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: plan.popular ? '#a78bfa' : '#6b7280' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
                className="w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
                style={plan.popular
                  ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', boxShadow: '0 0 20px rgba(124,58,237,0.35)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }
                }>
                {loading === plan.id ? 'Redirecting...' : 'Get started →'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
