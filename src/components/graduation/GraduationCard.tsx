import type { GraduationProgress } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

interface GraduationCardProps {
  progress: GraduationProgress
  compact?: boolean
}

// ── SVG circular progress ─────────────────────────────────────────────────────

function CircleProgress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        {/* Track */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="12"
        />
        {/* Progress arc */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-bold leading-none text-[#0F172A]">{value}</span>
        <span className="text-[11px] text-[#64748B] mt-0.5">/ {max} cr</span>
        <span className="text-[10px] font-semibold text-[#2563EB] mt-1">
          {max > 0 ? Math.round((value / max) * 100) : 0}%
        </span>
      </div>
    </div>
  )
}

// ── Single bar row ────────────────────────────────────────────────────────────

interface BarRowProps {
  label: string
  labelKo: string
  completed: number
  required: number
  color: string   // Tailwind inline hex for the bar
}

function BarRow({ label, labelKo, completed, required, color }: BarRowProps) {
  const pct = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold text-[#0F172A]">{label}</span>
          <span className="text-[11px] text-[#94A3B8]">{labelKo}</span>
        </div>
        <span className="text-[12px] font-medium text-[#64748B]">
          {completed}<span className="text-[#CBD5E1]">/{required}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={required}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
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

      <div className="px-5 py-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          
          {/* Left Column: Circle & Text (Stacked) */}
          <div className="flex flex-col items-center justify-center gap-4 md:w-1/3">
            <CircleProgress value={totalCompleted} max={totalRequired} />
            <div className="text-center space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                {t('graduation.totalCredits')}
              </p>
              <p className="text-[28px] font-bold leading-none text-[#0F172A]">
                {totalCompleted}
                <span className="text-[16px] font-medium text-[#94A3B8]"> / {totalRequired}</span>
              </p>
              <p className="text-[12px] text-[#64748B] pt-1">
                {t('graduation.remaining', {
                  count: Math.max(totalRequired - totalCompleted, 0),
                })}
              </p>
            </div>
          </div>

          {/* Right Column: Expanding Bars */}
          {!compact && (
            <div className="flex-1 space-y-3.5 w-full border-t border-[#F1F5F9] pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              {BARS.map(({ key, label, labelKo, color }) => (
                <BarRow
                  key={key}
                  label={label}
                  labelKo={labelKo}
                  completed={breakdown[key].completed}
                  required={breakdown[key].required}
                  color={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
