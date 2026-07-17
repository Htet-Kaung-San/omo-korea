import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { GuideInlineText } from '@/components/guide/GuideInlineText'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { libraryGuideSectionDefs } from '@/i18n/libraryGuide/sections'

function LibraryAccordionItem({
  section,
  isOpen,
  onToggle,
  t,
}: {
  section: (typeof libraryGuideSectionDefs)[number]
  isOpen: boolean
  onToggle: () => void
  t: (key: string) => string
}) {
  const panelId = `library-panel-${section.id}`
  const buttonId = `library-button-${section.id}`

  return (
    <article className="overflow-hidden rounded-2xl border border-pnu-border bg-white shadow-sm">
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-pnu-muted" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-pnu-muted" aria-hidden />
        )}
        <h2 className="text-sm font-bold leading-snug text-pnu-text">{t(section.titleKey)}</h2>
      </button>

      {isOpen ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-pnu-border px-4 py-4">
          {section.usageGuideKeys && section.usageGuideKeys.length > 0 ? (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
                {t('library.usageGuide')}
              </p>
              <ul className="mt-3 space-y-2">
                {section.usageGuideKeys.map((tipKey) => (
                  <li key={tipKey} className="flex gap-2 text-sm leading-relaxed text-pnu-muted">
                    <span className="text-pnu-blue">•</span>
                    <span>{t(tipKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
              {t('library.steps')}
            </p>
            <ol className="mt-3 space-y-4">
              {section.stepKeys.map((stepKey, index) => {
                const image = section.stepImages?.[stepKey]

                return (
                  <li key={stepKey} className="space-y-3">
                    <div className="flex gap-2 text-sm leading-relaxed text-pnu-muted">
                      <span className="font-bold text-pnu-blue">{index + 1}.</span>
                      <span><GuideInlineText text={t(stepKey)} /></span>
                    </div>
                    {image ? (
                      <img
                        src={image.src}
                        alt={t(image.altKey)}
                        className="ml-6 w-auto max-w-[200px] rounded-lg border border-pnu-border shadow-sm"
                        loading="lazy"
                      />
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function LibraryGuidePage() {
  const { t } = useLanguage()
  const [openId, setOpenId] = useState('')

  return (
    <div>
      <PageHeader
        title={t('campusLife.libraryGuide')}
        subtitle={t('library.subtitle')}
        back
      />

      <div className="space-y-3 px-5 py-5">
        {libraryGuideSectionDefs.map((section) => (
            <LibraryAccordionItem
              key={section.id}
              section={section}
              isOpen={openId === section.id}
              onToggle={() => setOpenId((current) => (current === section.id ? '' : section.id))}
              t={t}
            />
          ))}
      </div>
    </div>
  )
}
