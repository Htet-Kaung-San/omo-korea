const NAVER_MAP_SCRIPT_ID = 'naver-map-script'

export const PNU_CENTER = { lat: 35.2338, lng: 129.0794 }

export interface NaverLatLng {
  lat(): number
  lng(): number
}

export interface NaverMap {
  panTo(latlng: NaverLatLng): void
  setZoom(zoom: number): void
}

export interface NaverMarker {
  setMap(map: NaverMap | null): void
}

export interface NaverInfoWindow {
  open(map: NaverMap, anchor: NaverMarker): void
  close(): void
}

export interface NaverMapsApi {
  maps: {
    LatLng: new (lat: number, lng: number) => NaverLatLng
    Map: new (
      element: HTMLElement,
      options: { center: NaverLatLng; zoom: number },
    ) => NaverMap
    Marker: new (options: {
      position: NaverLatLng
      map?: NaverMap
      title?: string
    }) => NaverMarker
    InfoWindow: new (options: { content: string }) => NaverInfoWindow
    Event: {
      addListener: (target: NaverMap | NaverMarker, type: string, handler: () => void) => void
    }
  }
}

declare global {
  interface Window {
    naver?: NaverMapsApi
  }
}

export function loadNaverMaps(clientId: string): Promise<NaverMapsApi> {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve(window.naver)
      return
    }

    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript ?? document.createElement('script')
    script.id = NAVER_MAP_SCRIPT_ID
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`
    script.async = true

    script.onload = () => {
      if (!window.naver?.maps) {
        reject(new Error('Naver Maps SDK loaded but maps API is unavailable'))
        return
      }
      resolve(window.naver)
    }

    script.onerror = () => reject(new Error('Failed to load Naver Maps SDK'))

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })
}
