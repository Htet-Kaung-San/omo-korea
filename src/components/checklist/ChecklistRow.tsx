import type { ChecklistItem } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Check } from 'lucide-react'

interface ChecklistRowProps {
  item: ChecklistItem
  onToggle: (id: string, completed: boolean) => void
  disabled?: boolean
}

export function ChecklistRow({ item, onToggle, disabled }: ChecklistRowProps) {
  return (
    <Card className={item.completed ? 'border-emerald-200 bg-emerald-50/30' : ''}>
      <label className="flex cursor-pointer items-start gap-3">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={item.completed}
          aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
          onClick={() => onToggle(item.id, !item.completed)}
          className={[
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition',
            item.completed
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-pnu-border bg-white text-transparent hover:border-pnu-blue-light',
            disabled ? 'opacity-50' : '',
          ].join(' ')}
        >
          <Check className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1">
          <span
            className={[
              'block text-sm font-semibold',
              item.completed ? 'text-pnu-muted line-through' : 'text-pnu-text',
            ].join(' ')}
          >
            {item.title}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-pnu-muted">{item.description}</span>
        </span>
      </label>
    </Card>
  )
}
