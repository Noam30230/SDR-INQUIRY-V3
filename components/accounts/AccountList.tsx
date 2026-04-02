import { useState, useRef, useEffect } from 'react'
import type { Account, Tier } from '@/types'
import AccountCard from './AccountCard'

type FilterTier = 'all' | Tier
type SortOption = 'score_desc' | 'score_asc' | 'name' | 'recent'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Recent' },
  { value: 'score_desc', label: 'Score ↓' },
  { value: 'score_asc', label: 'Score ↑' },
  { value: 'name', label: 'Name' },
]

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

function sortAccounts(accounts: Account[], sort: SortOption): Account[] {
  return [...accounts].sort((a, b) => {
    if (sort === 'score_desc') return (b.score ?? 0) - (a.score ?? 0)
    if (sort === 'score_asc') return (a.score ?? 0) - (b.score ?? 0)
    if (sort === 'name') return a.company_name.localeCompare(b.company_name)
    if (sort === 'recent') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    return 0
  })
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
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

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function expand() {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function collapse() {
    if (!value) setExpanded(false)
  }

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{
        width: expanded ? '160px' : '28px',
        transition: 'width 0.2s ease',
        background: expanded ? 'var(--bg-card)' : 'transparent',
        border: `1px solid ${expanded ? 'var(--border)' : 'transparent'}`,
      }}
    >
      <button
        onClick={expand}
        className="shrink-0 w-7 h-7 flex items-center justify-center text-sm"
        style={{ color: value ? '#a78bfa' : 'var(--text-muted)' }}
        title="Search"
      >
        ⌕
      </button>
      {expanded && (
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={collapse}
          placeholder="Search..."
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: 'var(--text)' }}
        />
      )}
      {expanded && value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange('') }}
          className="shrink-0 pr-2 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl h-12 animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
  )
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

export default function AccountList({ accounts, filter, onFilterChange, onDelete, isLoading, selectedIds, onToggleSelect, onToggleSelectAll }: AccountListProps) {
  const [sort, setSort] = useState<SortOption>('recent')
  const [search, setSearch] = useState('')

  const base = filter === 'all' ? accounts : accounts.filter(a => a.tier === filter)
  const searched = search ? base.filter(a =>
    a.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.domain ?? '').toLowerCase().includes(search.toLowerCase())
  ) : base
  const filtered = sortAccounts(searched, sort)
  const filteredIds = filtered.map(a => a.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds?.has(id))

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1.5 mb-4 shrink-0 flex-wrap">
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
          const count = opt.value === 'all' ? accounts.length : accounts.filter(a => a.tier === opt.value).length
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
              {opt.label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-1.5">
          <SearchBar value={search} onChange={setSearch} />
          <SortDropdown sort={sort} onSort={setSort} />
        </div>

        {(selectedIds?.size ?? 0) > 0 && (
          <span className="text-xs" style={{ color: '#a78bfa' }}>
            {selectedIds!.size} selected
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : filtered.length === 0 ? (
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
                <p className="text-sm font-medium text-white mb-1">
                  {search ? `No results for "${search}"` : `No ${filter} accounts`}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'Try a different search term' : 'Try a different filter'}
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
