import { useState } from 'react'
import type { Account, TechStack } from '@/types'
import TierBadge from '@/components/ui/TierBadge'
import ScoreBar from '@/components/ui/ScoreBar'
import SignalChip from '@/components/ui/SignalChip'
import AccountDetail from './AccountDetail'

function getTopTechs(stack: TechStack): string[] {
  const priority: Array<keyof TechStack> = ['Cloud', 'Monitoring', 'DevOps', 'Languages', 'AI', 'Data']
  const techs: string[] = []
  for (const cat of priority) {
    techs.push(...(stack[cat] || []))
    if (techs.length >= 5) break
  }
  return techs.slice(0, 5)
}

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
}

export default function AccountCard({ account, onDelete }: AccountCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isScoring = account.status === 'scoring' || account.status === 'pending'
  const isError = account.status === 'error'
  const topTechs = account.tech_stack ? getTopTechs(account.tech_stack) : []

  return (
    <div
      className="rounded-xl transition-colors"
      style={{
        background: expanded ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${expanded ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
      }}
    >
      {/* Header cliquable */}
      <button
        onClick={() => !isScoring && !isError && setExpanded(v => !v)}
        className="w-full text-left px-4 py-3.5"
        disabled={isScoring || isError}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Nom + domaine */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate">{account.company_name}</span>
              {account.tier && <TierBadge tier={account.tier} size="sm" />}
            </div>
            {account.domain && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{account.domain}</span>
            )}
          </div>

          {/* Score + status */}
          <div className="shrink-0 w-32">
            {isScoring && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--primary)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Scoring...</span>
              </div>
            )}
            {isError && (
              <span className="text-xs text-red-400">Erreur</span>
            )}
            {account.status === 'done' && account.score !== null && (
              <ScoreBar score={account.score} />
            )}
          </div>

          {/* Chevron */}
          {account.status === 'done' && (
            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>

        {/* Tech chips */}
        {topTechs.length > 0 && !isScoring && (
          <div className="flex flex-wrap gap-1 mt-2">
            {topTechs.map(t => <SignalChip key={t} label={t} variant="tech" />)}
          </div>
        )}

        {/* Error message */}
        {isError && account.error_message && (
          <p className="text-xs mt-1 text-red-400">{account.error_message}</p>
        )}
      </button>

      {/* Détail dépliable */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <AccountDetail account={account} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}
