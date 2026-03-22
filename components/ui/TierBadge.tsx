import type { Tier } from '@/types'

const CONFIG: Record<Tier, { label: string; color: string; bg: string; border: string }> = {
  T1: { label: 'T1', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  T2: { label: 'T2', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  T3: { label: 'T3', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
  DQ: { label: 'DQ', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
}

interface TierBadgeProps {
  tier: Tier
  size?: 'sm' | 'md'
}

export default function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const c = CONFIG[tier]
  return (
    <span
      className="inline-flex items-center font-semibold rounded"
      style={{
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        fontSize: size === 'sm' ? '11px' : '12px',
        letterSpacing: '0.05em',
      }}
    >
      {c.label}
    </span>
  )
}
