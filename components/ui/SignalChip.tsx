interface SignalChipProps {
  label: string
  variant?: 'tech' | 'positive' | 'negative' | 'neutral'
}

const STYLES = {
  tech: { color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
  positive: { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  negative: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  neutral: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
}

export default function SignalChip({ label, variant = 'tech' }: SignalChipProps) {
  const s = STYLES[variant]
  return (
    <span
      className="inline-flex items-center rounded text-xs font-medium"
      style={{
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        padding: '2px 7px',
      }}
    >
      {label}
    </span>
  )
}
