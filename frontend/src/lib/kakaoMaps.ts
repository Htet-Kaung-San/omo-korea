const KAKAO_MAP_SCRIPT_ID = 'kakao-map-script'

export const PNU_CENTER = { lat: 35.2338, lng: 129.0794 }

interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  setLevel(level: number): void
  panTo(latlng: KakaoLatLng): void
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
}

export interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void
  close(): void
}

export interface KakaoMapsApi {
  maps: {
    load: (callback: () => void) => void
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    Map: new (
      element: HTMLElement,
      options: { center: KakaoLatLng; level: number },
    ) => KakaoMap
    Marker: new (options: { position: KakaoLatLng; title?: string }) => KakaoMarker
    InfoWindow: new (options: { content: string | HTMLElement }) => KakaoInfoWindow
    event: {
      addListener: (target: KakaoMap | KakaoMarker, type: string, handler: () => void) => void
    }
  }
}

declare global {
  interface Window {
    kakao?: KakaoMapsApi
  }
}

export function loadKakaoMaps(appKey: string): Promise<KakaoMapsApi> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve(window.kakao)
      return
    }

    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript ?? document.createElement('script')
    script.id = KAKAO_MAP_SCRIPT_ID
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.async = true

    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK loaded but maps API is unavailable'))
        return
      }

      window.kakao.maps.load(() => {
        if (!window.kakao?.maps) {
          reject(new Error('Kakao Maps SDK failed to initialize'))
          return
        }
        resolve(window.kakao)
      })
    }

    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'))

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })
}
