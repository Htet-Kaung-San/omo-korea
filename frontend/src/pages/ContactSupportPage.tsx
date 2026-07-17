import { useEffect, useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { api } from '@/api'
import type { PnuContact } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function ContactSupportPage() {
  const { t } = useLanguage()
  const [contacts, setContacts] = useState<PnuContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getPnuContacts()
      .then((data) => {
        if (!cancelled) setContacts(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load contacts')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <PageHeader title={t('support.topic.contact')} subtitle={t('support.topic.contactDesc')} back />
      <div className="space-y-3 px-4 py-4">
        {loading ? (
          <p className="rounded-[18px] bg-white px-4 py-6 text-center text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
            Loading…
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[18px] bg-white px-4 py-6 text-center text-sm text-rose-600 shadow-sm ring-1 ring-black/5">
            {error}
          </p>
        ) : null}
        {!loading && !error && contacts.length === 0 ? (
          <p className="rounded-[18px] bg-white px-4 py-6 text-center text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
            No contacts available yet.
          </p>
        ) : null}
        {contacts.map((contact) => (
          <article
            key={contact.id}
            className="rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <h2 className="text-[15px] font-bold text-pnu-text">{contact.name}</h2>
            <div className="mt-3 space-y-2 text-[13px] text-pnu-muted">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <span>
                  {contact.place}
                  <br />
                  {contact.hours}
                </span>
              </p>
              <a
                href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 font-semibold text-pnu-blue"
              >
                <Phone className="h-4 w-4" />
                {contact.phone}
              </a>
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 font-semibold text-pnu-blue"
                >
                  <Mail className="h-4 w-4" />
                  {contact.email}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
