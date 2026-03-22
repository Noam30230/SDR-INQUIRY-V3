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
  const stopRef = useRef(false)

  const loadAccounts = useCallback(async () => {
    const res = await authFetch('/api/accounts')
    if (res.ok) {
      const data = await res.json()
      setAccounts(data as Account[])
    }
  }, [])

  useEffect(() => {
    loadAccounts()

    const channel = supabaseBrowser
      .channel('accounts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        loadAccounts()
      })
      .subscribe()

    return () => { supabaseBrowser.removeChannel(channel) }
  }, [loadAccounts])

  async function scoreOne(name: string, domain?: string) {
    setIsScoring(true)
    try {
      await authFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ companyName: name, domain }),
      })
    } finally {
      setIsScoring(false)
    }
  }

  async function scoreBatch(items: Array<{ name: string; domain?: string }>) {
    stopRef.current = false
    setIsScoring(true)
    for (const item of items) {
      if (stopRef.current) break
      await authFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ companyName: item.name, domain: item.domain }),
      })
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
          onScoreOne={scoreOne}
          onScoreBatch={scoreBatch}
          onStopBatch={stopBatch}
          onExport={handleExport}
        />
        <main className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-white">Comptes scorés</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {accounts.length} compte{accounts.length !== 1 ? 's' : ''}
                {accounts.filter(a => a.status === 'scoring').length > 0 && (
                  <span className="ml-2" style={{ color: 'var(--primary)' }}>
                    · {accounts.filter(a => a.status === 'scoring').length} en cours...
                  </span>
                )}
              </p>
            </div>
          </div>
          <AccountList
            accounts={accounts}
            filter={filter}
            onFilterChange={setFilter}
            onDelete={deleteAccount}
          />
        </main>
      </div>
    </AuthGuard>
  )
}
