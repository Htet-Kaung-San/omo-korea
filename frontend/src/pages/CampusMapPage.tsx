import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  Coffee,
  Filter,
  LocateFixed,
  Search,
  Utensils,
  X,
} from 'lucide-react'
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
import { distanceMeters, formatDistance } from '@/utils/geo'

const TYPE_FILTERS = ['All', 'Library', 'Cafeteria', 'Academic', 'Administrative', 'Dormitory', 'Student Life'] as const

function typeFilterLabelKey(type: (typeof TYPE_FILTERS)[number]): string {
  switch (type) {
    case 'All':
      return 'campusMap.filterAll'
    case 'Library':
      return 'campusMap.typeLibrary'
    case 'Cafeteria':
      return 'campusMap.typeCafeteria'
    case 'Academic':
      return 'campusMap.typeAcademic'
    case 'Administrative':
      return 'campusMap.typeAdministrative'
    case 'Dormitory':
      return 'campusMap.typeDormitory'
    case 'Student Life':
      return 'campusMap.typeStudentLife'
  }
}

function facilityIcon(type: string) {
  switch (type) {
    case 'Library':
      return BookOpen
    case 'Cafeteria':
      return Utensils
    case 'Student Life':
      return Coffee
    default:
      return Building2
  }
}

function pinColor(type: string): string {
  switch (type) {
    case 'Library':
      return '#7c3aed'
    case 'Cafeteria':
      return '#ea580c'
    case 'Academic':
      return '#005bac'
    case 'Student Life':
      return '#ea580c'
    case 'Administrative':
      return '#0d9488'
    case 'Dormitory':
      return '#7c3aed'
    default:
      return '#005bac'
  }
}

function buildMarkerHtml(facility: MapFacility): string {
  const color = pinColor(facility.type)
  const shortName = facility.name.replace(/\s*\([^)]*\)\s*/g, '').trim()
  const label = shortName.length > 22 ? `${shortName.slice(0, 20)}…` : shortName
  return `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);">
    <div style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;">${label}</div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};"></div>
  </div>`
}

