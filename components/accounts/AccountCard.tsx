import { useState } from 'react'
import type { Account, TechStack } from '@/types'
import TierBadge from '@/components/ui/TierBadge'
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

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  if (score >= 25) return '#6b7280'
  return '#ef4444'
}

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
}

export default function AccountCard({ account, onDelete }: AccountCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isScoring = account.status === 'scoring' || account.status === 'pending'
  const isError = account.status === 'error'
  const isDone = account.status === 'done'
  const topTechs = account.tech_stack ? getTopTechs(account.tech_stack) : []

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: expanded ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${expanded ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
        boxShadow: expanded ? '0 0 0 1px rgba(124,58,237,0.1)' : 'none',
      }}
    >
      {/* Card header */}
      <div className="flex items-start gap-2 px-4 py-3.5">
        {/* Main clickable area */}
        <button
          onClick={() => isDone && setExpanded(v => !v)}
          className="flex-1 min-w-0 text-left"
          disabled={isScoring || isError}
        >
          <div className="flex items-center gap-3">
            {/* Company info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-white leading-tight">{account.company_name}</span>
                {account.salesforce_id && (
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    {account.salesforce_id}
                  </span>
                )}
              </div>
            </div>

            {/* Right: tier + score OR spinner */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              {isScoring && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Scoring...</span>
                </div>
              )}
              {isError && <span className="text-xs font-medium text-red-400">Error</span>}
              {isDone && account.tier && <TierBadge tier={account.tier} size="sm" />}
              {isDone && account.score !== null && (
                <span className="text-lg font-bold tabular-nums leading-none" style={{ color: scoreColor(account.score ?? 0) }}>
                  {account.score}
                  <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>/100</span>
                </span>
              )}
            </div>

            {/* Chevron */}
            {isDone && (
              <span
                className="text-xs shrink-0 transition-transform duration-200"
                style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
              >
                ▼
              </span>
            )}
          </div>

          {/* Tech chips */}
          {topTechs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {topTechs.map(t => <SignalChip key={t} label={t} variant="tech" />)}
            </div>
          )}

          {/* Error message */}
          {isError && account.error_message && (
            <p className="text-xs mt-1.5 text-red-400">{account.error_message}</p>
          )}
        </button>

        {/* Cancel / delete button for scoring or error */}
        {(isScoring || isError) && (
          <button
            onClick={() => onDelete(account.id)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs transition-colors hover:text-red-400"
            style={{ color: 'var(--text-muted)' }}
            title="Cancel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          <AccountDetail account={account} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}
