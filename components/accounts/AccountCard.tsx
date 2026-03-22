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

function getAvatarColor(name: string): string {
  const colors = [
    '#7c3aed', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
    '#ec4899', '#14b8a6', '#8b5cf6', '#06b6d4', '#84cc16',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
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
  const avatarColor = getAvatarColor(account.company_name)
  const initial = account.company_name.charAt(0).toUpperCase()

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: expanded ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${expanded ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
        boxShadow: expanded ? '0 0 0 1px rgba(124,58,237,0.1)' : 'none',
      }}
    >
      {/* Card header — clickable */}
      <button
        onClick={() => isDone && setExpanded(v => !v)}
        className="w-full text-left px-4 py-3.5"
        disabled={isScoring || isError}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white"
            style={{ background: `${avatarColor}22`, border: `1px solid ${avatarColor}44`, color: avatarColor }}
          >
            {initial}
          </div>

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
            {account.domain && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{account.domain}</p>
            )}
          </div>

          {/* Right side: tier + score OR loading */}
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
            {isError && (
              <span className="text-xs font-medium text-red-400">Error</span>
            )}
            {isDone && account.tier && <TierBadge tier={account.tier} size="sm" />}
            {isDone && account.score !== null && (
              <span
                className="text-lg font-bold tabular-nums leading-none"
                style={{ color: scoreColor(account.score ?? 0) }}
              >
                {account.score}
                <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>/100</span>
              </span>
            )}
          </div>

          {/* Chevron */}
          {isDone && (
            <span
              className="text-xs shrink-0 transition-transform duration-200"
              style={{
                color: 'var(--text-muted)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
              }}
            >
              ▼
            </span>
          )}
        </div>

        {/* Tech chips */}
        {topTechs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 ml-12">
            {topTechs.map(t => <SignalChip key={t} label={t} variant="tech" />)}
          </div>
        )}

        {/* Error message */}
        {isError && account.error_message && (
          <p className="text-xs mt-1.5 ml-12 text-red-400">{account.error_message}</p>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          <AccountDetail account={account} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}
