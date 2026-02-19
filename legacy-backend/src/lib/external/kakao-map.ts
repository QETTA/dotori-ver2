/**
 * 카카오맵 SDK 래퍼
 * https://apis.map.kakao.com/web/documentation/
 */

declare global {
  interface Window {
    kakao: any
  }
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  name: string
  grade?: string
  probability?: number
  type?: string
}

const GRADE_COLORS: Record<string, string> = {
  A: 'oklch(0.72 0.19 142)',
  B: 'oklch(0.62 0.18 255)',
  C: 'oklch(0.75 0.16 75)',
  D: 'oklch(0.63 0.24 27)',
  E: 'oklch(0.58 0.22 25)',
  F: 'oklch(0.45 0.18 25)',
}

/* ─── SDK Loader ─── */
let loadPromise: Promise<void> | null = null
const MAP_SDK_SRC = 'https://dapi.kakao.com/v2/maps/sdk.js'
const MAP_SDK_SELECTOR = 'script[data-kakao-map-sdk="true"]'
const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? process.env.NEXT_PUBLIC_KAKAO_KEY
const USE_E2E_SDK_MOCK = process.env.NEXT_PUBLIC_E2E_DISABLE_EXTERNAL_SDK === '1'

function installKakaoMapMock() {
  if (window.kakao?.maps) return

  const createLatLng = (lat = 37.5012, lng = 127.0396) => ({
    getLat: () => lat,
    getLng: () => lng,
  })

  class LatLngBoundsMock {
    private points: Array<{ getLat: () => number; getLng: () => number }> = []

    extend(point: { getLat: () => number; getLng: () => number }) {
      this.points.push(point)
    }

    getSouthWest() {
      if (this.points.length === 0) return createLatLng()
      const minLat = Math.min(...this.points.map((p) => p.getLat()))
      const minLng = Math.min(...this.points.map((p) => p.getLng()))
      return createLatLng(minLat, minLng)
    }

    getNorthEast() {
      if (this.points.length === 0) return createLatLng()
      const maxLat = Math.max(...this.points.map((p) => p.getLat()))
      const maxLng = Math.max(...this.points.map((p) => p.getLng()))
      return createLatLng(maxLat, maxLng)
    }
  }

  class MapMock {
    private bounds = new LatLngBoundsMock()

    addControl() {}
    panTo(position: { getLat: () => number; getLng: () => number }) {
      this.bounds.extend(position)
    }
    setLevel() {}
    setBounds(bounds: LatLngBoundsMock) {
      this.bounds = bounds
    }
    getBounds() {
      return this.bounds
    }
  }

  class CustomOverlayMock {
    setMap() {}
  }

  class ZoomControlMock {}

  class GeocoderMock {
    addressSearch(_address: string, callback: (result: any[], status: string) => void) {
      callback([], 'ZERO_RESULT')
    }

    coord2Address(_lng: number, _lat: number, callback: (result: any[], status: string) => void) {
      callback([], 'ZERO_RESULT')
    }
  }

  window.kakao = {
    maps: {
      load: (callback: () => void) => callback(),
      Map: MapMock,
      LatLng: function LatLng(lat: number, lng: number) {
        return createLatLng(lat, lng)
      },
      LatLngBounds: LatLngBoundsMock,
      CustomOverlay: CustomOverlayMock,
      ZoomControl: ZoomControlMock,
      ControlPosition: { RIGHT: 'RIGHT' },
      event: { addListener: () => {} },
      services: {
        Geocoder: GeocoderMock,
        Status: { OK: 'OK' },
      },
    },
  }
}

function findMapSdkScript() {
  const byMarker = document.querySelector<HTMLScriptElement>(MAP_SDK_SELECTOR)
  if (byMarker) return byMarker
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
  return scripts.find((s) => s.src.includes('dapi.kakao.com/v2/maps/sdk.js')) ?? null
}

export function loadKakaoMapSDK(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('SSR'))
      return
    }
    if (window.kakao?.maps) {
      resolve()
      return
    }

    if (USE_E2E_SDK_MOCK) {
      installKakaoMapMock()
      resolve()
      return
    }

    if (!KAKAO_MAP_KEY) {
      reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY or NEXT_PUBLIC_KAKAO_KEY not set'))
      return
    }

    const ready = () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Map SDK not ready'))
        return
      }
      window.kakao.maps.load(() => resolve())
    }

    const existing = findMapSdkScript()
    if (existing) {
      if (window.kakao?.maps) {
        ready()
        return
      }
      existing.addEventListener('load', ready, { once: true })
      existing.addEventListener('error', () => reject(new Error('Kakao Map SDK load failed (existing script)')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = `${MAP_SDK_SRC}?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`
    script.async = true
    script.dataset.kakaoMapSdk = 'true'
    script.onload = ready
    script.onerror = () => reject(new Error(`Kakao Map SDK load failed: ${script.src}`))
    document.head.appendChild(script)
  })

  loadPromise = loadPromise.catch((error) => {
    loadPromise = null
    throw error
  })

  return loadPromise
}

