import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { parseOneStopStep, type OneStopInlinePart } from '@/i18n/oneStop/parseStep'
import { oneStopSectionDefs } from '@/i18n/oneStop/sections'

function renderInlineParts(parts: OneStopInlinePart[]) {
  return parts.map((part, index) => {
    if (part.type === 'link') {
      return (
        <a
          key={`${part.href}-${index}`}
          href={part.href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-pnu-blue underline decoration-pnu-blue/30 underline-offset-2 hover:text-pnu-blue-light"
        >
          {part.label}
        </a>
      )
    }

    return <span key={`text-${index}`}>{part.value}</span>
  })
}

function OneStopAccordionItem({
  section,
  isOpen,
  onToggle,
  t,
}: {
  section: (typeof oneStopSectionDefs)[number]
  isOpen: boolean
  onToggle: () => void
  t: (key: string) => string
}) {
  const panelId = `onestop-panel-${section.id}`
  const buttonId = `onestop-button-${section.id}`

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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
              {t('oneStop.steps')}
            </p>
            <ol className="mt-3 space-y-3">
              {section.stepKeys.map((stepKey, index) => (
                <li key={stepKey} className="flex gap-2 text-sm leading-relaxed text-pnu-muted">
                  <span className="font-bold text-pnu-blue">{index + 1}.</span>
                  <span>{renderInlineParts(parseOneStopStep(t(stepKey)))}</span>
                </li>
              ))}
            </ol>
          </div>

          {section.relatedPages && section.relatedPages.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
                {t('oneStop.relatedPages')}
              </p>
              <ul className="mt-2 space-y-2">
                {section.relatedPages.map((page) => (
                  <li key={page.href}>
                    <a
                      href={page.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-pnu-blue hover:text-pnu-blue-light"
                    >
                      {t(page.labelKey)}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {section.noteKey ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
                {t('oneStop.note')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-pnu-muted">{t(section.noteKey)}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function OneStopGuidePage() {
  const { t } = useLanguage()
  const [openId, setOpenId] = useState(oneStopSectionDefs[0]?.id ?? '')

  return (
    <div>
      <PageHeader
        title={t('campusLife.oneStopGuide')}
        subtitle={t('oneStop.subtitle')}
        back
      />

      <div className="space-y-3 px-5 py-5">
        {oneStopSectionDefs.map((section) => (
          <OneStopAccordionItem
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
