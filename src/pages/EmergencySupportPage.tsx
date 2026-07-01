import { MapPin, Phone } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  embassyInfo,
  emergencyContacts,
  nearestHelp,
} from '@/data/support'

function mapUrl(query: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`
}

export function EmergencySupportPage() {
  return (
    <div>
      <PageHeader title="Emergency" back />

      <div className="space-y-4 px-5 py-5">
        <section className="space-y-2">
          {emergencyContacts.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.number}`}
              className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
            >
              <Phone className="h-5 w-5 text-red-500" />
              <span className="text-lg font-bold text-pnu-text">{contact.number}</span>
              <span className="text-sm text-pnu-muted">{contact.label}</span>
            </a>
          ))}
        </section>

        <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-pnu-text">My country's embassy</h2>
          <p className="mt-3 text-sm font-semibold text-pnu-text">
            {embassyInfo.countryFlag} {embassyInfo.name}
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href={`tel:${embassyInfo.phone}`}
              className="rounded-xl bg-pnu-blue px-3 py-2 text-xs font-bold text-white"
            >
              <Phone className="mr-1 inline h-3.5 w-3.5" />
              Call
            </a>
            <a
              href={mapUrl(embassyInfo.mapQuery)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-pnu-border px-3 py-2 text-xs font-bold text-pnu-text"
            >
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Map
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-pnu-text">Nearest help</h2>
          <div className="mt-3 divide-y divide-pnu-border">
            {nearestHelp.map((place) => (
              <div key={place.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-pnu-text">{place.name}</p>
                <a
                  href={mapUrl(place.mapQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pnu-blue-light"
                >
                  {place.distance} · <MapPin className="h-3.5 w-3.5" /> Navigate
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