/* ─── Map Controller ─── */
export class KakaoMapController {
  private map: any
  private overlays = new Map<string, any>()
  private userOverlay: any = null

  constructor(container: HTMLElement, center: { lat: number; lng: number }, level = 5) {
    const { kakao } = window
    this.map = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level,
    })
    this.map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT)
  }

  /* 마커 일괄 추가 (커스텀 오버레이 + 등급 배지) */
  setMarkers(markers: MapMarker[], onClickMarker?: (id: string) => void) {
    const { kakao } = window
    // 기존 제거
    for (const o of this.overlays.values()) {
      o.setMap(null)
    }
    this.overlays.clear()

    for (const m of markers) {
      const color = GRADE_COLORS[m.grade ?? 'C'] ?? 'oklch(0.55 0 0)'
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('aria-label', `${m.name} ${m.grade ?? ''} ${m.probability != null ? `${m.probability}%` : ''}`)
      btn.style.cssText = `cursor:pointer;display:flex;align-items:center;gap:3px;background:${color};color:var(--palette-white);padding:6px 10px;border-radius:12px;font-size:11px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.25);white-space:nowrap;position:relative;border:none;min-height:44px;min-width:44px;justify-content:center;transition:transform 0.1s`
      btn.innerHTML = `${m.grade ?? '?'}${m.probability != null ? ` ${m.probability}%` : ''}<span style=\"position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid ${color}\"></span>`
      btn.addEventListener('pointerdown', () => {
        btn.style.transform = 'scale(0.97)'
      })
      btn.addEventListener('pointerup', () => {
        btn.style.transform = ''
      })
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = ''
      })
      btn.addEventListener('click', () => onClickMarker?.(m.id))
      const content = btn

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(m.lat, m.lng),
        content,
        yAnchor: 1.5,
      })
      overlay.setMap(this.map)
      this.overlays.set(m.id, overlay)
    }
  }

  /* 내 위치 표시 */
  setUserLocation(lat: number, lng: number) {
    const { kakao } = window
    if (this.userOverlay) this.userOverlay.setMap(null)
    const el = document.createElement('div')
      el.innerHTML = `<div style="width:14px;height:14px;background:var(--palette-blue-500);border:3px solid var(--palette-white);border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,.3)"></div>`
    this.userOverlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lng),
      content: el,
      yAnchor: 0.5,
    })
    this.userOverlay.setMap(this.map)
  }

  /* 지도 이동 */
  panTo(lat: number, lng: number, level?: number) {
    const { kakao } = window
    this.map.panTo(new kakao.maps.LatLng(lat, lng))
    if (level) this.map.setLevel(level)
  }

  /* 바운드 맞춤 (모든 마커가 보이도록) */
  fitBounds(markers: MapMarker[]) {
    if (markers.length === 0) return
    const { kakao } = window
    const bounds = new kakao.maps.LatLngBounds()
    for (const m of markers) {
      bounds.extend(new kakao.maps.LatLng(m.lat, m.lng))
    }
    this.map.setBounds(bounds)
  }

  /* 현재 영역 가져오기 */
  getBounds(): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } {
    const b = this.map.getBounds()
    const sw = b.getSouthWest()
    const ne = b.getNorthEast()
    return { sw: { lat: sw.getLat(), lng: sw.getLng() }, ne: { lat: ne.getLat(), lng: ne.getLng() } }
  }

  /* 이벤트 */
  onIdle(callback: () => void) {
    const { kakao } = window
    kakao.maps.event.addListener(this.map, 'idle', callback)
  }

  /* 정리 */
  destroy() {
    for (const o of this.overlays.values()) {
      o.setMap(null)
    }
    this.overlays.clear()
    if (this.userOverlay) this.userOverlay.setMap(null)
  }
}

/* ─── React Hook ─── */
export function useKakaoMap() {
  let controller: KakaoMapController | null = null

  async function init(container: HTMLElement, center: { lat: number; lng: number }, level?: number) {
    await loadKakaoMapSDK()
    controller = new KakaoMapController(container, center, level)
    return controller
  }

  return { init, getController: () => controller }
}

/* ─── Geocoding (주소 → 좌표) ─── */
export async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  await loadKakaoMapSDK()
  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.addressSearch(address, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number.parseFloat(result[0].y), lng: Number.parseFloat(result[0].x) })
      } else {
        resolve(null)
      }
    })
  })
}

/* ─── Reverse Geocoding (좌표 → 행정동) ─── */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address: string; district: string; dong: string } | null> {
  await loadKakaoMapSDK()
  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.coord2Address(lng, lat, (result: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !result?.[0]) {
        resolve(null)
        return
      }

      const address = result[0].address ?? result[0].road_address
      const district = address?.region_2depth_name ?? ''
      const dong = address?.region_3depth_name ?? ''
      const addressName = address?.address_name ?? ''

      if (!district || !dong) {
        resolve(null)
        return
      }

      resolve({ address: addressName, district, dong })
    })
  })
}
