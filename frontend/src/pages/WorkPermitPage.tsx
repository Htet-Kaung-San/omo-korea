import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { GuideInlineText } from '@/components/guide/GuideInlineText'
import { GuideTable } from '@/components/guide/GuideTable'
import { WorkPermitHoursTable } from '@/components/guide/WorkPermitHoursTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { workPermitSectionDefs } from '@/i18n/workPermitGuide/sections'

function WorkPermitAccordionItem({
  section,
  isOpen,
  onToggle,
  t,
}: {
  section: (typeof workPermitSectionDefs)[number]
  isOpen: boolean
  onToggle: () => void
  t: (key: string) => string
}) {
  const panelId = `work-permit-panel-${section.id}`
  const buttonId = `work-permit-button-${section.id}`

  const renderBullets = () =>
    section.bulletKeys && section.bulletKeys.length > 0 ? (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
          {t('workPermit.keyPoints')}
        </p>
        <ul className="mt-3 space-y-2">
          {section.bulletKeys.map((bulletKey) => (
            <li key={bulletKey} className="flex gap-2 text-sm leading-relaxed text-pnu-muted">
              <span className="text-pnu-blue">•</span>
              <span>
                <GuideInlineText text={t(bulletKey)} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    ) : null

  const renderTables = () => {
    if (section.hoursTable) {
      return <WorkPermitHoursTable t={t} />
    }

    return section.tables?.map((table, tableIndex) => (
      <GuideTable
        key={`${section.id}-table-${tableIndex}`}
        caption={table.titleKey ? t(table.titleKey) : undefined}
        headers={table.headerKeys.map((key) => t(key))}
        rows={table.rowKeys.map((row) => row.map((key) => t(key)))}
      />
    ))
  }

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
          {section.tableFirst ? (
            <>
              {renderTables()}
              {section.bulletKeys?.length ? <div className="mt-5">{renderBullets()}</div> : null}
            </>
          ) : (
            <>
              {renderBullets()}
              {section.tables?.length || section.hoursTable ? (
                <div className={section.bulletKeys?.length ? 'mt-5' : ''}>{renderTables()}</div>
              ) : null}
            </>
          )}

          {section.stepKeys && section.stepKeys.length > 0 ? (
            <div className={section.bulletKeys?.length || section.tables?.length || section.hoursTable ? 'mt-5' : ''}>
              <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
                {t('workPermit.steps')}
              </p>
              <ol className="mt-3 space-y-3">
                {section.stepKeys.map((stepKey, index) => (
                  <li key={stepKey} className="flex gap-2 text-sm leading-relaxed text-pnu-muted">
                    <span className="font-bold text-pnu-blue">{index + 1}.</span>
                    <span>
                      <GuideInlineText text={t(stepKey)} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {section.relatedPages && section.relatedPages.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
                {t('workPermit.relatedPages')}
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
                {t('workPermit.note')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-pnu-muted">
                <GuideInlineText text={t(section.noteKey)} />
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function WorkPermitPage() {
  const { t } = useLanguage()
  const [openId, setOpenId] = useState('')

  return (
    <div>
      <PageHeader
        title={t('support.topic.workPermit')}
        subtitle={t('workPermit.subtitle')}
        back
      />

      <div className="space-y-3 px-5 py-5">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p className="text-sm font-bold text-amber-900">{t('workPermit.disclaimerTitle')}</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                <GuideInlineText text={t('workPermit.disclaimer')} />
              </p>
              <p className="mt-3 text-xs leading-relaxed text-amber-800/80">
                <GuideInlineText text={t('workPermit.sourceDate')} />
              </p>
            </div>
          </div>
        </section>

        {workPermitSectionDefs.map((section) => (
          <WorkPermitAccordionItem
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
