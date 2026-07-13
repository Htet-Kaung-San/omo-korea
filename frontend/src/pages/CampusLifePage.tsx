import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { BookOpen, Building2, Coffee, MapPinned } from 'lucide-react'

const cards = [
  {
    to: '/campus-life/one-stop',
    labelKey: 'campusLife.oneStopGuide',
    icon: Building2,
    tone: 'from-pnu-blue to-pnu-blue-light',
  },
  {
    to: '/campus-life/library',
    labelKey: 'campusLife.libraryGuide',
    icon: BookOpen,
    tone: 'from-[#0b4f9c] to-[#2b7fd4]',
  },
  {
    to: '/campus-life/cafeteria',
    labelKey: 'campusLife.cafeteriaInfo',
    icon: Coffee,
    tone: 'from-pnu-green to-[#2bbd6e]',
  },
  {
    to: '/campus-life/map',
    labelKey: 'campusLife.campusMap',
    icon: MapPinned,
    tone: 'from-[#174ea6] to-[#3d8bfd]',
  },
] as const

export function CampusLifePage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t('campusLife.title')} subtitle={t('campusLife.subtitle')} />
      <div className="grid grid-cols-2 gap-3 px-5 py-5">
        {cards.map(({ to, labelKey, icon: Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-3xl border border-pnu-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-pnu-blue-light/40 hover:shadow-md"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-md shadow-blue-900/15`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </div>
            <p className="text-sm font-bold leading-snug text-pnu-text group-hover:text-pnu-blue">
              {t(labelKey)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
