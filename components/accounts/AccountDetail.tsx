import type { Account, TechStack } from '@/types'
import SignalChip from '@/components/ui/SignalChip'

const CATEGORY_ICONS: Record<keyof TechStack, string> = {
  Cloud: '☁️', Monitoring: '📊', DevOps: '⚙️',
  Languages: '💻', Data: '🗄️', AI: '🤖',
  Security: '🔒', Other: '🔧',
}

interface TechGroupProps {
  category: keyof TechStack
  items: string[]
}

function TechGroup({ category, items }: TechGroupProps) {
  if (!items.length) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs">{CATEGORY_ICONS[category]}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {category}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <SignalChip key={item} label={item} variant="tech" />
        ))}
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

  return (
    <div className="space-y-5 py-3">
      {/* Tech stack */}
      {hasTech && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Stack Technique
          </h4>
          <div className="space-y-3">
            {techCategories.map(cat => (
              <TechGroup key={cat} category={cat} items={account.tech_stack[cat] || []} />
            ))}
          </div>
        </div>
      )}

      {/* Signaux */}
      <div className="grid grid-cols-2 gap-4">
        {(account.signals?.positive || []).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#34d399' }}>
              ✅ Signaux positifs
            </h4>
            <ul className="space-y-1">
              {account.signals.positive.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text)' }}>
                  <span className="text-green-400 mt-0.5 shrink-0">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(account.signals?.negative || []).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#f87171' }}>
              ⚠️ Signaux négatifs
            </h4>
            <ul className="space-y-1">
              {account.signals.negative.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text)' }}>
                  <span className="text-red-400 mt-0.5 shrink-0">−</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Qualité site web */}
      {account.web_quality && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            🌐 Site Web
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(account.web_quality as { hasHttps: boolean }).hasHttps && <SignalChip label="HTTPS ✓" variant="positive" />}
            {(account.web_quality as { isResponsive: boolean }).isResponsive && <SignalChip label="Responsive ✓" variant="positive" />}
            {(account.web_quality as { framework: string }).framework && (
              <SignalChip label={(account.web_quality as { framework: string }).framework} variant="tech" />
            )}
            {(account.web_quality as { hosting: string }).hosting && (
              <SignalChip label={`Hébergeur: ${(account.web_quality as { hosting: string }).hosting}`} variant="neutral" />
            )}
            {(account.web_quality as { hasCareers: boolean }).hasCareers && <SignalChip label="Page carrières ✓" variant="positive" />}
            {(account.web_quality as { hasBlog: boolean }).hasBlog && <SignalChip label="Blog ✓" variant="positive" />}
            {(account.web_quality as { isPageBuilder: boolean }).isPageBuilder && (
              <SignalChip label={`Page builder ⚠️`} variant="negative" />
            )}
          </div>
        </div>
      )}

      {/* Articles presse */}
      {(account.press_signals?.articles || []).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            📰 Actualités récentes
          </h4>
          <ul className="space-y-1.5">
            {account.press_signals.articles.map((a, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)', marginRight: 6 }}>[{a.date}]</span>
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="hover:underline" style={{ color: '#a78bfa' }}>
                  {a.title}
                </a>
                <span className="ml-1" style={{ color: 'var(--text-muted)' }}>— {a.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raisonnement GPT */}
      {account.reasoning && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            🧠 Analyse GPT-4o
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text)', opacity: 0.85 }}>
            {account.reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
        {account.domain && (
          <a
            href={`https://${account.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded mr-2 transition-colors"
            style={{
              color: '#a78bfa',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            Visiter le site ↗
          </a>
        )}
        <button
          onClick={() => onDelete(account.id)}
          className="text-xs px-3 py-1.5 rounded transition-colors"
          style={{
            color: '#f87171',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}
