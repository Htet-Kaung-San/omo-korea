import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { lawCategories, relatedLaws } from '@/data/support'

export function RelatedLawsPage() {
  const [activeCategory, setActiveCategory] = useState(lawCategories[0])
  const visibleLaws = relatedLaws.filter((law) => law.category === activeCategory)

  return (
    <div>
      <PageHeader title="Related Laws" back />

      <div className="space-y-4 px-5 py-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {lawCategories.map((category) => {
            const active = activeCategory === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={[
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
                  active
                    ? 'border-pnu-blue bg-pnu-blue text-white'
                    : 'border-pnu-border bg-white text-pnu-muted',
                ].join(' ')}
              >
                {category}
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          {visibleLaws.map((law) => (
            <article key={law.id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-pnu-text">{law.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-pnu-muted">{law.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
