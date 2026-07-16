import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/api'
import {
  loadNaverMaps,
  PNU_CENTER,
  type NaverInfoWindow,
  type NaverMap,
  type NaverMarker,
} from '@/lib/naverMaps'
import type { MapFacility } from '@/types/api'

const FACILITY_TYPE_STYLES: Record<string, string> = {
  Library: 'bg-blue-100 text-blue-800',
  Cafeteria: 'bg-green-100 text-green-800',
  Administrative: 'bg-amber-100 text-amber-800',
  Dormitory: 'bg-purple-100 text-purple-800',
}

function buildInfoWindowContent(facility: MapFacility): string {
  const details = [
    facility.hours ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${facility.hours}</p>` : '',
    facility.description
      ? `<p style="margin:6px 0 0;font-size:12px;line-height:1.45;color:#475569;">${facility.description}</p>`
      : '',
    facility.floors
      ? `<p style="margin:6px 0 0;font-size:11px;line-height:1.4;color:#94a3b8;">${facility.floors}</p>`
      : '',
  ].join('')

  return `<div style="padding:10px 12px;min-width:180px;max-width:240px;">
    <strong style="display:block;font-size:13px;color:#0f172a;">${facility.name}</strong>
    <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;">${facility.type}</span>
    ${details}
  </div>`
}

export function CampusMapPage() {
  const { t } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<NaverMap | null>(null)
  const markersRef = useRef<
    Array<{
      facility: MapFacility
      marker: NaverMarker
      infoWindow: NaverInfoWindow
    }>
  >([])
  const activeInfoWindowRef = useRef<NaverInfoWindow | null>(null)

  const [facilities, setFacilities] = useState<MapFacility[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapError, setMapError] = useState('')
  const [facilitiesError, setFacilitiesError] = useState('')
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined

  const focusFacility = useCallback((facility: MapFacility) => {
    const naver = window.naver
    const map = mapInstanceRef.current
    if (!naver?.maps || !map) return

    const entry = markersRef.current.find((item) => item.facility.id === facility.id)
    if (!entry) return

    activeInfoWindowRef.current?.close()
    const position = new naver.maps.LatLng(facility.latitude, facility.longitude)
    map.panTo(position)
    map.setZoom(17)
    entry.infoWindow.open(map, entry.marker)
    activeInfoWindowRef.current = entry.infoWindow
    setSelectedId(facility.id)
  }, [])

  useEffect(() => {
    setLoadingFacilities(true)
    setFacilitiesError('')

    api
      .getMapFacilities()
      .then(setFacilities)
      .catch((err) =>
        setFacilitiesError(err instanceof Error ? err.message : t('campusLife.mapFacilitiesError')),
      )
      .finally(() => setLoadingFacilities(false))
  }, [t])

  useEffect(() => {
    if (!clientId) {
      setMapError(t('campusLife.mapMissingKey'))
      return
    }

    let cancelled = false

    loadNaverMaps(clientId)
      .then(() => {
        if (!cancelled) setMapReady(true)
      })
      .catch(() => {
        if (!cancelled) setMapError(t('campusLife.mapLoadError'))
      })

    return () => {
      cancelled = true
    }
  }, [clientId, t])

  useEffect(() => {
    const naver = window.naver
    if (!mapReady || !naver?.maps || !mapRef.current || facilities.length === 0) return

    const center = new naver.maps.LatLng(PNU_CENTER.lat, PNU_CENTER.lng)
    const map = new naver.maps.Map(mapRef.current, { center, zoom: 15 })
    mapInstanceRef.current = map

    activeInfoWindowRef.current?.close()
    markersRef.current = []

    facilities.forEach((facility) => {
      const position = new naver.maps.LatLng(facility.latitude, facility.longitude)
      const marker = new naver.maps.Marker({
        position,
        map,
        title: facility.name,
      })
      const infoWindow = new naver.maps.InfoWindow({
        content: buildInfoWindowContent(facility),
      })

      naver.maps.Event.addListener(marker, 'click', () => focusFacility(facility))
      markersRef.current.push({ facility, marker, infoWindow })
    })
  }, [facilities, focusFacility, mapReady])

  const error = mapError || facilitiesError

  return (
    <div>
      <PageHeader title={t('campusLife.campusMap')} subtitle={t('campusLife.mapSubtitle')} back />
      <div className="space-y-4 px-5 py-5">
        {error ? (
          <div className="rounded-2xl border border-dashed border-pnu-border bg-white p-4 text-sm leading-relaxed text-pnu-muted">
            {error}
          </div>
        ) : null}

        {loadingFacilities ? (
          <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
        ) : null}

        <div
          ref={mapRef}
          className="h-[360px] overflow-hidden rounded-2xl border border-pnu-border bg-slate-100"
        />

        {facilities.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
              {t('campusLife.mapLegend')}
            </p>
            <div className="space-y-2">
              {facilities.map((facility) => {
                const typeStyle = FACILITY_TYPE_STYLES[facility.type] ?? 'bg-slate-100 text-slate-700'
                const isSelected = selectedId === facility.id

                return (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => focusFacility(facility)}
                    className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-pnu-blue-light/40 hover:shadow-md ${
                      isSelected ? 'border-pnu-blue ring-1 ring-pnu-blue/20' : 'border-pnu-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-pnu-text">{facility.name}</h2>
                        {facility.hours ? (
                          <p className="mt-1 text-xs text-pnu-muted">{facility.hours}</p>
                        ) : null}
                        {facility.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-pnu-muted">
                            {facility.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeStyle}`}
                      >
                        {facility.type}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
