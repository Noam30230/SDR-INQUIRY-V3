import { useEffect, useState, useRef, useCallback } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import AccountList from '@/components/accounts/AccountList'
import { supabaseBrowser } from '@/lib/supabase'
import type { Account, Tier } from '@/types'

type FilterTier = 'all' | Tier

const TIERS: Tier[] = ['T1', 'T2', 'T3', 'DQ']

function DeleteMenu({ accounts, onDelete }: { accounts: Account[]; onDelete: (t: 'all' | Tier) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<'all' | Tier | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(tier: 'all' | Tier) {
    setConfirm(tier)
    setOpen(false)
  }

  function handleConfirm() {
    if (confirm) { onDelete(confirm); setConfirm(null) }
  }

  const countByTier = (t: Tier) => accounts.filter(a => a.tier === t).length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
      >
        🗑 Delete
        <span className="opacity-60">▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-[160px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <button
            onClick={() => handleSelect('all')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 transition-colors"
            style={{ color: '#f87171' }}
          >
            Delete all ({accounts.length})
          </button>
          <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />
          {TIERS.map(t => {
            const count = countByTier(t)
            if (count === 0) return null
            return (
              <button
                key={t}
                onClick={() => handleSelect(t)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Delete {t} ({count})
              </button>
            )
          })}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm text-white mb-1 font-semibold">Delete {confirm === 'all' ? 'all accounts' : `all ${confirm} accounts`}?</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function getToken(): Promise<string> {
  const { data } = await supabaseBrowser.auth.getSession()
  return data.session?.access_token || ''
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getToken()
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

export default function ScoringPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filter, setFilter] = useState<FilterTier>('all')
  const [isScoring, setIsScoring] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const stopRef = useRef(false)

  const loadAccounts = useCallback(async () => {
    const res = await authFetch('/api/accounts')
    if (res.ok) {
      const data = await res.json()
      setAccounts(data as Account[])
    }
    setIsLoading(false)  // Fix #4: done loading
  }, [])

  useEffect(() => {
    loadAccounts()

    supabaseBrowser.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email || '')
    })

    const channel = supabaseBrowser
      .channel('accounts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        loadAccounts()
      })
      .subscribe()

    return () => { supabaseBrowser.removeChannel(channel) }
  }, [loadAccounts])

  async function scoreBatch(items: Array<{ name?: string; domain: string; salesforceId?: string }>) {
    stopRef.current = false
    setIsScoring(true)
    for (const item of items) {
      if (stopRef.current) break
      const res = await authFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ companyName: item.name, domain: item.domain, salesforceId: item.salesforceId }),
      })
      if (res.status === 409) {
        const label = item.name || item.domain
        setToast(`"${label}" already scored`)
        setTimeout(() => setToast(''), 3500)
        continue
      }
      await loadAccounts()
      await new Promise(r => setTimeout(r, 500))
    }
    setIsScoring(false)
  }

  function stopBatch() {
    stopRef.current = true
    setIsScoring(false)
  }

  async function deleteAccount(id: string) {
    await authFetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  async function deleteByTier(tier: 'all' | Tier) {
    const param = tier !== 'all' ? `?tier=${tier}` : ''
    await authFetch(`/api/accounts${param}`, { method: 'DELETE' })
    if (tier === 'all') {
      setAccounts([])
    } else {
      setAccounts(prev => prev.filter(a => a.tier !== tier))
    }
  }

  async function handleExport() {
    const token = await getToken()
    let param = ''
    if (selectedIds.size > 0) {
      param = `?ids=${Array.from(selectedIds).join(',')}`
    } else if (filter !== 'all') {
      param = `?tier=${filter}`
    }
    const res = await fetch(`/api/export${param}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account-scorer-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      }
      return new Set([...prev, ...ids])
    })
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <Sidebar
          accounts={accounts}
          isScoring={isScoring}
          userEmail={userEmail}
          selectedIds={selectedIds}
          exportLabel={
            selectedIds.size > 0
              ? `Export selected (${selectedIds.size})`
              : filter !== 'all'
              ? `Export ${filter} (${accounts.filter(a => a.tier === filter).length})`
              : undefined
          }
          onScoreBatch={scoreBatch}
          onStopBatch={stopBatch}
          onExport={handleExport}
        />
        <main className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-white">Scored accounts</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>
            {accounts.length > 0 && (
              <DeleteMenu accounts={accounts} onDelete={deleteByTier} />
            )}
          </div>
          <AccountList
            accounts={accounts}
            filter={filter}
            onFilterChange={setFilter}
            onDelete={deleteAccount}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        </main>

        {/* Fix #5: toast for already-scored duplicates */}
        {toast && (
          <div
            className="fixed bottom-5 right-5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg z-50 transition-all"
            style={{
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#fcd34d',
            }}
          >
            ⚠ {toast}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
