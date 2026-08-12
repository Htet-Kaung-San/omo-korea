import { useEffect, useMemo, useState } from 'react'
import { MapPin, Phone, Building2 } from 'lucide-react'
import { api } from '@/api'
import type { EmergencyContact, EmergencyGuide } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { countryMatches } from '@/utils/countryMatch'

function mapUrl(query: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`
}

function QuickAccessCard({
  number,
  label,
  fallbackKey,
  t,
}: {
  number: string
  label: string
  fallbackKey: string
  t: (key: string) => string
}) {
  const displayLabel = t(fallbackKey) !== fallbackKey ? t(fallbackKey) : label

  return (
    <a
      href={`tel:${number}`}
      className="flex items-center justify-between rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-lg font-bold text-pnu-text">{number}</span>
          <span className="text-xs font-medium text-pnu-muted">{displayLabel}</span>
        </div>
      </div>
      <span className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
        {t('emergency.call')}
      </span>
    </a>
  )
}

function DatabaseContactCard({
  contact,
  t,
}: {
  contact: EmergencyContact
  t: (key: string) => string
}) {
  if (contact.type === 'embassy') {
    return (
      <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-pnu-muted">
          {t('emergency.embassyTitle')}
        </h2>
        <p className="mt-2 text-base font-bold text-pnu-text">
          {contact.country_flag ? `${contact.country_flag} ` : ''}
          {contact.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pnu-blue px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-pnu-blue-light"
            >
              <Phone className="h-3.5 w-3.5" />
              {t('emergency.call')} ({contact.phone})
            </a>
          ) : null}
          {contact.map_query ? (
            <a
              href={mapUrl(contact.map_query)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-pnu-border bg-pnu-surface px-3.5 py-2 text-xs font-bold text-pnu-text transition hover:bg-pnu-border/40"
            >
              <MapPin className="h-3.5 w-3.5 text-pnu-blue-light" />
              {t('emergency.map')}
            </a>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-pnu-text">{contact.name}</p>
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="text-xs font-bold text-pnu-blue hover:underline"
          >
            {contact.phone}
          </a>
        ) : null}
      </div>
      {contact.map_query ? (
        <a
          href={mapUrl(contact.map_query)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pnu-blue-light hover:underline"
        >
          {contact.distance ? `${contact.distance} · ` : ''}
          <MapPin className="h-3.5 w-3.5" /> {t('emergency.navigate')}
        </a>
      ) : null}
    </div>
  )
}

export function EmergencySupportPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [guide, setGuide] = useState<EmergencyGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .getEmergencyGuide()
      .then(setGuide)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.errorFallback')))
      .finally(() => setLoading(false))
  }, [language, t])

  const nationality = user?.nationality
  const embassyContacts = useMemo(() => {
    const embassies =
      guide?.database_contacts.filter((contact) => contact.type === 'embassy') ?? []
    if (!nationality) return embassies
    return embassies.filter((contact) => countryMatches(contact.country, nationality))
  }, [guide, nationality])

  const nearestContacts =
    guide?.database_contacts.filter((contact) => contact.type !== 'embassy') ?? []

  return (
    <div className="min-h-full bg-pnu-surface pb-10">
      <PageHeader title={t('emergency.title')} back />

      <div className="space-y-4 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 border border-red-100">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm font-medium text-pnu-muted">{t('common.loading')}</p>
          </div>
        ) : null}

        {guide ? (
          <>
            {/* Quick Access Numbers */}
            <section className="space-y-2.5">
              <QuickAccessCard
                number={guide.quick_access.police.number}
                label={guide.quick_access.police.label}
                fallbackKey="emergency.police"
                t={t}
              />
              <QuickAccessCard
                number={guide.quick_access.fire_medical.number}
                label={guide.quick_access.fire_medical.label}
                fallbackKey="emergency.fireMedical"
                t={t}
              />
              <QuickAccessCard
                number={guide.quick_access.disease_control.number}
                label={guide.quick_access.disease_control.label}
                fallbackKey="emergency.immigration"
                t={t}
              />
            </section>

            {/* Embassy Contacts */}
            {embassyContacts.map((contact) => (
              <DatabaseContactCard key={contact.id} contact={contact} t={t} />
            ))}

            {/* Visa & Immigration Office Info */}
            {guide.visa_offices && guide.visa_offices.length > 0 ? (
              <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pnu-muted">
                  <Building2 className="h-4 w-4 text-pnu-blue" />
                  {t('emergency.visaOfficesTitle')}
                </h2>
                <div className="mt-3 space-y-2.5 divide-y divide-pnu-border/60">
                  {guide.visa_offices.map((office, idx) => (
                    <div key={idx} className="pt-2.5 first:pt-0">
                      <p className="text-sm font-bold text-pnu-text">{office.name}</p>
                      {office.unit ? (
                        <p className="text-xs font-semibold text-pnu-blue-light">{office.unit}</p>
                      ) : null}
                      {office.address ? (
                        <p className="mt-1 text-xs text-pnu-muted">{office.address}</p>
                      ) : null}
                      {office.phone ? (
                        <a
                          href={`tel:${office.phone}`}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-pnu-blue hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {office.phone}
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Jeonse / Housing Deposit Safety */}
            {guide.jeonse_fraud_prevention?.notice ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {t('emergency.housingSafetyTitle')}
                </h2>
                <p className="mt-2 text-xs font-medium leading-relaxed text-amber-950">
                  {guide.jeonse_fraud_prevention.notice}
                </p>
              </section>
            ) : null}

            {/* Nearest Assistance Contacts */}
            {nearestContacts.length > 0 ? (
              <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-pnu-muted">
                  {t('emergency.nearestHelp')}
                </h2>
                <div className="mt-3 divide-y divide-pnu-border/60">
                  {nearestContacts.map((contact) => (
                    <DatabaseContactCard key={contact.id} contact={contact} t={t} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
