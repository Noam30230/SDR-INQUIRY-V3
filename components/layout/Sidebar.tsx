import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import type { Account, Tier } from '@/types'
import { detectColumns, parseRows, type ParsedRow } from '@/lib/csv-parser'

interface SidebarProps {
  accounts: Account[]
  isScoring: boolean
  selectedIds?: Set<string>
  exportLabel?: string
  remainingCount?: number
  onScoreBatch: (items: ParsedRow[], searchDepth: 'standard' | 'deep') => Promise<void>
  onStopBatch: () => void
  onExport: () => void
}

const TIERS: Array<{ tier: Tier; color: string }> = [
  { tier: 'T1', color: '#10b981' },
  { tier: 'T2', color: '#f59e0b' },
  { tier: 'T3', color: '#f97316' },
  { tier: 'DQ', color: '#ef4444' },
]

function isValidDomain(d: string): boolean {
  const clean = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(clean)
}

function parseTextarea(raw: string): ParsedRow[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        name: parts[0] || undefined,
        domain: parts[1] || '',
        salesforceId: parts[2] || undefined,
      }
    })
    .filter(r => (r.name?.length ?? 0) > 0)
}

interface LineError { line: number; text: string; reason: string }

function validateManualInput(raw: string): LineError[] {
  const errors: LineError[] = []
  raw.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const parts = trimmed.split(',').map(p => p.trim())
    if (parts.length < 2 || !parts[1]) {
      errors.push({ line: i + 1, text: trimmed, reason: 'missing domain' })
    } else if (!isValidDomain(parts[1])) {
      errors.push({ line: i + 1, text: trimmed, reason: `"${parts[1]}" is not a valid domain` })
    } else if (!parts[0]) {
      errors.push({ line: i + 1, text: trimmed, reason: 'missing company name' })
    }
  })
  return errors
}

