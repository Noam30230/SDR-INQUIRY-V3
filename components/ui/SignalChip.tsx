type Variant = 'tech' | 'tech-cloud' | 'tech-other' | 'positive' | 'negative' | 'neutral' | 'funding'

interface SignalChipProps {
  label: string
  variant?: Variant
}

const STYLES: Record<Variant, { color: string; bg: string; border: string }> = {
  // Tech stack — filled, no border
  tech:       { color: '#a78bfa', bg: 'rgba(124,58,237,0.13)', border: 'none' },
  'tech-cloud': { color: '#7dd3fc', bg: 'rgba(56,189,248,0.12)', border: 'none' },
  'tech-other': { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'none' },
  // Funding — outlined pill, transparent bg
  funding:    { color: '#fcd34d', bg: 'transparent', border: '1px solid rgba(252,211,77,0.5)' },
  // Signals (web quality section)
  positive:   { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' },
  negative:   { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' },
  neutral:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' },
}

export default function SignalChip({ label, variant = 'tech' }: SignalChipProps) {
  const s = STYLES[variant]
  return (
    <span
      className="inline-flex items-center rounded-full text-xs font-medium"
      style={{
        color: s.color,
        background: s.bg,
        border: s.border,
        padding: '2px 8px',
      }}
    >
      {label}
    </span>
  )
}
