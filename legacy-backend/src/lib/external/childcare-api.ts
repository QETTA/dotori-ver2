/**
 * 공공데이터포털 어린이집 API
 * https://www.data.go.kr - 보육 관련 공공데이터
 *
 * 환경변수: DATA_GO_KR_KEY (공공데이터포털 인증키)
 */

const CHILDCARE_URL = 'http://api.childcare.go.kr/mediate/rest'

interface RawFacility {
  crname: string // 어린이집명
  craddr: string // 주소
  crtel: string // 전화번호
  crtypename: string // 어린이집 유형
  crcapat: string // 정원
  crchcnt: string // 현원
  crwcnt: string // 대기 아동수
  la: string // 위도
  lo: string // 경도
  crstpname: string // 설립 유형
  crfax?: string
  cropstime?: string // 운영 시간
  sigunname?: string // 시군구명
}

export interface ParsedFacility {
  name: string
  type: string
  address: string
  phone: string
  capacity: number
  currentEnrollment: number
  waitlist: number
  lat: number
  lng: number
  operatingHours: string
  region: string
}

/* ─── API Call ─── */
export async function fetchChildcareFacilities(params: {
  arcode?: string // 지역 코드
  stcode?: string // 설립 유형 코드 (1:국공립, 2:사회복지, 3:법인, 4:민간, 5:가정, 6:직장)
  page?: number
  perPage?: number
}): Promise<{ facilities: ParsedFacility[]; total: number }> {
  const key = process.env.DATA_GO_KR_KEY
  if (!key) throw new Error('DATA_GO_KR_KEY not set')

  const { arcode, stcode, page = 1, perPage = 100 } = params

  const url = new URL(`${CHILDCARE_URL}/cpmsapi030/cpmsapi030/request`)
  url.searchParams.set('key', key)
  url.searchParams.set('type', 'json')
  if (arcode) url.searchParams.set('arcode', arcode)
  if (stcode) url.searchParams.set('stcode', stcode)
  url.searchParams.set('pageno', String(page))
  url.searchParams.set('output', String(perPage))

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } }) // 24h cache
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    const items: RawFacility[] = data?.response?.body?.items?.item ?? []
    const total = Number.parseInt(data?.response?.body?.totalCount ?? '0', 10)

    const facilities = items.map(parseFacility).filter((f): f is ParsedFacility => f !== null)

    return { facilities, total }
  } catch (error) {
    console.error('[ChildcareAPI]', error)
    return { facilities: [], total: 0 }
  }
}

function parseFacility(raw: RawFacility): ParsedFacility | null {
  const lat = Number.parseFloat(raw.la)
  const lng = Number.parseFloat(raw.lo)
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0) return null

  return {
    name: raw.crname?.trim() ?? '',
    type: mapType(raw.crtypename ?? raw.crstpname ?? ''),
    address: raw.craddr?.trim() ?? '',
    phone: raw.crtel?.trim() ?? '',
    capacity: Number.parseInt(raw.crcapat, 10) || 0,
    currentEnrollment: Number.parseInt(raw.crchcnt, 10) || 0,
    waitlist: Number.parseInt(raw.crwcnt, 10) || 0,
    lat,
    lng,
    operatingHours: raw.cropstime?.trim() ?? '07:30-19:30',
    region: raw.sigunname?.trim() ?? '',
  }
}

function mapType(raw: string): string {
  if (raw.includes('국공립')) return '국공립'
  if (raw.includes('민간')) return '민간'
  if (raw.includes('가정')) return '가정'
  if (raw.includes('직장')) return '직장'
  if (raw.includes('사회복지')) return '사회복지'
  if (raw.includes('법인')) return '법인'
  return '민간'
}

/* ─── Region Codes (서울 시군구) ─── */
export const SEOUL_REGION_CODES: Record<string, string> = {
  강남구: '11680',
  강동구: '11740',
  강북구: '11305',
  강서구: '11500',
  관악구: '11620',
  광진구: '11215',
  구로구: '11530',
  금천구: '11545',
  노원구: '11350',
  도봉구: '11320',
  동대문구: '11230',
  동작구: '11590',
  마포구: '11440',
  서대문구: '11410',
  서초구: '11650',
  성동구: '11200',
  성북구: '11290',
  송파구: '11710',
  양천구: '11470',
  영등포구: '11560',
  용산구: '11170',
  은평구: '11380',
  종로구: '11110',
  중구: '11140',
  중랑구: '11260',
}

/* ─── Sync: Import public data into Prisma ─── */
export async function syncFacilitiesToDB(regionCode: string) {
  // Dynamic import to avoid bundling Prisma in client
  const { default: prisma } = await import('@/lib/db/prisma')

  const { facilities } = await fetchChildcareFacilities({ arcode: regionCode, perPage: 500 })

  let created = 0
  let updated = 0

  for (const f of facilities) {
    const existing = await prisma.facility.findFirst({
      where: { name: f.name, address: f.address },
    })

    if (existing) {
      await prisma.facility.update({
        where: { id: existing.id },
        data: {
          currentEnroll: f.currentEnrollment,
          capacity: f.capacity,
        },
      })
      updated++
    } else {
      await prisma.facility.create({
        data: {
          name: f.name,
          type: f.type,
          address: f.address,
          city: '',
          district: '',
          lat: f.lat,
          lng: f.lng,
          phone: f.phone,
          capacity: f.capacity,
          currentEnroll: f.currentEnrollment,
          operatingHours: f.operatingHours,
        },
      })
      created++
    }
  }

  return { created, updated, total: facilities.length }
}
