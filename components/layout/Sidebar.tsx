import { useState, useRef } from 'react'
import Papa from 'papaparse'
import type { Account, Tier } from '@/types'
import { supabaseBrowser } from '@/lib/supabase'

interface SidebarProps {
  accounts: Account[]
  isScoring: boolean
  onScoreOne: (name: string, domain?: string) => Promise<void>
  onScoreBatch: (items: Array<{ name: string; domain?: string }>) => Promise<void>
  onStopBatch: () => void
  onExport: () => void
}

const TIER_COLORS: Record<Tier, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#6b7280', DQ: '#ef4444',
}

function TierCounter({ tier, count }: { tier: Tier; count: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: TIER_COLORS[tier] }} />
        <span className="text-sm font-medium" style={{ color: TIER_COLORS[tier] }}>{tier}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-white">{count}</span>
    </div>
  )
}

export default function Sidebar({ accounts, isScoring, onScoreOne, onScoreBatch, onStopBatch, onExport }: SidebarProps) {
  const [companyName, setCompanyName] = useState('')
  const [domain, setDomain] = useState('')
  const [csvPreview, setCsvPreview] = useState<Array<{ name: string; domain?: string }>>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const doneAccounts = accounts.filter(a => a.status === 'done')
  const counters = {
    T1: doneAccounts.filter(a => a.tier === 'T1').length,
    T2: doneAccounts.filter(a => a.tier === 'T2').length,
    T3: doneAccounts.filter(a => a.tier === 'T3').length,
    DQ: doneAccounts.filter(a => a.tier === 'DQ').length,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) return
    await onScoreOne(companyName.trim(), domain.trim() || undefined)
    setCompanyName('')
    setDomain('')
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const items = (results.data as Record<string, string>[]).map(row => ({
          name: row['company'] || row['Company'] || row['name'] || row['Name'] || Object.values(row)[0] || '',
          domain: row['domain'] || row['Domain'] || undefined,
        })).filter(item => item.name.trim())
        setCsvPreview(items)
      },
    })
  }

  async function handleStartBatch() {
    if (csvPreview.length === 0) return
    await onScoreBatch(csvPreview)
    setCsvPreview([])
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleLogout() {
    supabaseBrowser.auth.signOut()
  }

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 280,
        minWidth: 280,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        padding: '20px 16px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <span className="text-base">⚡</span>
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">Account Scorer</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Datadog SDR</div>
        </div>
      </div>

      {/* Manual input */}
      <form onSubmit={handleSubmit} className="space-y-2 mb-5">
        <input
          type="text"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          placeholder="Company name"
          className="w-full px-3 py-2 text-sm text-white placeholder-gray-600 rounded-lg outline-none"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        />
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="domain.com (optional)"
          className="w-full px-3 py-2 text-sm text-white placeholder-gray-600 rounded-lg outline-none"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        />
        <button
          type="submit"
          disabled={!companyName.trim() || isScoring}
          className="w-full py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--primary)' }}
        >
          ▶ Score this account
        </button>
      </form>

      <div className="mb-4" style={{ borderTop: '1px solid var(--border)' }} />

      {/* CSV Upload */}
      <div className="mb-4 space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          CSV Import
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        />
        <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          Columns: <code className="text-purple-300">company</code>, <code className="text-purple-300">domain</code>
        </p>

        {csvPreview.length > 0 && (
          <div className="rounded-lg p-2 text-xs" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>{csvPreview.length} companies detected</p>
            <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5">
              {csvPreview.slice(0, 5).map((item, i) => (
                <p key={i} className="truncate text-white opacity-70">{item.name}</p>
              ))}
              {csvPreview.length > 5 && (
                <p style={{ color: 'var(--text-muted)' }}>+{csvPreview.length - 5} more...</p>
              )}
            </div>
          </div>
        )}

        {csvPreview.length > 0 && (
          <div className="flex gap-1.5">
            <button
              onClick={handleStartBatch}
              disabled={isScoring}
              className="flex-1 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40"
              style={{ background: 'var(--primary)' }}
            >
              ▶ Start ({csvPreview.length})
            </button>
            <button
              onClick={() => { setCsvPreview([]); if (fileRef.current) fileRef.current.value = '' }}
              className="px-3 py-2 text-xs rounded-lg"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        )}

        {isScoring && csvPreview.length === 0 && (
          <button
            onClick={onStopBatch}
            className="w-full py-2 text-xs font-semibold rounded-lg"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            ⏹ Stop
          </button>
        )}
      </div>

      <div className="mb-4" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Counters */}
      <div className="mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
          Results
        </label>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {((['T1', 'T2', 'T3', 'DQ'] as Tier[])).map(tier => (
            <TierCounter key={tier} tier={tier} count={counters[tier]} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total scored</span>
          <span className="text-sm font-bold text-white">{doneAccounts.length}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Export + Logout */}
      <div className="space-y-2 mt-4">
        <button
          onClick={onExport}
          disabled={doneAccounts.length === 0}
          className="w-full py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          ↓ Export CSV
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-2 text-xs rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
