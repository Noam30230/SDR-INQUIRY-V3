import type { Account, TechStack, WebQuality } from '@/types'
import SignalChip from '@/components/ui/SignalChip'

const CATEGORY_ICONS: Record<keyof TechStack, string> = {
  Cloud: '☁️', Monitoring: '📊', DevOps: '⚙️',
  Languages: '💻', Data: '🗄️', AI: '🤖',
  Security: '🔒', Other: '🔧',
}

function TechGroup({ category, items }: { category: keyof TechStack; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="flex items-start gap-2">
      {/* Fix #8: w-14 was too narrow for "Languages" — w-20 fits all category names */}
      <span className="text-xs shrink-0 mt-0.5 w-20 text-right" style={{ color: 'var(--text-muted)' }}>
        {CATEGORY_ICONS[category]} {category}
      </span>
      <div className="flex flex-wrap gap-1">
        {items.map(item => <SignalChip key={item} label={item} variant="tech" />)}
      </div>
    </div>
  )
}

interface AccountDetailProps {
  account: Account
}

export default function AccountDetail({ account }: AccountDetailProps) {
  const techCategories = Object.keys(account.tech_stack || {}) as Array<keyof TechStack>
  const hasTech = techCategories.some(cat => (account.tech_stack[cat] || []).length > 0)
  const positiveSignals = account.signals?.positive || []
  const negativeSignals = account.signals?.negative || []

  // Fix #15: single cast instead of 10 individual casts
  const wq = account.web_quality as WebQuality | null

  return (
    <div className="space-y-4 pt-4">

      {/* Signals */}
      {(positiveSignals.length > 0 || negativeSignals.length > 0) && (
        <div className={positiveSignals.length > 0 && negativeSignals.length > 0 ? 'grid grid-cols-2 gap-3' : ''}>
          {positiveSignals.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#34d399' }}>Positive signals</p>
              <ul className="space-y-1">
                {positiveSignals.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#e2e8f0' }}>
                    <span className="text-green-400 shrink-0 mt-0.5">+</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {negativeSignals.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#f87171' }}>Negative signals</p>
              <ul className="space-y-1">
                {negativeSignals.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#e2e8f0' }}>
                    <span className="text-red-400 shrink-0 mt-0.5">−</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tech stack */}
      {hasTech && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Tech Stack
          </p>
          <div className="space-y-2">
            {techCategories.map(cat => (
              <TechGroup key={cat} category={cat} items={account.tech_stack[cat] || []} />
            ))}
          </div>
        </div>
      )}

      {/* Web quality */}
      {wq && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Website
          </p>
          <div className="flex flex-wrap gap-1.5">
            {wq.hasHttps && <SignalChip label="HTTPS" variant="positive" />}
            {wq.isResponsive && <SignalChip label="Responsive" variant="positive" />}
            {wq.framework && <SignalChip label={wq.framework} variant="tech" />}
            {wq.hosting && <SignalChip label={`Host: ${wq.hosting}`} variant="neutral" />}
            {wq.hasPricing && <SignalChip label="Pricing page" variant="positive" />}
            {wq.hasSignup && <SignalChip label="Sign-up CTA" variant="positive" />}
            {wq.hasDemo && <SignalChip label="Demo CTA" variant="positive" />}
            {wq.hasLogin && <SignalChip label="Login portal" variant="positive" />}
            {wq.hasDocs && <SignalChip label="Docs / API" variant="positive" />}
            {wq.hasIntegrations && <SignalChip label="Integrations" variant="positive" />}
            {wq.hasCareers && <SignalChip label="Careers page" variant="positive" />}
            {wq.hasBlog && <SignalChip label="Blog" variant="positive" />}
            {wq.isPageBuilder && <SignalChip label={`Page builder: ${wq.pageBuilderName}`} variant="negative" />}
          </div>
        </div>
      )}

      {/* Press */}
      {(account.press_signals?.articles || []).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Recent news
          </p>
          <ul className="space-y-1.5">
            {account.press_signals.articles.map((a, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.date}</span>
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="hover:underline" style={{ color: '#a78bfa' }}>{a.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* GPT reasoning */}
      {account.reasoning && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#a78bfa' }}>GPT-4o mini Analysis</p>
          <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
            {account.reasoning}
          </p>
        </div>
      )}

      {/* Fix #2: removed duplicate Delete button — only the ✕ in the card banner remains */}
      {account.domain && (
        <div className="pt-1">
          <a
            href={account.domain?.startsWith('http') ? account.domain : `https://${account.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            Visit website ↗
          </a>
        </div>
      )}
    </div>
  )
}
