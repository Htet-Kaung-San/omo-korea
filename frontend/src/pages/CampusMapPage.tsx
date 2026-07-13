import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

declare global {
  interface Window {
    naver?: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown
        Map: new (
          element: HTMLElement,
          options: { center: unknown; zoom: number },
        ) => unknown
        Marker: new (options: { position: unknown; map: unknown }) => unknown
      }
    }
  }
}

const NAVER_MAP_SCRIPT_ID = 'naver-map-script'
const PNU_LAT = 35.2338
const PNU_LNG = 129.0794

export function CampusMapPage() {
  const { t } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!clientId) {
      setError(t('campusLife.mapMissingKey'))
      return
    }

    function renderMap() {
      if (!mapRef.current || !window.naver?.maps) return
      const center = new window.naver.maps.LatLng(PNU_LAT, PNU_LNG)
      const map = new window.naver.maps.Map(mapRef.current, { center, zoom: 15 })
      new window.naver.maps.Marker({ position: center, map })
    }

    if (window.naver?.maps) {
      renderMap()
      return
    }

    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript ?? document.createElement('script')
    script.id = NAVER_MAP_SCRIPT_ID
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`
    script.async = true
    script.onload = renderMap
    script.onerror = () => setError(t('campusLife.mapLoadError'))
    if (!existingScript) document.head.appendChild(script)
  }, [clientId, t])

  return (
    <div>
      <PageHeader title={t('campusLife.campusMap')} subtitle={t('campusLife.mapSubtitle')} back />
      <div className="space-y-4 px-5 py-5">
        {error ? (
          <div className="rounded-2xl border border-dashed border-pnu-border bg-white p-4 text-sm leading-relaxed text-pnu-muted">
            {error}
          </div>
        ) : null}
        <div
          ref={mapRef}
          className="h-[360px] overflow-hidden rounded-2xl border border-pnu-border bg-slate-100"
        />
      </div>
    </div>
  )
}
