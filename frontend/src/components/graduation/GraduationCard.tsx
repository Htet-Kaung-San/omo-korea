import type { GraduationProgress } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

interface GraduationCardProps {
  progress: GraduationProgress
  compact?: boolean
}

// ── SVG circular progress ─────────────────────────────────────────────────────

function CircleProgress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#D5DEE8"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#003d82" />
            <stop offset="100%" stopColor="#0054a6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold leading-none text-pnu-text">{value}</span>
        <span className="text-[9px] text-pnu-muted mt-0.5">/ {max} cr</span>
        <span className="text-[10px] font-semibold text-pnu-blue-light mt-0.5">
          {max > 0 ? Math.round((value / max) * 100) : 0}%
        </span>
      </div>
    </div>
  )
}

// ── Single bar row ────────────────────────────────────────────────────────────

interface BarRowProps {
  label: string
  completed: number
  required: number
  color: string   
}

function BarRow({ label, completed, required, color }: BarRowProps) {
  const pct = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0

  return (
    <div className="flex items-center gap-3">
      {/* Left Label (Fixed width to align bars) */}
      <span className="w-28 shrink-0 text-[12px] font-semibold text-[#0F172A] truncate">
        {label}
      </span>
      
      {/* Middle Bar (Flex-1 stretches to fill space) */}
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={required}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {/* Right Numbers (Fixed width to prevent jumping) */}
      <span className="w-10 shrink-0 text-right text-[11px] font-medium text-[#64748B]">
        {completed}<span className="text-[#CBD5E1]">/{required}</span>
      </span>
    </div>
  )
}

// ── GraduationCard ────────────────────────────────────────────────────────────

const BARS: Array<{
  key: keyof GraduationProgress['breakdown']
  label: string
  labelKo: string
  color: string
}> = [
  { key: 'generalRequired', label: 'General Required', labelKo: '교양필수',  color: 'linear-gradient(90deg,#1E3A8A,#2563EB)' },
  { key: 'generalElective', label: 'General Elective', labelKo: '교양선택',  color: 'linear-gradient(90deg,#0EA5E9,#38BDF8)' },
  { key: 'majorBasic',      label: 'Major Basic',      labelKo: '전공기초',  color: 'linear-gradient(90deg,#7C3AED,#A78BFA)' },
  { key: 'majorRequired',   label: 'Major Required',   labelKo: '전공필수',  color: 'linear-gradient(90deg,#059669,#34D399)' },
  { key: 'majorElective',   label: 'Major Elective',   labelKo: '전공선택',  color: 'linear-gradient(90deg,#D97706,#FCD34D)' },
  { key: 'generalFree',     label: 'General Free',     labelKo: '일반선택',  color: 'linear-gradient(90deg,#DB2777,#F472B6)' },
]

export function GraduationCard({ progress, compact }: GraduationCardProps) {
  const { t } = useLanguage()
  const { totalCompleted, totalRequired, breakdown } = progress
  const percentage = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0

  if (compact) {
    return (
      <div className="rounded-[16px] bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-pnu-text">
            {totalCompleted}
            <span className="font-medium text-pnu-muted"> / {totalRequired} cr</span>
          </p>
          <span className="rounded-full bg-pnu-blue/10 px-2 py-0.5 text-[10px] font-bold text-pnu-blue">
            {t('graduation.donePercent', { percent: percentage })}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={totalCompleted}
          aria-valuemin={0}
          aria-valuemax={totalRequired}
        >
          <div
            className="h-full rounded-full bg-pnu-blue transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* ── Header strip ── */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}
      >
        <p className="text-[13px] font-semibold text-white/90 tracking-wide uppercase">
          {t('graduation.title')}
        </p>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-bold text-white">
          {t('graduation.donePercent', { percent: percentage })}
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex flex-col items-center justify-center gap-3 md:w-[30%] shrink-0">
            <CircleProgress value={totalCompleted} max={totalRequired} />
          </div>

          <div className="flex-1 space-y-3 w-full border-t border-[#F1F5F9] pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            {BARS.map(({ key, label, color }) => (
              <BarRow
                key={key}
                label={label}
                completed={breakdown[key].completed}
                required={breakdown[key].required}
                color={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
