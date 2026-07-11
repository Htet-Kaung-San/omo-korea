import { useEffect, useState } from 'react'
import { MapPin, Phone } from 'lucide-react'
import { api } from '@/api'
import type { EmergencyContact, EmergencyGuide } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

function mapUrl(query: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`
}

function QuickAccessCard({ number, label }: { number: string; label: string }) {
  return (
    <a
      href={`tel:${number}`}
      className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
    >
      <Phone className="h-5 w-5 text-red-500" />
      <span className="text-lg font-bold text-pnu-text">{number}</span>
      <span className="text-sm text-pnu-muted">{label}</span>
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
        <h2 className="text-sm font-bold text-pnu-text">{t('emergency.embassyTitle')}</h2>
        <p className="mt-3 text-sm font-semibold text-pnu-text">
          {contact.country_flag ? `${contact.country_flag} ` : ''}
          {contact.name}
        </p>
        <div className="mt-3 flex gap-2">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="rounded-xl bg-pnu-blue px-3 py-2 text-xs font-bold text-white"
            >
              <Phone className="mr-1 inline h-3.5 w-3.5" />
              {t('emergency.call')}
            </a>
          ) : null}
          {contact.map_query ? (
            <a
              href={mapUrl(contact.map_query)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-pnu-border px-3 py-2 text-xs font-bold text-pnu-text"
            >
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {t('emergency.map')}
            </a>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="text-sm font-semibold text-pnu-text">{contact.name}</p>
      {contact.map_query ? (
        <a
          href={mapUrl(contact.map_query)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pnu-blue-light"
        >
          {contact.distance ? `${contact.distance} · ` : ''}
          <MapPin className="h-3.5 w-3.5" /> {t('emergency.navigate')}
        </a>
      ) : null}
    </div>
  )
}

export function EmergencySupportPage() {
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

  const embassyContacts = guide?.database_contacts.filter((contact) => contact.type === 'embassy') ?? []
  const nearestContacts = guide?.database_contacts.filter((contact) => contact.type !== 'embassy') ?? []

  return (
    <div>
      <PageHeader title={t('emergency.title')} back />

      <div className="space-y-4 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('common.loading')}</p> : null}

        {guide ? (
          <>
            <section className="space-y-2">
              <QuickAccessCard
                number={guide.quick_access.police.number}
                label={guide.quick_access.police.label}
              />
              <QuickAccessCard
                number={guide.quick_access.fire_medical.number}
                label={guide.quick_access.fire_medical.label}
              />
              <QuickAccessCard
                number={guide.quick_access.disease_control.number}
                label={guide.quick_access.disease_control.label}
              />
            </section>

            {embassyContacts.map((contact) => (
              <DatabaseContactCard key={contact.id} contact={contact} t={t} />
            ))}

            {nearestContacts.length > 0 ? (
              <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-pnu-text">{t('emergency.nearestHelp')}</h2>
                <div className="mt-3 divide-y divide-pnu-border">
                  {nearestContacts.map((contact) => (
                    <DatabaseContactCard key={contact.id} contact={contact} t={t} />
                  ))}
                </div>
              </section>
            ) : null}

            {guide.guide_text ? (
              <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <p className="text-sm leading-relaxed text-pnu-muted">{guide.guide_text}</p>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
