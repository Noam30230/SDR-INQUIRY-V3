import { useState, useRef, useEffect } from 'react'
import type { Account, Tier } from '@/types'
import AccountCard from './AccountCard'

type FilterTier = 'all' | Tier
type SortOption = 'score_desc' | 'score_asc' | 'name' | 'recent'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'score_desc', label: 'Score ↓' },
  { value: 'score_asc', label: 'Score ↑' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recent' },
]

function sortAccounts(accounts: Account[], sort: SortOption): Account[] {
  return [...accounts].sort((a, b) => {
    if (sort === 'score_desc') return (b.score ?? 0) - (a.score ?? 0)
    if (sort === 'score_asc') return (a.score ?? 0) - (b.score ?? 0)
    if (sort === 'name') return a.company_name.localeCompare(b.company_name)
    if (sort === 'recent') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    return 0
  })
}

interface AccountListProps {
  accounts: Account[]
  filter: FilterTier
  onFilterChange: (f: FilterTier) => void
  onDelete: (id: string) => void
  isLoading?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: (ids: string[]) => void
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

function SortDropdown({ sort, onSort }: { sort: SortOption; onSort: (s: SortOption) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = SORT_OPTIONS.find(o => o.value === sort)!

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative ml-auto" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        ↕ {current.label} <span className="opacity-50">▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-[120px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSort(opt.value); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
              style={{ color: sort === opt.value ? '#a78bfa' : 'var(--text-muted)' }}
            >
              {sort === opt.value && <span className="mr-1.5">✓</span>}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Fix #4: skeleton cards while loading
function SkeletonCard() {
  return (
    <div className="rounded-xl h-12 animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
  )
}

export default function AccountList({ accounts, filter, onFilterChange, onDelete, isLoading, selectedIds, onToggleSelect, onToggleSelectAll }: AccountListProps) {
  const [sort, setSort] = useState<SortOption>('score_desc')
  const filtered = sortAccounts(filter === 'all' ? accounts : accounts.filter(a => a.tier === filter), sort)
  const filteredIds = filtered.map(a => a.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds?.has(id))

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filters + select all */}
      <div className="flex items-center gap-1.5 mb-4 shrink-0">
        {onToggleSelectAll && filtered.length > 0 && (
          <button
            onClick={() => onToggleSelectAll(filteredIds)}
            className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"
            style={{
              background: allSelected ? 'rgba(124,58,237,0.3)' : 'var(--bg-card)',
              border: `1px solid ${allSelected ? 'rgba(124,58,237,0.6)' : 'var(--border)'}`,
            }}
            title={allSelected ? 'Deselect all' : 'Select all visible'}
          >
            {allSelected && <span className="text-violet-300 text-xs leading-none">✓</span>}
          </button>
        )}
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
        <SortDropdown sort={sort} onSort={setSort} />
        {(selectedIds?.size ?? 0) > 0 && (
          <span className="text-xs" style={{ color: '#a78bfa' }}>
            {selectedIds!.size} selected
          </span>
        )}
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
            <AccountCard
              key={account.id}
              account={account}
              onDelete={onDelete}
              selected={selectedIds?.has(account.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
