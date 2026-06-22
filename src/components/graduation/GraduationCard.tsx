import type { GraduationProgress } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface GraduationCardProps {
  progress: GraduationProgress
  compact?: boolean
}

function BreakdownRow({
  label,
  completed,
  required,
}: {
  label: string
  completed: number
  required: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-pnu-text">{label}</span>
        <span className="text-pnu-muted">
          {completed} / {required}
        </span>
      </div>
      <ProgressBar value={completed} max={required} size="sm" />
    </div>
  )
}

export function GraduationCard({ progress, compact }: GraduationCardProps) {
  const { totalCompleted, totalRequired, breakdown } = progress

  return (
    <Card>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-pnu-muted">Graduation Progress</p>
          <p className="text-2xl font-bold text-pnu-text">
            {totalCompleted}
            <span className="text-base font-medium text-pnu-muted"> / {totalRequired} credits</span>
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0}%
        </span>
      </div>

      <ProgressBar value={totalCompleted} max={totalRequired} />

      {!compact ? (
        <div className="mt-5 space-y-4 border-t border-pnu-border pt-4">
          <BreakdownRow label="Required" {...breakdown.required} />
          <BreakdownRow label="Elective" {...breakdown.elective} />
          <BreakdownRow label="Gen-Ed" {...breakdown.genEd} />
        </div>
      ) : null}
    </Card>
  )
}
