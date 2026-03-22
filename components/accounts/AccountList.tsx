import type { Account, Tier } from '@/types'
import AccountCard from './AccountCard'

type FilterTier = 'all' | Tier

interface AccountListProps {
  accounts: Account[]
  filter: FilterTier
  onFilterChange: (f: FilterTier) => void
  onDelete: (id: string) => void
}

const FILTER_OPTIONS: Array<{ value: FilterTier; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'T1', label: 'T1' },
  { value: 'T2', label: 'T2' },
  { value: 'T3', label: 'T3' },
  { value: 'DQ', label: 'DQ' },
]

const TIER_COLORS: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444', all: 'var(--primary)',
}

export default function AccountList({ accounts, filter, onFilterChange, onDelete }: AccountListProps) {
  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.tier === filter)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filtres */}
      <div className="flex gap-1.5 mb-4 shrink-0">
        {FILTER_OPTIONS.map(opt => {
          const count = opt.value === 'all'
            ? accounts.length
            : accounts.filter(a => a.tier === opt.value).length
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: active ? `${TIER_COLORS[opt.value]}20` : 'var(--bg-card)',
                border: `1px solid ${active ? TIER_COLORS[opt.value] + '50' : 'var(--border)'}`,
                color: active ? TIER_COLORS[opt.value] : 'var(--text-muted)',
              }}
            >
              {opt.label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {accounts.length === 0
                ? 'Entre un nom d\'entreprise pour commencer'
                : 'Aucun compte dans ce tier'}
            </p>
          </div>
        ) : (
          filtered.map(account => (
            <AccountCard key={account.id} account={account} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  )
}
