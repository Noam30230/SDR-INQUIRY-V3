import type { Account, TechStack } from '@/types'
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
      <span className="text-xs shrink-0 mt-0.5 w-14 text-right" style={{ color: 'var(--text-muted)' }}>
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
  onDelete: (id: string) => void
}

export default function AccountDetail({ account, onDelete }: AccountDetailProps) {
  const techCategories = Object.keys(account.tech_stack || {}) as Array<keyof TechStack>
  const hasTech = techCategories.some(cat => (account.tech_stack[cat] || []).length > 0)
  const positiveSignals = account.signals?.positive || []
  const negativeSignals = account.signals?.negative || []

  return (
    <div className="space-y-4 pt-4">

      {/* Signals */}
      {(positiveSignals.length > 0 || negativeSignals.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
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
      {account.web_quality && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Website
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(account.web_quality as { hasHttps: boolean }).hasHttps && <SignalChip label="HTTPS" variant="positive" />}
            {(account.web_quality as { isResponsive: boolean }).isResponsive && <SignalChip label="Responsive" variant="positive" />}
            {(account.web_quality as { framework: string }).framework && (
              <SignalChip label={(account.web_quality as { framework: string }).framework} variant="tech" />
            )}
            {(account.web_quality as { hosting: string }).hosting && (
              <SignalChip label={`Host: ${(account.web_quality as { hosting: string }).hosting}`} variant="neutral" />
            )}
            {(account.web_quality as { hasCareers: boolean }).hasCareers && <SignalChip label="Careers page" variant="positive" />}
            {(account.web_quality as { hasBlog: boolean }).hasBlog && <SignalChip label="Blog" variant="positive" />}
            {(account.web_quality as { isPageBuilder: boolean }).isPageBuilder && <SignalChip label="Page builder" variant="negative" />}
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
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#a78bfa' }}>GPT-4o Analysis</p>
          <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
            {account.reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-1 flex items-center justify-between">
        <div className="flex gap-2">
          {account.domain && (
            <a
              href={`https://${account.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              Visit website ↗
            </a>
          )}
        </div>
        <button
          onClick={() => onDelete(account.id)}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
