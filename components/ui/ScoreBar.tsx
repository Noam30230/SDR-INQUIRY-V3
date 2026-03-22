interface ScoreBarProps {
  score: number
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  if (score >= 25) return '#6b7280'
  return '#ef4444'
}

export default function ScoreBar({ score }: ScoreBarProps) {
  const color = scoreColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--border)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-semibold tabular-nums" style={{ color, minWidth: 28 }}>
        {score}
      </span>
    </div>
  )
}
