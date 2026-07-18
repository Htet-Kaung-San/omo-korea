import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import type { CommunityGroup, CommunityMember } from '@/types/api'

export function CommunityMembersPage() {
  const { groupId = '' } = useParams()
  const { t } = useLanguage()
  const [group, setGroup] = useState<CommunityGroup | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .getCommunityMembers(groupId)
      .then((result) => {
        if (cancelled) return
        setGroup(result.group)
        setMembers(result.members)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('community.groupNotFound'))
          setGroup(null)
          setMembers([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [groupId, t])

  if (loading) {
    return (
      <div>
        <PageHeader title={t('community.membersTitle')} back />
        <p className="px-4 py-6 text-sm text-pnu-muted">{t('community.loading')}</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div>
        <PageHeader title={t('community.membersTitle')} back />
        <p className="px-4 py-6 text-sm text-pnu-muted">{error || t('community.groupNotFound')}</p>
        <Link to="/community" className="px-4 text-sm font-semibold text-pnu-blue">
          {t('community.backToCommunity')}
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <PageHeader title={t('community.membersTitle')} subtitle={group.name} back />

      <div className="space-y-3 px-4 pt-3">
        <div className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2F2F7] text-[22px]">
            {group.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-pnu-text">{group.name}</p>
            <p className="text-[12px] text-pnu-muted">
              {t('community.memberCount', { count: group.memberCount })}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5">
          {members.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-pnu-muted">{t('community.noMembers')}</p>
          ) : (
            <ul className="divide-y divide-pnu-border/80">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${member.avatarTone}`}
                  >
                    {member.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-pnu-text">
                      {member.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-pnu-muted">
                      {member.major} · {member.nationality}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