export function CampusMapPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
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
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('All')
  const [showFilters, setShowFilters] = useState(false)
  const [showAllNearby, setShowAllNearby] = useState(false)
  const [origin, setOrigin] = useState(PNU_CENTER)

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return facilities.filter((f) => {
      if (typeFilter !== 'All' && f.type !== typeFilter) return false
      if (!q) return true
      return (
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (f.subtitle ?? '').toLowerCase().includes(q)
      )
    })
  }, [facilities, query, typeFilter])

  const nearby = useMemo(() => {
    return [...filtered]
      .map((f) => ({
        facility: f,
        distance: distanceMeters(origin, { lat: f.latitude, lng: f.longitude }),
      }))
      .sort((a, b) => a.distance - b.distance)
  }, [filtered, origin])

  const nearbyVisible = showAllNearby ? nearby : nearby.slice(0, 3)

  const focusFacility = useCallback((facility: MapFacility) => {
    const naver = window.naver
    const map = mapInstanceRef.current
    if (!naver?.maps || !map) return

    const entry = markersRef.current.find((item) => item.facility.id === facility.id)
    if (!entry) return

    activeInfoWindowRef.current?.close()
    const position = new naver.maps.LatLng(facility.latitude, facility.longitude)
    map.panTo(position)
    map.setZoom(16, true)
    entry.infoWindow.open(map, entry.marker)
    activeInfoWindowRef.current = entry.infoWindow
    setSelectedId(facility.id)
  }, [])

  const recenter = useCallback(() => {
    const naver = window.naver
    const map = mapInstanceRef.current
    if (!naver?.maps || !map) return
    map.panTo(new naver.maps.LatLng(PNU_CENTER.lat, PNU_CENTER.lng))
    map.setZoom(15, true)
    setOrigin(PNU_CENTER)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        /* keep campus center */
      },
      { enableHighAccuracy: false, timeout: 5000 },
    )
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

    // Clear previous map instance to avoid blink / stacked maps on re-render
    if (mapRef.current) {
      mapRef.current.innerHTML = ''
    }

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
        icon: {
          content: buildMarkerHtml(facility),
          anchor: new naver.maps.Point(70, 40),
        },
      })
      const infoWindow = new naver.maps.InfoWindow({
        content: `<div style="padding:10px 12px;min-width:160px;">
          <strong style="display:block;font-size:13px;">${facility.name}</strong>
          <span style="font-size:12px;color:#64748b;">${facility.subtitle || facility.type}</span>
          <button type="button" data-facility-id="${facility.id}" style="display:block;margin-top:8px;color:#005bac;font-size:12px;font-weight:600;background:none;border:none;padding:0;cursor:pointer;">View details →</button>
        </div>`,
      })

      naver.maps.Event.addListener(marker, 'click', () => focusFacility(facility))
      naver.maps.Event.addListener(infoWindow, 'domready', () => {
        const btn = document.querySelector(`[data-facility-id="${facility.id}"]`)
        btn?.addEventListener('click', (e) => {
          e.preventDefault()
          navigate(`/map/${facility.id}`)
        })
      })
      markersRef.current.push({ facility, marker, infoWindow })
    })
  }, [facilities, focusFacility, mapReady, navigate])

  const error = mapError || facilitiesError

  return (
    <div>
      <PageHeader title={t('nav.campusMap')} />
      <div className="space-y-4 px-4 pb-6 pt-2">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5">
          <Search className="h-4 w-4 shrink-0 text-pnu-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('campusMap.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-pnu-text outline-none placeholder:text-pnu-muted"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-lg p-1.5 transition ${showFilters ? 'bg-pnu-blue/10 text-pnu-blue' : 'text-pnu-muted'}`}
            aria-label={t('campusMap.filter')}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilters ? (
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                  typeFilter === type
                    ? 'bg-pnu-blue text-white'
                    : 'bg-white text-pnu-muted ring-1 ring-black/5'
                }`}
              >
                {t(typeFilterLabelKey(type))}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[18px] bg-white p-4 text-sm leading-relaxed text-pnu-muted shadow-sm ring-1 ring-black/5">
            {error}
          </div>
        ) : null}

        {loadingFacilities ? (
          <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
        ) : null}

        <div className="relative">
          <div
            ref={mapRef}
            className="h-[340px] overflow-hidden rounded-[22px] bg-slate-100 shadow-sm ring-1 ring-black/5"
          />
          <button
            type="button"
            onClick={recenter}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-pnu-blue shadow-md ring-1 ring-black/5"
            aria-label={t('campusMap.recenter')}
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] font-bold text-pnu-text">{t('campusMap.nearby')}</h2>
            {nearby.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllNearby((v) => !v)}
                className="text-[13px] font-semibold text-pnu-blue"
              >
                {showAllNearby ? t('campusMap.showLess') : t('campusMap.viewAll')}
              </button>
            ) : null}
          </div>

          {nearbyVisible.length === 0 && !loadingFacilities ? (
            <div className="flex items-center gap-2 rounded-[18px] bg-white p-4 text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
              <X className="h-4 w-4" />
              {t('campusMap.noResults')}
            </div>
          ) : null}

          <div className="space-y-2">
            {nearbyVisible.map(({ facility, distance }) => {
              const Icon = facilityIcon(facility.type)
              const isSelected = selectedId === facility.id
              return (
                <button
                  key={facility.id}
                  type="button"
                  onClick={() => {
                    focusFacility(facility)
                    navigate(`/map/${facility.id}`)
                  }}
                  className={`flex w-full items-center gap-3 rounded-[18px] bg-white p-3.5 text-left shadow-sm ring-1 transition active:scale-[0.99] ${
                    isSelected ? 'ring-pnu-blue/40' : 'ring-black/5'
                  }`}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${pinColor(facility.type)}18`, color: pinColor(facility.type) }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-pnu-text">{facility.name}</p>
                    <p className="truncate text-[12px] text-pnu-muted">
                      {facility.subtitle || facility.type}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold text-pnu-muted">
                    {formatDistance(distance)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
