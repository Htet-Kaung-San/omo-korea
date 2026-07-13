import type { ChecklistItem } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Check, Lock } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { localizeChecklistText } from '@/utils/checklistLocalization'

interface ChecklistRowProps {
  item: ChecklistItem
  onToggle: (id: string, completed: boolean) => void
  disabled?: boolean
  variant?: 'card' | 'plain'
  /** When true the item cannot be checked — credit requirement not yet met */
  locked?: boolean
  /** Human-readable reason shown when locked */
  lockReason?: string
}

export function ChecklistRow({
  item,
  onToggle,
  disabled,
  variant = 'card',
  locked,
  lockReason,
}: ChecklistRowProps) {
  const { t } = useLanguage()
  const isBlocked = locked && !item.completed
  const title = localizeChecklistText(item.title, t)
  const description = localizeChecklistText(item.description, t)
  const content = (
    <label className={['flex items-start gap-3', isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'].join(' ')}>
      <button
        type="button"
        disabled={disabled || isBlocked}
        aria-pressed={item.completed}
        aria-label={
          isBlocked
            ? t('checklist.lockedLabel', { reason: lockReason ?? '' })
            : t('checklist.markLabel', {
                title,
                state: item.completed
                  ? t('checklist.stateIncomplete')
                  : t('checklist.stateComplete'),
              })
        }
        onClick={() => !isBlocked && onToggle(item.id, !item.completed)}
        className={[
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition',
          isBlocked
            ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
            : item.completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-pnu-border bg-white text-transparent hover:border-pnu-blue-light',
          disabled && !isBlocked ? 'opacity-50' : '',
        ].join(' ')}
      >
        {isBlocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>

      <span className="min-w-0 flex-1">
        <span
          className={[
            'block text-sm font-semibold',
            item.completed ? 'text-pnu-muted line-through' : isBlocked ? 'text-slate-500' : 'text-pnu-text',
          ].join(' ')}
        >
          {title}
        </span>
        {description ? (
          <span className="mt-1 block text-sm leading-relaxed text-pnu-muted">{description}</span>
        ) : null}

        {isBlocked && lockReason && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            <Lock className="h-2.5 w-2.5" />
            {lockReason}
          </span>
        )}
      </span>

      {item.completed && (
        <span className="shrink-0 self-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          {t('checklist.done')}
        </span>
      )}
    </label>
  )

  if (variant === 'plain') {
    return <div className="py-3">{content}</div>
  }

  return (
    <Card
      className={[
        isBlocked
          ? 'border-slate-200 bg-slate-50/60 opacity-80'
          : item.completed
          ? 'border-emerald-200 bg-emerald-50/30'
          : '',
      ].join(' ')}
    >
      {content}
    </Card>
  )
}
