import { MessageCircle } from 'lucide-react'
import pnuCharacter from '@/assets/pnu-character.png'
import { CommunityGroupCard } from '@/components/community/CommunityGroupCard'
import { useLanguage } from '@/context/LanguageContext'
import type { CommunityGroup, CommunityScope } from '@/types/api'

const BANNER_KEYS: Record<CommunityScope, { titleKey: string; bodyKey: string }> = {
  department: {
    titleKey: 'community.banner.departmentTitle',
    bodyKey: 'community.banner.departmentBody',
  },
  country: {
    titleKey: 'community.banner.countryTitle',
    bodyKey: 'community.banner.countryBody',
  },
  all: {
    titleKey: 'community.banner.allTitle',
    bodyKey: 'community.banner.allBody',
  },
}

interface CommunityScopeBannerProps {
  scope: CommunityScope
  groups: CommunityGroup[]
}

export function CommunityScopeBanner({ scope, groups }: CommunityScopeBannerProps) {
  const { t } = useLanguage()
  const copy = BANNER_KEYS[scope]
  const primary = groups[0]

  if (scope === 'all') {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#E8F1FF] to-[#F3F8FF] px-4 py-4 ring-1 ring-pnu-blue/10">
        <div className="relative z-10 max-w-[70%]">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-pnu-blue shadow-sm">
            <MessageCircle className="h-4 w-4" />
          </div>
          <h2 className="text-[16px] font-bold text-pnu-text">{t(copy.titleKey)}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-pnu-muted">{t(copy.bodyKey)}</p>
        </div>
        <img
          src={pnuCharacter}
          alt=""
          className="pointer-events-none absolute -bottom-2 right-1 h-24 w-auto object-contain drop-shadow-sm"
        />
      </div>
    )
  }

  if (!primary) {
    return (
      <div className="rounded-[20px] bg-gradient-to-br from-[#E8F1FF] to-[#F3F8FF] px-4 py-3.5 ring-1 ring-pnu-blue/10">
        <h2 className="text-[15px] font-bold text-pnu-text">{t(copy.titleKey)}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-pnu-muted">{t('community.noGroups')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[20px] bg-gradient-to-br from-[#E8F1FF] to-[#F3F8FF] px-4 py-3.5 ring-1 ring-pnu-blue/10">
        <h2 className="text-[15px] font-bold text-pnu-text">{primary.bannerTitle}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-pnu-muted">{primary.bannerBody}</p>
      </div>
      <CommunityGroupCard group={primary} selected />
    </div>
  )
}
