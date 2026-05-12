type Variant = 'tech' | 'tech-cloud' | 'tech-devops' | 'tech-monitoring' | 'tech-languages' | 'tech-ai' | 'tech-data' | 'tech-other' | 'positive' | 'negative' | 'neutral' | 'funding'

interface SignalChipProps {
  label: string
  variant?: Variant
}

const STYLES: Record<Variant, { color: string; bg: string; border: string }> = {
  'tech':           { color: '#a78bfa', bg: 'rgba(124,58,237,0.13)', border: 'none' },
  'tech-cloud':     { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'none' },
  'tech-devops':    { color: '#fb923c', bg: 'rgba(249,115,22,0.12)',  border: 'none' },
  'tech-monitoring':{ color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'none' },
  'tech-languages': { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'none' },
  'tech-ai':        { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'none' },
  'tech-data':      { color: '#2dd4bf', bg: 'rgba(20,184,166,0.12)',  border: 'none' },
  'tech-other':     { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'none' },
  'funding':        { color: '#fcd34d', bg: 'transparent',            border: '1px solid rgba(252,211,77,0.5)' },
  'positive':       { color: '#34d399', bg: 'rgba(16,185,129,0.1)',   border: '1px solid rgba(16,185,129,0.2)' },
  'negative':       { color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: '1px solid rgba(239,68,68,0.2)' },
  'neutral':        { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' },
}

export default function SignalChip({ label, variant = 'tech' }: SignalChipProps) {
  const s = STYLES[variant]
  return (
    <span
      className="inline-flex items-center rounded-full text-xs font-medium"
      style={{ color: s.color, background: s.bg, border: s.border, padding: '2px 8px' }}
    >
      {label}
    </span>
  )
}
