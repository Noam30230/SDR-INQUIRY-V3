import { useState } from 'react'
import type { Account, TechStack } from '@/types'
import TierBadge from '@/components/ui/TierBadge'
import SignalChip from '@/components/ui/SignalChip'
import AccountDetail from './AccountDetail'

function getTopTechs(stack: TechStack): string[] {
  const priority: Array<keyof TechStack> = ['Cloud', 'DevOps', 'Monitoring', 'Languages', 'AI', 'Data']
  const techs: string[] = []
  for (const cat of priority) {
    techs.push(...(stack[cat] || []))
    if (techs.length >= 3) break  // Fix #7: reduced to 3 to avoid banner wrapping
  }
  return techs.slice(0, 3)
}

const TIER_LEFT_BORDER: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444',
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  if (score >= 25) return '#6b7280'
  return '#ef4444'
}

function ScoreRing({ score }: { score: number }) {
  const size = 36
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round" />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

export default function AccountCard({ account, onDelete, selected, onToggleSelect }: AccountCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isScoring = account.status === 'scoring' || account.status === 'pending'
  const isError = account.status === 'error'
  const isDone = account.status === 'done'
  const isDQ = account.tier === 'DQ'
  const topTechs = account.tech_stack ? getTopTechs(account.tech_stack) : []
  const leftBorderColor = account.tier ? TIER_LEFT_BORDER[account.tier] : 'var(--border)'

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: expanded ? 'var(--bg-hover)' : 'var(--bg-card)',
        borderTop: `1px solid ${selected ? 'rgba(124,58,237,0.5)' : expanded ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
        borderRight: `1px solid ${selected ? 'rgba(124,58,237,0.5)' : expanded ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
        borderBottom: `1px solid ${selected ? 'rgba(124,58,237,0.5)' : expanded ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
        borderLeft: `4px solid ${selected ? 'rgba(124,58,237,0.7)' : leftBorderColor}`,
        opacity: isDQ ? 0.6 : 1,
      }}
    >
      {/* Banner row */}
      <div className="flex items-center gap-3 px-4 py-2.5 min-w-0">

        {/* Checkbox */}
        {onToggleSelect && (
          <button
            onClick={e => { e.stopPropagation(); onToggleSelect(account.id) }}
            className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
            style={{
              background: selected ? 'rgba(124,58,237,0.4)' : 'transparent',
              border: `1px solid ${selected ? 'rgba(124,58,237,0.7)' : 'var(--border)'}`,
            }}
          >
            {selected && <span className="text-violet-300 text-xs leading-none" style={{ fontSize: 9 }}>✓</span>}
          </button>
        )}

        {/* Tier badge */}
        {account.tier && <TierBadge tier={account.tier} size="sm" />}

        {/* Company name — Fix #7: truncate long names to prevent banner wrapping */}
        <span
          className="font-semibold text-sm text-white shrink-0 truncate"
          style={{ maxWidth: '180px' }}
          title={account.company_name}
        >
          {account.company_name}
        </span>

        {/* Funding badge */}
        {isDone && (account.raw_data?.funding as string) && (account.raw_data.funding as string) !== 'unknown' && (
          <span className="text-xs px-1.5 py-0.5 rounded shrink-0 font-medium"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>
            {account.raw_data.funding as string}
          </span>
        )}

        {/* SF ID */}
        {account.salesforce_id && (
          <span className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>
            {account.salesforce_id}
          </span>
        )}

        {/* Score ring */}
        {isDone && account.score !== null && (
          <ScoreRing score={account.score ?? 0} />
        )}

        {/* Scoring spinner */}
        {isScoring && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Scoring...</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <span className="text-xs font-medium text-red-400 shrink-0" title={account.error_message || ''}>
            ⚠ Error
          </span>
        )}

        {/* Tech chips — Fix #7: nowrap + overflow hidden keeps banner single-line */}
        {topTechs.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
            {topTechs.map(t => <SignalChip key={t} label={t} variant="tech" />)}
          </div>
        )}

        {!topTechs.length && <div className="flex-1" />}

        {/* Details button */}
        {isDone && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all hover:brightness-110"
            style={{
              background: expanded ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
            }}
          >
            {expanded ? '▲' : '▼'} Details
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={() => onDelete(account.id)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs transition-colors hover:text-red-400"
          style={{ color: 'var(--text-muted)' }}
          title="Remove account"
        >
          ✕
        </button>
      </div>

      {/* Call angle — always visible on done accounts */}
      {isDone && (account.raw_data?.call_angle as string) && (
        <div
          className="px-4 py-2 flex items-center gap-2 border-t"
          style={{ borderColor: 'rgba(124,58,237,0.12)', background: 'rgba(124,58,237,0.04)' }}
        >
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>📞</span>
          <span className="text-xs italic" style={{ color: '#a78bfa' }}>
            {account.raw_data.call_angle as string}
          </span>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          <AccountDetail account={account} />
        </div>
      )}
    </div>
  )
}
