interface ProgressBarProps {
  value: number
  max: number
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({ value, max, size = 'md', className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div
      className={['w-full overflow-hidden rounded-full bg-slate-100', height, className].join(' ')}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={[
          'rounded-full bg-gradient-to-r from-pnu-blue to-pnu-blue-light transition-all',
          height,
        ].join(' ')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
