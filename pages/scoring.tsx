import { useEffect, useState, useRef, useCallback } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import AccountList from '@/components/accounts/AccountList'
import { supabaseBrowser } from '@/lib/supabase'
import type { Account, Tier } from '@/types'

type FilterTier = 'all' | Tier

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
  const [isLoading, setIsLoading] = useState(true)   // Fix #4: initial loading state
  const [toast, setToast] = useState('')              // Fix #5: duplicate feedback toast
  const [userEmail, setUserEmail] = useState('')
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
        // Fix #5: inform user instead of silently skipping
        const label = item.name || item.domain
        setToast(`"${label}" already scored`)
        setTimeout(() => setToast(''), 3500)
        continue
      }
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

  async function handleExport() {
    const token = await getToken()
    const tierParam = filter !== 'all' ? `?tier=${filter}` : ''
    const res = await fetch(`/api/export${tierParam}`, {
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

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <Sidebar
          accounts={accounts}
          isScoring={isScoring}
          userEmail={userEmail}
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
          </div>
          <AccountList
            accounts={accounts}
            filter={filter}
            onFilterChange={setFilter}
            onDelete={deleteAccount}
            isLoading={isLoading}
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
