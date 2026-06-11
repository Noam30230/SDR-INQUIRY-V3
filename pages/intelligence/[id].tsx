import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import AuthGuard from '@/components/layout/AuthGuard'
import AppNav from '@/components/layout/AppNav'
import { supabaseBrowser } from '@/lib/supabase'
import type { Account, Tier } from '@/types'
import type { DealData, DealContact, DealMeeting, DealStage, ContactRole } from '@/lib/account-intelligence/types'
import { STAGE_LABELS, STAGE_ORDER, ROLE_OPTIONS, emptyDeal } from '@/lib/account-intelligence/types'

const TIER_COLORS: Record<Tier, string> = {
  T1: '#10b981', T2: '#f59e0b', T3: '#f97316', DQ: '#ef4444',
}

const ROLE_COLORS: Record<ContactRole, string> = {
  'Economic Buyer': '#7c3aed',
  'Validated Champion': '#10b981',
  'Potential Champion': '#f59e0b',
  'Coach': '#3b82f6',
  'Technical Validator': '#06b6d4',
  'Other': '#6b7280',
}

async function getToken(): Promise<string> {
  const { data } = await supabaseBrowser.auth.getSession()
  return data.session?.access_token || ''
}

async function api(path: string, options: RequestInit = {}) {
  const token = await getToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
  color: 'white', outline: 'none', boxSizing: 'border-box',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '16px 18px',
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'white', marginBottom: 12,
}

// ─── Role chip ───────────────────────────────────────────────────────────────

function RoleChip({ role }: { role: ContactRole }) {
  const color = ROLE_COLORS[role] ?? '#6b7280'
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap',
      color, background: `${color}16`, border: `1px solid ${color}40`,
    }}>
      {role}
    </span>
  )
}

// ─── Stage stepper ───────────────────────────────────────────────────────────

function StageStepper({ stage, onChange }: { stage: DealStage; onChange: (s: DealStage) => void }) {
  const currentIdx = STAGE_ORDER.indexOf(stage)
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {STAGE_ORDER.map((s, i) => {
        const active = s === stage
        const passed = i < currentIdx
        const isWon = s === 'closed_won'
        const isLost = s === 'closed_lost'
        const activeColor = isWon ? '#10b981' : isLost ? '#ef4444' : '#7c3aed'
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            style={{
              fontSize: 10.5, fontWeight: active ? 700 : 500, padding: '5px 10px', borderRadius: 8,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
              color: active ? 'white' : passed ? '#a78bfa' : 'var(--text-muted)',
              background: active ? activeColor : passed ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
              border: active ? `1px solid ${activeColor}` : '1px solid var(--border)',
            }}
          >
            {STAGE_LABELS[s]}
          </button>
        )
      })}
    </div>
  )
}

// ─── Contacts panel ──────────────────────────────────────────────────────────

