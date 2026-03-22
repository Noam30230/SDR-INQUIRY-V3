import type { Account, Tier } from '@/types'
import AccountCard from './AccountCard'

type FilterTier = 'all' | Tier

interface AccountListProps {
  accounts: Account[]
  filter: FilterTier
  onFilterChange: (f: FilterTier) => void
  onDelete: (id: string) => void
  isLoading?: boolean  // Fix #4: loading state prop
}

const FILTER_OPTIONS: Array<{ value: FilterTier; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'T1', label: 'T1' },
  { value: 'T2', label: 'T2' },
  { value: 'T3', label: 'T3' },
  { value: 'DQ', label: 'DQ' },
]

const TIER_COLORS: Record<string, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444', all: 'var(--primary)',
}

// Fix #4: skeleton cards while loading
function SkeletonCard() {
  return (
    <div className="rounded-xl h-12 animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
  )
}

export default function AccountList({ accounts, filter, onFilterChange, onDelete, isLoading }: AccountListProps) {
  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.tier === filter)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filters */}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">

        {/* Fix #4: show skeletons while loading */}
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          // Fix #3: improved empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {accounts.length === 0 ? (
              <>
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-sm font-medium text-white mb-1">No accounts yet</p>
                <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
                  Add a company in the sidebar — enter its name and website URL to get started.
                </p>
                <div className="mt-4 px-4 py-2 rounded-lg text-xs" style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  color: '#a78bfa',
                }}>
                  Format: <code>Pennylane, pennylane.com</code>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-sm font-medium text-white mb-1">No {filter} accounts</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Try a different filter above
                </p>
              </>
            )}
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
