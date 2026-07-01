import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { BookOpen, Building2, Coffee, MapPinned } from 'lucide-react'

const cards = [
  { to: '/campus-life/one-stop', labelKey: 'campusLife.oneStopGuide', icon: Building2 },
  { to: '/campus-life/library', labelKey: 'campusLife.libraryGuide', icon: BookOpen },
  { to: '/campus-life/cafeteria', labelKey: 'campusLife.cafeteriaInfo', icon: Coffee },
  { to: '/campus-life/map', labelKey: 'campusLife.campusMap', icon: MapPinned },
]

export function CampusLifePage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t('campusLife.title')} subtitle={t('campusLife.subtitle')} />
      <div className="grid grid-cols-2 gap-3 px-5 py-5">
        {cards.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm transition hover:border-pnu-blue-light/50"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="text-sm font-bold text-pnu-text">{t(labelKey)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