function ContactsPanel({ contacts, onSave }: {
  contacts: DealContact[]
  onSave: (contacts: DealContact[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<{ name: string; title: string; role: ContactRole; email: string }>({ name: '', title: '', role: 'Potential Champion', email: '' })

  function add() {
    if (!draft.name.trim()) return
    onSave([...contacts, {
      id: `c_${Date.now()}`,
      name: draft.name.trim(),
      title: draft.title.trim(),
      role: draft.role,
      email: draft.email.trim() || undefined,
    }])
    setDraft({ name: '', title: '', role: 'Potential Champion', email: '' })
    setAdding(false)
  }

  function updateRole(id: string, role: ContactRole) {
    onSave(contacts.map(c => c.id === id ? { ...c, role } : c))
  }

  function remove(id: string) {
    onSave(contacts.filter(c => c.id !== id))
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ ...sectionLabel, marginBottom: 0 }}>Stakeholders</span>
        <button
          onClick={() => setAdding(v => !v)}
          style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {contacts.length === 0 && !adding && (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Add the people you talk to — name, role in the deal. They feed the stakeholder map and outbound messages.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {contacts.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
              {c.title && <p style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>}
            </div>
            <select
              value={c.role}
              onChange={e => updateRole(c.id, e.target.value as ContactRole)}
              style={{
                fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 7, cursor: 'pointer',
                color: ROLE_COLORS[c.role], background: `${ROLE_COLORS[c.role]}14`,
                border: `1px solid ${ROLE_COLORS[c.role]}40`, outline: 'none',
              }}
            >
              {ROLE_OPTIONS.map(r => <option key={r} value={r} style={{ background: '#1a1a2e', color: 'white' }}>{r}</option>)}
            </select>
            <button onClick={() => remove(c.id)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>✕</button>
          </div>
        ))}
      </div>

      {adding && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <input style={inputStyle} placeholder="Name *" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          <input style={inputStyle} placeholder="Job title" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          <input style={inputStyle} placeholder="Email (optional)" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={draft.role}
            onChange={e => setDraft(d => ({ ...d, role: e.target.value as ContactRole }))}
          >
            {ROLE_OPTIONS.map(r => <option key={r} value={r} style={{ background: '#1a1a2e' }}>{r}</option>)}
          </select>
          <button
            onClick={add}
            disabled={!draft.name.trim()}
            style={{
              padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none',
              opacity: draft.name.trim() ? 1 : 0.5,
            }}
          >
            Add stakeholder
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Meeting card ────────────────────────────────────────────────────────────

function MeetingCard({ meeting, onDelete, onAddContact, existingContacts }: {
  meeting: DealMeeting
  onDelete: () => void
  onAddContact: (c: { name: string; title: string; role: ContactRole }) => void
  existingContacts: DealContact[]
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const intel = meeting.intel

  function copyEmail() {
    if (!intel?.follow_up_email) return
    navigator.clipboard.writeText(`Subject: ${intel.follow_up_email.subject}\n\n${intel.follow_up_email.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const knownNames = new Set(existingContacts.map(c => c.name.toLowerCase()))
  const appliedCorrections = intel?.corrections?.filter(c => c.applied) ?? []

  const subLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 5, marginTop: 12 }
  const bodyText: React.CSSProperties = { fontSize: 11.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.75)' }

  return (
    <div style={{ borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a78bfa', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', flexShrink: 0 }}>
          {STAGE_LABELS[meeting.stage]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.title}</p>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
            {meeting.date} · {meeting.kind === 'transcript' ? 'Transcript' : 'Notes'}
            {appliedCorrections.length > 0 && <span style={{ color: '#34d399' }}> · {appliedCorrections.length} correction{appliedCorrections.length > 1 ? 's' : ''} applied</span>}
          </p>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && intel && (
        <div style={{ padding: '0 13px 13px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={subLabel}>Summary</div>
          <p style={bodyText}>{intel.summary}</p>

          {appliedCorrections.length > 0 && (
            <>
              <div style={subLabel}>Corrections applied to account data</div>
              {appliedCorrections.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 8, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 5 }}>
                  <span style={{ color: '#34d399', fontSize: 11 }}>✓</span>
                  <p style={{ fontSize: 11, color: '#6ee7b7' }}>{c.field} → {c.new_values.join(', ')}</p>
                </div>
              ))}
            </>
          )}

          {intel.stakeholders_mentioned.length > 0 && (
            <>
              <div style={subLabel}>People mentioned</div>
              {intel.stakeholders_mentioned.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <p style={{ ...bodyText, flex: 1 }}>
                    <strong style={{ color: 'white' }}>{s.name}</strong>{s.title ? ` — ${s.title}` : ''}
                  </p>
                  <RoleChip role={s.suggested_role} />
                  {!knownNames.has(s.name.toLowerCase()) && (
                    <button
                      onClick={() => onAddContact({ name: s.name, title: s.title, role: s.suggested_role })}
                      style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {intel.champion_updates.length > 0 && (
            <>
              <div style={subLabel}>Champion signals</div>
              {intel.champion_updates.map((u, i) => (
                <p key={i} style={{ ...bodyText, marginBottom: 4 }}>
                  <strong style={{ color: '#34d399' }}>{u.name}</strong> → {u.suggestion}: {u.evidence}
                </p>
              ))}
            </>
          )}

          {intel.pains.length > 0 && (
            <>
              <div style={subLabel}>Pains heard</div>
              {intel.pains.map((p, i) => <p key={i} style={{ ...bodyText, marginBottom: 3 }}>• {p}</p>)}
            </>
          )}

          {intel.objections.length > 0 && (
            <>
              <div style={subLabel}>Objections & responses</div>
              {intel.objections.map((o, i) => (
                <div key={i} style={{ marginBottom: 7 }}>
                  <p style={{ ...bodyText, color: '#fca5a5' }}>« {o.objection} »</p>
                  <p style={bodyText}>→ {o.suggested_response}</p>
                </div>
              ))}
            </>
          )}

          {(intel.budget_timing || intel.competitors.length > 0) && (
            <>
              <div style={subLabel}>Budget · Timing · Competition</div>
              {intel.budget_timing && <p style={{ ...bodyText, marginBottom: 3 }}>{intel.budget_timing}</p>}
              {intel.competitors.length > 0 && <p style={bodyText}>Competitors: {intel.competitors.join(', ')}</p>}
            </>
          )}

          {intel.next_steps.length > 0 && (
            <>
              <div style={subLabel}>Next steps</div>
              {intel.next_steps.map((n, i) => <p key={i} style={{ ...bodyText, marginBottom: 3 }}>→ {n}</p>)}
            </>
          )}

          {intel.risks.length > 0 && (
            <>
              <div style={subLabel}>Risks</div>
              {intel.risks.map((r, i) => <p key={i} style={{ ...bodyText, marginBottom: 3, color: '#fbbf24' }}>⚠ {r}</p>)}
            </>
          )}

          {intel.follow_up_email && (
            <>
              <div style={subLabel}>Follow-up email (ready to send)</div>
              <div style={{ borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 5 }}>{intel.follow_up_email.subject}</p>
                <p style={{ ...bodyText, whiteSpace: 'pre-wrap' }}>{intel.follow_up_email.body}</p>
                <button
                  onClick={copyEmail}
                  style={{ marginTop: 8, fontSize: 10.5, fontWeight: 700, color: copied ? '#34d399' : '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {copied ? '✓ Copied' : 'Copy email'}
                </button>
              </div>
            </>
          )}

          <button
            onClick={onDelete}
            style={{ marginTop: 12, fontSize: 10.5, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7 }}
          >
            Delete this meeting
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Add meeting modal ───────────────────────────────────────────────────────

function AddMeetingModal({ defaultStage, onClose, onSubmit, submitting }: {
  defaultStage: DealStage
  onClose: () => void
  onSubmit: (data: { title: string; stage: DealStage; date: string; content: string; pdfBase64?: string; filename?: string }) => void
  submitting: boolean
}) {
  const [title, setTitle] = useState('')
  const [stage, setStage] = useState<DealStage>(defaultStage)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState('')
  const [file, setFile] = useState<{ name: string; base64?: string; text?: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(f: File) {
    if (f.name.toLowerCase().endsWith('.pdf')) {
      const buf = await f.arrayBuffer()
      let binary = ''
      const bytes = new Uint8Array(buf)
      const chunk = 0x8000
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
      }
      setFile({ name: f.name, base64: btoa(binary) })
    } else {
      const text = await f.text()
      setFile({ name: f.name, text })
    }
  }

  function submit() {
    const finalContent = [content.trim(), file?.text ?? ''].filter(Boolean).join('\n\n')
    if (!finalContent && !file?.base64) return
    onSubmit({
      title: title.trim() || `${STAGE_LABELS[stage]} — ${date}`,
      stage, date,
      content: finalContent,
      pdfBase64: file?.base64,
      filename: file?.name,
    })
  }

  const canSubmit = (content.trim() || file) && !submitting

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 560, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 3 }}>Add call notes or transcript</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>The AI extracts facts, fixes wrong data, and feeds the next brief.</p>
          </div>
          <button onClick={onClose} disabled={submitting} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8, marginBottom: 8 }}>
          <input style={inputStyle} placeholder="Title (e.g. Cold call with Sarah)" value={title} onChange={e => setTitle(e.target.value)} />
          <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <select style={{ ...inputStyle, cursor: 'pointer', marginBottom: 8 }} value={stage} onChange={e => setStage(e.target.value as DealStage)}>
          {STAGE_ORDER.map(s => <option key={s} value={s} style={{ background: '#1a1a2e' }}>{STAGE_LABELS[s]}</option>)}
        </select>

        <textarea
          style={{ ...inputStyle, minHeight: 140, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          placeholder="Paste your call notes or the full meeting transcript here…"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ fontSize: 11.5, fontWeight: 600, color: '#a78bfa', background: 'rgba(124,58,237,0.08)', border: '1px dashed rgba(124,58,237,0.35)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}
          >
            {file ? `📄 ${file.name}` : 'Or upload a PDF / .txt transcript'}
          </button>
          {file && (
            <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Remove
            </button>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            marginTop: 16, width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none',
            cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {submitting ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
              </svg>
              Analyzing the conversation…
            </>
          ) : 'Save & extract intelligence'}
        </button>
      </div>
    </div>
  )
}

// ─── Brief panel ─────────────────────────────────────────────────────────────

const GEN_STEPS = [
  'Researching the account on the web…',
  'Building the 3 Whys framework…',
  'Mapping stakeholders & writing outbound…',
  'Assembling the document…',
]

function BriefPanel({ account, deal, onGenerated }: {
  account: Account
  deal: DealData
  onGenerated: (deal: DealData) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const brief = deal.brief

  useEffect(() => {
    if (!generating) return
    setGenStep(0)
    const timers = [
      setTimeout(() => setGenStep(1), 18000),
      setTimeout(() => setGenStep(2), 45000),
      setTimeout(() => setGenStep(3), 70000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [generating])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await api('/api/intelligence/generate', {
        method: 'POST',
        body: JSON.stringify({ accountId: account.id }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Generation failed')
      // Refetch deal to get the stored brief
      const dealRes = await api(`/api/intelligence/deal?accountId=${account.id}`)
      const { deal: freshDeal } = await dealRes.json()
      onGenerated(freshDeal)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    }
    setGenerating(false)
  }

  function download() {
    if (!brief) return
    const blob = new Blob([brief.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${account.company_name.replace(/\s+/g, '_')}_AccountIntelligence_v${brief.version}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openInTab() {
    if (!brief) return
    const blob = new Blob([brief.html], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ ...sectionLabel, marginBottom: 0 }}>Intelligence Brief</span>
        {brief && (
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
            v{brief.version} · {new Date(brief.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {error && (
        <div style={{ padding: '9px 12px', borderRadius: 9, marginBottom: 10, fontSize: 11.5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {generating ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: 320 }}>
          <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" style={{ marginBottom: 18 }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
          </svg>
          {GEN_STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, opacity: i <= genStep ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              <span style={{ fontSize: 11, color: i < genStep ? '#34d399' : i === genStep ? '#a78bfa' : 'var(--text-muted)' }}>
                {i < genStep ? '✓' : i === genStep ? '●' : '○'}
              </span>
              <span style={{ fontSize: 12, color: i <= genStep ? 'white' : 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 12 }}>60–90 seconds — don&apos;t close this page</p>
        </div>
      ) : brief ? (
        <>
          <div style={{ flex: 1, minHeight: 380, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'white' }}>
            <iframe
              srcDoc={brief.html}
              title="Brief preview"
              style={{ width: '100%', height: '100%', minHeight: 380, border: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={download}
              style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none' }}
            >
              Download HTML
            </button>
            <button
              onClick={openInTab}
              style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Open full screen
            </button>
            <button
              onClick={generate}
              title="Regenerate with all the latest meetings and corrections"
              style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              ↻ Regenerate (v{brief.version + 1})
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', minHeight: 320 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 6 }}>No brief yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.55, marginBottom: 18 }}>
            Generates a full discovery-ready document: 3 Whys, stakeholder map, value messaging, personalised outbound, and call prep questions.
            {deal.contacts.length === 0 && ' Tip: add your stakeholders first for a sharper result.'}
          </p>
          <button
            onClick={generate}
            style={{ padding: '11px 26px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', boxShadow: '0 0 24px rgba(124,58,237,0.3)' }}
          >
            Generate Discovery Brief
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DealRoomPage() {
  const router = useRouter()
  const accountId = router.query.id as string | undefined

  const [account, setAccount] = useState<Account | null>(null)
  const [deal, setDeal] = useState<DealData>(emptyDeal())
  const [loading, setLoading] = useState(true)
  const [showAddMeeting, setShowAddMeeting] = useState(false)
  const [submittingMeeting, setSubmittingMeeting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!accountId) return
    const res = await api(`/api/intelligence/deal?accountId=${accountId}`)
    if (res.ok) {
      const body = await res.json()
      setAccount(body.account)
      setDeal(body.deal)
    }
    setLoading(false)
  }, [accountId])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function saveDealPatch(patch: { stage?: DealStage; contacts?: DealContact[] }) {
    if (!accountId) return
    // Optimistic update
    setDeal(d => ({ ...d, ...patch }))
    await api('/api/intelligence/deal', {
      method: 'PUT',
      body: JSON.stringify({ accountId, ...patch }),
    })
  }

  async function addMeeting(data: { title: string; stage: DealStage; date: string; content: string; pdfBase64?: string }) {
    if (!accountId) return
    setSubmittingMeeting(true)
    try {
      const res = await api('/api/intelligence/meeting', {
        method: 'POST',
        body: JSON.stringify({ accountId, ...data }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to save meeting')
      setDeal(body.deal)
      if (body.stackChanged && account) {
        setAccount({ ...account, tech_stack: body.tech_stack })
        showToast('✓ Meeting analyzed — account data corrected from your notes')
      } else {
        showToast('✓ Meeting analyzed — intelligence extracted')
      }
      setShowAddMeeting(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save meeting')
    }
    setSubmittingMeeting(false)
  }

  async function deleteMeeting(meetingId: string) {
    if (!accountId) return
    const res = await api(`/api/intelligence/meeting?accountId=${accountId}&meetingId=${meetingId}`, { method: 'DELETE' })
    if (res.ok) {
      const body = await res.json()
      setDeal(body.deal)
    }
  }

  function addContactFromIntel(c: { name: string; title: string; role: ContactRole }) {
    const next = [...deal.contacts, { id: `c_${Date.now()}`, name: c.name, title: c.title, role: c.role }]
    saveDealPatch({ contacts: next })
    showToast(`✓ ${c.name} added to stakeholders`)
  }

  const tier = account?.tier as Tier | undefined
  const cloudStack = account?.tech_stack?.Cloud ?? []

  return (
    <AuthGuard>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
        <AppNav />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {loading || !account ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 32px 48px' }}>

              {/* Header */}
              <button
                onClick={() => router.push('/intelligence')}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 14 }}
              >
                ← Account Intelligence
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{account.company_name}</h1>
                {tier && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 7, color: TIER_COLORS[tier], background: `${TIER_COLORS[tier]}18`, border: `1px solid ${TIER_COLORS[tier]}40` }}>
                    {tier} · {account.score}
                  </span>
                )}
                {account.domain && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{account.domain}</span>}
                {cloudStack.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, color: '#93c5fd', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    ☁ {cloudStack.join(', ')}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 22 }}>
                <StageStepper stage={deal.stage} onChange={s => saveDealPatch({ stage: s })} />
              </div>

              {/* 2-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: 16, alignItems: 'start' }}>

                {/* Left: stakeholders + timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <ContactsPanel contacts={deal.contacts} onSave={c => saveDealPatch({ contacts: c })} />

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ ...sectionLabel, marginBottom: 0 }}>Timeline</span>
                      <button
                        onClick={() => setShowAddMeeting(true)}
                        style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        + Add notes / transcript
                      </button>
                    </div>

                    {deal.meetings.length === 0 ? (
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Log your cold call notes here. After each meeting, paste the notes or upload the transcript — the brief learns from every conversation.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {deal.meetings.map(m => (
                          <MeetingCard
                            key={m.id}
                            meeting={m}
                            existingContacts={deal.contacts}
                            onDelete={() => deleteMeeting(m.id)}
                            onAddContact={addContactFromIntel}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: brief */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 560 }}>
                  <BriefPanel account={account} deal={deal} onGenerated={setDeal} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddMeeting && (
        <AddMeetingModal
          defaultStage={deal.stage}
          onClose={() => !submittingMeeting && setShowAddMeeting(false)}
          onSubmit={addMeeting}
          submitting={submittingMeeting}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          padding: '11px 20px', borderRadius: 11, fontSize: 12.5, fontWeight: 600,
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7',
          backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}
    </AuthGuard>
  )
}
