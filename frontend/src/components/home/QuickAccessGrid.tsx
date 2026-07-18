import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Megaphone,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const CARD_SHADOW = '0 12px 32px rgba(15,23,42,0.08)'

const tiles: Array<{ to: string; labelKey: string; icon: LucideIcon; tone: string }> = [
  { to: '/courses', labelKey: 'home.qaCourses', icon: BookOpen, tone: 'bg-[#E8F3FF] text-[#005BAC]' },
  { to: '/credits', labelKey: 'home.qaGraduation', icon: GraduationCap, tone: 'bg-[#F3E8FF] text-[#7C3AED]' },
  { to: '/academic/scholarships', labelKey: 'home.qaScholarships', icon: Award, tone: 'bg-[#FFF4E5] text-[#EA580C]' },
  { to: '/notifications', labelKey: 'home.qaNotices', icon: Megaphone, tone: 'bg-[#FFE8EC] text-[#E11D48]' },
  {
    to: '/academic/programs',
    labelKey: 'home.qaExtracurricular',
    icon: Sparkles,
    tone: 'bg-[#E8F8ED] text-[#16A34A]',
  },
  { to: '/career-opportunities', labelKey: 'home.qaInternships', icon: Briefcase, tone: 'bg-[#FEF9C3] text-[#CA8A04]' },
  { to: '/support/emergency', labelKey: 'home.qaEmergency', icon: AlertTriangle, tone: 'bg-[#FEE2E2] text-[#DC2626]' },
  { to: '/community', labelKey: 'home.qaCommunity', icon: Users, tone: 'bg-[#D1FAE5] text-[#059669]' },
]

export function QuickAccessGrid() {
  const { t } = useLanguage()

  return (
    <section className="shrink-0">
      <div className="mb-2.5 px-0.5">
        <h2 className="text-[15px] font-bold tracking-tight text-pnu-text">
          {t('home.quickAccess')}
        </h2>
        <p className="mt-0.5 text-[11px] font-medium text-pnu-muted">
          {t('home.quickAccessSubtitle')}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {tiles.map(({ to, labelKey, icon: Icon, tone }) => (
          <Link
            key={labelKey}
            to={to}
            className="flex h-[88px] flex-col items-center justify-center gap-2 rounded-[24px] bg-white px-1.5 text-center transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tone}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.85} />
            </span>
            <span className="line-clamp-2 h-[24px] w-full px-0.5 text-[10px] font-semibold leading-[12px] text-pnu-text">
              {t(labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
