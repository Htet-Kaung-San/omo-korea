import type { CourseType } from '@/types/api'

const filters: { value: CourseType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'REQUIRED', label: 'Required' },
  { value: 'ELECTIVE', label: 'Elective' },
  { value: 'GEN_ED', label: 'Gen-Ed' },
]

interface CourseFiltersProps {
  value: CourseType | 'ALL'
  onChange: (value: CourseType | 'ALL') => void
}

export function CourseFilters({ value, onChange }: CourseFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => {
        const active = value === filter.value
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={[
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
              active
                ? 'bg-pnu-blue text-white shadow-sm'
                : 'border border-pnu-border bg-white text-pnu-muted hover:text-pnu-text',
            ].join(' ')}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