export default function Sidebar({ accounts, isScoring, remainingCount = 0, selectedIds, exportLabel, onScoreBatch, onStopBatch, onExport }: SidebarProps) {
  const [tab, setTab] = useState<'manual' | 'csv'>('manual')
  const [searchDepth, setSearchDepth] = useState<'standard' | 'deep'>('standard')
  const [text, setText] = useState('')
  const [csvPreview, setCsvPreview] = useState<ParsedRow[]>([])
  const [csvMapping, setCsvMapping] = useState<{ nameCol: string | null; domainCol: string | null; sfdcCol: string | null } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Fix #9: elapsed time counter while scoring
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!isScoring) { setElapsed(0); return }
    const interval = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [isScoring])

  const doneAccounts = accounts.filter(a => a.status === 'done')
  const scoringCount = accounts.filter(a => a.status === 'scoring' || a.status === 'pending').length
  const counters: Record<Tier, number> = {
    T1: doneAccounts.filter(a => a.tier === 'T1').length,
    T2: doneAccounts.filter(a => a.tier === 'T2').length,
    T3: doneAccounts.filter(a => a.tier === 'T3').length,
    DQ: doneAccounts.filter(a => a.tier === 'DQ').length,
  }

  const manualQueue = parseTextarea(text)
  const manualErrors = tab === 'manual' ? validateManualInput(text) : []

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '',        // auto-detect , or ; or \t
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields || []
        const data = results.data as Record<string, string>[]
        const { nameCol, domainCol, sfdcCol } = detectColumns(headers, data)
        const rows = parseRows(data, nameCol, domainCol, sfdcCol)
        setCsvPreview(rows)
        setCsvMapping({ nameCol, domainCol, sfdcCol })
      },
    })
  }

  async function handleStart() {
    const items = tab === 'manual' ? manualQueue : csvPreview
    if (items.length === 0) return
    await onScoreBatch(items, searchDepth)
    setText('')
    setCsvPreview([])
    setCsvMapping(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const queueCount = tab === 'manual' ? manualQueue.length : csvPreview.length

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 300,
        minWidth: 260,  // Fix #1: allow slight shrink on smaller screens
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        padding: '20px 16px',
      }}
    >
      {/* Header */}
      <div className="mb-5">
        <div className="mb-1">
          <div className="text-sm font-bold text-white leading-tight">Scoring</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by </span>
            <a
              href="https://www.linkedin.com/in/noamramillon/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ color: '#7c3aed' }}
            >
              Noam Ramillon
            </a>
          </div>
        </div>
        {(() => {
          const done = accounts.filter(a => a.status === 'done' && a.created_at)
          if (!done.length) return null
          const latest = done.reduce((a, b) => new Date(a.created_at!) > new Date(b.created_at!) ? a : b)
          const diff = Date.now() - new Date(latest.created_at!).getTime()
          const mins = Math.floor(diff / 60000)
          const hours = Math.floor(diff / 3600000)
          const days = Math.floor(diff / 86400000)
          const ago = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : 'just now'
          return (
            <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg> Last run {ago}
            </p>
          )
        })()}
      </div>

      {/* Tier grid */}
      <div className="grid grid-cols-4 gap-1.5 mb-5">
        {TIERS.map(({ tier, color }) => (
          <div
            key={tier}
            className="rounded-lg p-2 text-center"
            style={{ background: `${color}10`, border: `1px solid ${color}25` }}
          >
            <div className="text-lg font-bold tabular-nums leading-tight" style={{ color }}>
              {counters[tier]}
            </div>
            <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
              {tier}
            </div>
          </div>
        ))}
      </div>

      {/* Status bar — only shown while scoring */}
      {isScoring && (
        <div
          className="rounded-lg px-3 py-2 mb-4 text-xs flex items-center gap-2"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            color: '#a78bfa',
          }}
        >
          <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin shrink-0"
            style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }} />
          <span>
            Scoring {scoringCount > 1 ? `${scoringCount} accounts` : 'account'}
            <span className="ml-1 opacity-60">· {elapsed}s</span>
          </span>
        </div>
      )}

      <div className="mb-1" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Tabs */}
      <div id="onboarding-tabs" className="flex gap-1 my-3 p-1 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
        {(['manual', 'csv'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize"
            style={{
              background: tab === t ? 'var(--bg-card)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-muted)',
              border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            {t === 'manual' ? 'Manual' : 'CSV'}
          </button>
        ))}
      </div>

      {/* Manual input */}
      {tab === 'manual' && (
        <div id="onboarding-manual-area" className="space-y-2 mb-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"Pennylane, pennylane.com\nQonto, qonto.com, SF-001234"}
            rows={5}
            className="w-full px-3 py-2 text-sm text-white placeholder-gray-600 rounded-lg outline-none resize-none"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', fontFamily: 'monospace', fontStyle: 'italic' }}
          />
          {manualErrors.length > 0 && (
            <p className="text-xs" style={{ color: '#f87171', opacity: 0.8 }}>
              ⚠ {manualErrors[0].reason} (line {manualErrors[0].line}){manualErrors.length > 1 ? ` +${manualErrors.length - 1} more` : ''}
            </p>
          )}
          {/* Search depth toolbar */}
          <div className="flex items-center gap-1 pt-0.5">
            {(['standard', 'deep'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSearchDepth(mode)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: searchDepth === mode ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: searchDepth === mode ? '#a78bfa' : 'var(--text-muted)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  {mode === 'deep' && <path d="M11 8v6M8 11h6"/>}
                </svg>
                {mode === 'standard' ? 'Standard' : 'Deep search'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CSV input */}
      {tab === 'csv' && (
        <div className="space-y-2 mb-4">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setIsDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file) {
                const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
                handleCsvUpload(fakeEvent)
              }
            }}
            className="w-full flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer transition-all"
            style={{
              border: `1.5px dashed ${isDragOver ? '#7c3aed' : 'var(--border)'}`,
              background: isDragOver ? 'rgba(124,58,237,0.08)' : 'var(--bg-hover)',
              padding: '12px 8px',
            }}
          >
            <span className="text-lg">📂</span>
            <span className="text-xs font-medium" style={{ color: isDragOver ? '#a78bfa' : 'var(--text-muted)' }}>
              {csvPreview.length > 0 ? `${csvPreview.length} rows loaded` : 'Drop CSV or click to browse'}
            </span>
            {csvPreview.length > 0 ? (
              <span
                onClick={e => {
                  e.stopPropagation()
                  setCsvPreview([])
                  setCsvMapping(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="text-xs px-2 py-0.5 rounded transition-colors hover:opacity-80"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', marginTop: 2 }}
              >
                ✕ Remove file
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                company · domain · org_id (optional)
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
          />

          {csvMapping && (
            <div className="rounded-lg p-2 text-xs space-y-1.5" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <div className="flex flex-wrap gap-1 pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                {csvMapping.nameCol && (
                  <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                    name: {csvMapping.nameCol}
                  </span>
                )}
                {csvMapping.domainCol && (
                  <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
                    domain: {csvMapping.domainCol}
                  </span>
                )}
                {csvMapping.sfdcCol && (
                  <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d' }}>
                    SFDC: {csvMapping.sfdcCol}
                  </span>
                )}
              </div>
              {csvPreview.length === 0 ? (
                <p className="text-red-400">
                  ⚠ No domain values found. Check that the domain column contains URLs like <code>company.com</code>
                </p>
              ) : (
                <>
                  <p style={{ color: 'var(--text-muted)' }}>{csvPreview.length} companies detected</p>
                  <div className="max-h-20 overflow-y-auto space-y-0.5">
                    {csvPreview.slice(0, 5).map((item, i) => (
                      <div key={i} className="truncate opacity-70" style={{ color: 'var(--text-base)' }}>
                        {item.name && <span className="text-purple-300">{item.name}</span>}
                        {item.name && item.domain && <span className="opacity-40"> · </span>}
                        {item.domain}
                      </div>
                    ))}
                    {csvPreview.length > 5 && (
                      <p style={{ color: 'var(--text-muted)' }}>+{csvPreview.length - 5} more…</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {/* Search depth toolbar */}
          <div className="flex items-center gap-1 pt-0.5">
            {(['standard', 'deep'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSearchDepth(mode)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: searchDepth === mode ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: searchDepth === mode ? '#a78bfa' : 'var(--text-muted)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  {mode === 'deep' && <path d="M11 8v6M8 11h6"/>}
                </svg>
                {mode === 'standard' ? 'Standard' : 'Deep search'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start / Stop */}
      {isScoring ? (
        <div className="mb-3 space-y-1.5">
          <button
            onClick={onStopBatch}
            className="w-full py-2.5 text-sm font-semibold rounded-lg"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            ⏹ Stop
          </button>
          {remainingCount > 0 && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>{remainingCount}</span> account{remainingCount !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={handleStart}
          disabled={queueCount === 0 || manualErrors.length > 0}
          className="w-full py-2.5 text-sm font-semibold text-white rounded-lg mb-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-[0.97]"
          style={{ background: 'var(--primary)', boxShadow: '0 0 20px rgba(124,58,237,0.45)' }}
        >
          {queueCount === 0
            ? 'Add accounts to start'
            : `▶ Start analysis · ${queueCount} account${queueCount !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Export */}
      <button
        onClick={onExport}
        disabled={doneAccounts.length === 0}
        className="w-full py-2.5 text-sm font-medium rounded-lg transition-all disabled:opacity-30 mb-3 hover:-translate-y-0.5 active:scale-[0.97]"
        style={{
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.25)',
          color: '#a78bfa',
          boxShadow: '0 0 16px rgba(124,58,237,0.3)',
        }}
      >
        ↓ {exportLabel || `Export all (${doneAccounts.length})`}
      </button>

      <div className="flex-1" />

      {/* Fix #10: "GPT-4o" → "GPT-4o mini" */}
      <p className="text-xs text-center pt-3" style={{ color: 'var(--text-muted)', opacity: 0.6, borderTop: '1px solid var(--border)' }}>
        <span className="flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Web
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
            GitHub
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>
            Claude
          </span>
        </span>
      </p>
    </aside>
  )
}
