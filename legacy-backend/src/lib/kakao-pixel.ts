declare global {
  interface Window {
    kakaoPixel?: (trackId: string) => {
      pageView: () => void
      search: (params: Record<string, string>) => void
      viewContent: (params: Record<string, string>) => void
      addToCart: (params: Record<string, string>) => void
      completeRegistration: (params: Record<string, string>) => void
      custom: (eventName: string, params?: Record<string, string>) => void
    }
  }
}

type KakaoPixelApi = {
  pageView: () => void
  search: (params: Record<string, string>) => void
  viewContent: (params: Record<string, string>) => void
  addToCart: (params: Record<string, string>) => void
  completeRegistration: (params: Record<string, string>) => void
  custom: (eventName: string, params?: Record<string, string>) => void
}

const PIXEL_ID = process.env.NEXT_PUBLIC_KAKAO_PIXEL_ID ?? ''

/**
 * 브라우저에서만 kakaoPixel 인스턴스를 읽어옵니다.
 */
function getPixel(): KakaoPixelApi | null {
  if (typeof window === 'undefined' || !window.kakaoPixel || !PIXEL_ID) return null
  return window.kakaoPixel(PIXEL_ID)
}

/**
 * 공통 카카오 픽셀 이벤트 집합.
 */
export const kakaoEvents = {
  viewHome: () => getPixel()?.pageView(),
  searchDaycare: (query: string) => getPixel()?.search({ keyword: query }),
  selectDaycare: (id: string, name: string) => getPixel()?.viewContent({ id, name }),
  viewAnalysis: (id: string) => getPixel()?.custom('view_analysis', { facility_id: id }),
  openResearchLog: (id: string) => getPixel()?.custom('open_research_log', { facility_id: id }),
  setFirstChoice: (id: string) => getPixel()?.custom('set_first_choice', { facility_id: id }),
  enableToAlert: (id: string) => getPixel()?.custom('enable_to_alert', { facility_id: id }),
  followChannel: () => getPixel()?.custom('follow_channel'),
  shareResult: (id: string) => getPixel()?.custom('share_result', { facility_id: id }),
  shareInvite: (ref: string) => getPixel()?.custom('share_invite', { ref }),
}

export default kakaoEvents
