import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { Flag, GraduationCap } from 'lucide-react'

const cards = [
  { to: '/community/country-notices', labelKey: 'community.countryNotices', icon: Flag },
  { to: '/community/department-notices', labelKey: 'community.departmentNotices', icon: GraduationCap },
]

export function CommunityPage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t('community.title')} subtitle={t('community.subtitle')} />
      <div className="space-y-3 px-5 py-5">
        {cards.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-2xl border border-pnu-border bg-white p-4 shadow-sm transition hover:border-pnu-blue-light/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="text-sm font-bold text-pnu-text">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
