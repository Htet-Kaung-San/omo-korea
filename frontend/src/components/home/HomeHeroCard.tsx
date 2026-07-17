import type { User } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'
import sanjini from '@/assets/pnu-character.png'

interface HomeHeroCardProps {
  user: User | null
}

function greetingKey(hour: number): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  if (hour < 12) return 'home.greetingMorning'
  if (hour < 18) return 'home.greetingAfternoon'
  return 'home.greetingEvening'
}

export function HomeHeroCard({ user }: HomeHeroCardProps) {
  const { t } = useLanguage()
  const name = user?.name?.trim() || t('home.defaultName')
  const hour = new Date().getHours()
  const yearLabel =
    user?.studentType === 'Freshman'
      ? t('home.yearFreshman')
      : t('home.yearCurrent')

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#E8F3FF] via-[#DCEEFF] to-[#C9E4FF] p-5 shadow-sm ring-1 ring-pnu-blue/10">
      <div className="relative z-10 max-w-[62%] space-y-2">
        <p className="text-[20px] font-semibold leading-snug tracking-tight text-pnu-text">
          {t(greetingKey(hour), { name })}
        </p>
        <p className="text-[14px] font-medium text-pnu-blue">
          {[yearLabel, user?.major].filter(Boolean).join(' · ')}
        </p>
        {user?.nationality ? (
          <p className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-pnu-muted">
            {user.nationality}
          </p>
        ) : null}
      </div>
      <img
        src={sanjini}
        alt="Sanjini"
        className="pointer-events-none absolute -bottom-1 -right-1 h-32 w-32 object-contain drop-shadow-sm"
      />
    </section>
  )
}
