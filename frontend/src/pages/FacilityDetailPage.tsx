import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  Globe,
  Heart,
  Navigation,
  Phone,
  Share2,
} from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { MapFacility } from '@/types/api'

const FAVORITES_KEY = 'hey_pnu_favorite_facilities'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function FacilityDetailPage() {
  const { facilityId } = useParams<{ facilityId: string }>()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [facility, setFacility] = useState<MapFacility | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'departments' | 'facilities'>('departments')
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())

  const isFavorite = Boolean(facilityId && favorites.includes(facilityId))

  useEffect(() => {
    if (!facilityId) return
    setLoading(true)
    setError('')
    api
      .getMapFacility(facilityId)
      .then(setFacility)
      .catch((err) => setError(err instanceof Error ? err.message : t('campusMap.detailError')))
      .finally(() => setLoading(false))
  }, [facilityId, t])

  const rooms = useMemo(() => {
    if (!facility) return []
    return tab === 'departments' ? facility.departments ?? [] : facility.amenities ?? []
  }, [facility, tab])

  function toggleFavorite() {
    if (!facilityId) return
    setFavorites((prev) => {
      const next = prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }

  function openDirections() {
    if (!facility) return
    const url = `https://map.naver.com/v5/search/${encodeURIComponent(facility.name)}?c=${facility.longitude},${facility.latitude},16,0,0,0,dh`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function callFacility() {
    if (!facility?.phone) return
    window.location.href = `tel:${facility.phone.replace(/\s+/g, '')}`
  }

  function openWebsite() {
    if (!facility?.website) return
    window.open(facility.website, '_blank', 'noopener,noreferrer')
  }

  async function shareFacility() {
    if (!facility) return
    const shareData = {
      title: facility.name,
      text: `${facility.name} — ${facility.subtitle || facility.type}`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert(t('campusMap.linkCopied'))
      }
    } catch {
      /* user cancelled */
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="space-y-4 px-4 py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-semibold text-pnu-blue"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('common.back')}
        </button>
        <p className="text-sm text-pnu-muted">{error || t('campusMap.detailError')}</p>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-pnu-text shadow-sm ring-1 ring-black/5"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="max-w-[60%] truncate text-center text-[16px] font-bold text-pnu-text">
          {facility.name.replace(/\s*\([^)]*\)\s*/g, '').trim()}
        </h1>
        <button
          type="button"
          onClick={toggleFavorite}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
          aria-label={t('campusMap.favorite')}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-pnu-muted'}`}
          />
        </button>
      </div>

      <div className="px-4">
        <div className="overflow-hidden rounded-[22px] bg-slate-100 shadow-sm ring-1 ring-black/5">
          {facility.imageUrl ? (
            <img
              src={facility.imageUrl}
              alt={facility.name}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-pnu-muted">
              {facility.type}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-[20px] font-bold text-pnu-text">{facility.name}</h2>
          <p className="mt-1 text-[14px] text-pnu-muted">
            {facility.subtitle || facility.type}
          </p>
          {facility.hours ? (
            <p className="mt-2 text-[13px] font-semibold text-emerald-600">
              {t('campusMap.open')} {facility.hours}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            {
              key: 'directions',
              label: t('campusMap.directions'),
              icon: Navigation,
              onClick: openDirections,
              disabled: false,
            },
            {
              key: 'call',
              label: t('campusMap.call'),
              icon: Phone,
              onClick: callFacility,
              disabled: !facility.phone,
            },
            {
              key: 'website',
              label: t('campusMap.website'),
              icon: Globe,
              onClick: openWebsite,
              disabled: !facility.website,
            },
            {
              key: 'share',
              label: t('campusMap.share'),
              icon: Share2,
              onClick: shareFacility,
              disabled: false,
            },
          ].map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex flex-col items-center gap-2 disabled:opacity-40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pnu-blue text-white shadow-sm">
                <action.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold text-pnu-text">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 border-b border-pnu-border">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setTab('departments')}
              className={`pb-2.5 text-[14px] font-semibold ${
                tab === 'departments'
                  ? 'border-b-2 border-pnu-blue text-pnu-blue'
                  : 'text-pnu-muted'
              }`}
            >
              {t('campusMap.departments')}
            </button>
            <button
              type="button"
              onClick={() => setTab('facilities')}
              className={`pb-2.5 text-[14px] font-semibold ${
                tab === 'facilities'
                  ? 'border-b-2 border-pnu-blue text-pnu-blue'
                  : 'text-pnu-muted'
              }`}
            >
              {t('campusMap.facilitiesTab')}
            </button>
          </div>
        </div>

        <div className="mt-2 divide-y divide-pnu-border">
          {rooms.length === 0 ? (
            <p className="py-6 text-sm text-pnu-muted">{t('campusMap.noRooms')}</p>
          ) : (
            rooms.map((room) => (
              <div
                key={`${room.name}-${room.floor}`}
                className="flex items-center justify-between py-3.5"
              >
                <span className="text-[14px] font-medium text-pnu-text">{room.name}</span>
                <span className="text-[13px] font-semibold text-pnu-muted">{room.floor}</span>
              </div>
            ))
          )}
        </div>

        {facility.description ? (
          <p className="mt-4 text-[13px] leading-relaxed text-pnu-muted">
            {facility.description}
          </p>
        ) : null}

        <Link
          to="/map"
          className="mt-6 inline-flex text-[13px] font-semibold text-pnu-blue"
        >
          ← {t('campusMap.backToMap')}
        </Link>
      </div>
    </div>
  )
}
