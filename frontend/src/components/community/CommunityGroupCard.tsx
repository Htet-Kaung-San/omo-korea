import { Link } from 'react-router-dom'
import type { CommunityGroup } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

interface CommunityGroupCardProps {
  group: CommunityGroup
  selected?: boolean
}

export function CommunityGroupCard({ group, selected }: CommunityGroupCardProps) {
  const { t } = useLanguage()

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 transition ${
        selected ? 'ring-pnu-blue/40' : 'ring-black/5'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2F2F7] text-[22px]">
          {group.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-pnu-text">{group.name}</span>
          <span className="mt-0.5 block text-[12px] text-pnu-muted">
            <Link
              to={`/community/groups/${group.id}/members`}
              className="font-medium text-pnu-blue hover:underline"
            >
              {t('community.memberCount', { count: group.memberCount })}
            </Link>
            {' · '}
            {t('community.newPosts', { count: group.newPostCount })}
          </span>
        </span>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          group.joined
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-[#F2F2F7] text-pnu-muted'
        }`}
      >
        {group.joined ? t('community.joined') : t('community.join')}
      </span>
    </div>
  )
}
