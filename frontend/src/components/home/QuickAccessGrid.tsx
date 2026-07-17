import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Map,
  Megaphone,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const tiles: Array<{ to: string; labelKey: string; icon: LucideIcon; tone: string }> = [
  { to: '/schedule', labelKey: 'home.qaCourses', icon: BookOpen, tone: 'bg-sky-50 text-sky-700' },
  { to: '/schedule', labelKey: 'home.qaGraduation', icon: GraduationCap, tone: 'bg-indigo-50 text-indigo-700' },
  { to: '/academic/scholarships', labelKey: 'home.qaScholarships', icon: Award, tone: 'bg-amber-50 text-amber-700' },
  { to: '/notifications', labelKey: 'home.qaNotices', icon: Megaphone, tone: 'bg-rose-50 text-rose-700' },
  { to: '/map', labelKey: 'home.qaCampusMap', icon: Map, tone: 'bg-emerald-50 text-emerald-700' },
  { to: '/career-opportunities', labelKey: 'home.qaInternships', icon: Briefcase, tone: 'bg-violet-50 text-violet-700' },
  { to: '/support/emergency', labelKey: 'home.qaEmergency', icon: AlertTriangle, tone: 'bg-orange-50 text-orange-700' },
  { to: '/community', labelKey: 'home.qaCommunity', icon: Users, tone: 'bg-teal-50 text-teal-700' },
]

export function QuickAccessGrid() {
  const { t } = useLanguage()

  return (
    <section>
      <h2 className="mb-3 px-1 text-[17px] font-semibold tracking-tight text-pnu-text">
        {t('home.quickAccess')}
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map(({ to, labelKey, icon: Icon, tone }) => (
          <Link
            key={labelKey}
            to={to}
            className="flex flex-col items-center gap-2 rounded-[18px] bg-white px-1.5 py-3 text-center shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone}`}>
              <Icon className="h-5 w-5" strokeWidth={1.85} />
            </span>
            <span className="text-[10px] font-semibold leading-tight text-pnu-text">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
