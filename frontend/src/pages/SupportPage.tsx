import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import {
  helpMoreItems,
  helpTopics,
  helpTopicToneStyles,
} from '@/data/support'

export function SupportPage() {
  const { t } = useLanguage()

  return (
    <div className="pb-6">
      <PageHeader
        title={t('support.title')}
        subtitle={t('support.subtitle')}
        back
      />

      <div className="space-y-6 px-4 pt-3">
        <section>
          <h2 className="mb-3 px-1 text-[15px] font-bold text-pnu-text">
            {t('support.helpTopics')}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {helpTopics.map((topic) => {
              const tone = helpTopicToneStyles[topic.tone]
              const Icon = topic.icon
              return (
                <Link
                  key={topic.id}
                  to={topic.path}
                  className="flex min-h-[118px] flex-col rounded-[18px] bg-white p-3.5 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.iconWrap}`}
                    >
                      <Icon className={`h-5 w-5 ${tone.icon}`} strokeWidth={2} />
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-pnu-muted/50" />
                  </div>
                  <p className={`mt-3 text-[13px] font-bold leading-snug ${tone.title}`}>
                    {t(topic.titleKey)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-pnu-muted">
                    {t(topic.descriptionKey)}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 px-1 text-[15px] font-bold text-pnu-text">
            {t('support.moreSupport')}
          </h2>
          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5">
            <div className="divide-y divide-pnu-border">
              {helpMoreItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-3.5 transition active:bg-[#F2F2F7]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pnu-surface text-pnu-muted">
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-pnu-text">
                        {t(item.titleKey)}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-pnu-muted">
                        {t(item.descriptionKey)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-pnu-muted/60" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
