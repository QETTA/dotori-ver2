import mongoose from 'mongoose'
import Facility, { type IFacility } from '../src/models/Facility'

type KakaoDocument = {
  id?: string
  place_name: string
  phone?: string
  address_name?: string
  road_address_name?: string
  place_url?: string
  x?: string
  y?: string
}

type KakaoResponse = {
  documents: KakaoDocument[]
}

type CityTarget = {
  sido: string
  sigungu: string
  query: string
}

type RecoverFacilityPayload = {
  name: string
  type: IFacility['type']
  status: IFacility['status']
  address: string
  region: { sido: string; sigungu: string; dong: string }
  location: { type: 'Point'; coordinates: [number, number] }
  phone?: string
  capacity: { total: number; current: number; waiting: number }
  features: string[]
  programs: string[]
  rating: number
  reviewCount: number
  kakaoPlaceUrl?: string
  kakaoPlaceId?: string
  dataSource: string
}

type RecoverSummary = {
  sigungu: string
  found: number
  newCandidates: number
  skipped: number
  inserted: number
}

const TARGET_CITIES: CityTarget[] = [
  { sido: '경기도', sigungu: '성남시 분당구', query: '성남시 분당구 어린이집' },
  { sido: '경기도', sigungu: '성남시 수정구', query: '성남시 수정구 어린이집' },
  { sido: '경기도', sigungu: '성남시 중원구', query: '성남시 중원구 어린이집' },
  { sido: '경기도', sigungu: '수원시 영통구', query: '수원시 영통구 어린이집' },
  { sido: '경기도', sigungu: '수원시 팔달구', query: '수원시 팔달구 어린이집' },
  { sido: '경기도', sigungu: '수원시 장안구', query: '수원시 장안구 어린이집' },
  { sido: '경기도', sigungu: '수원시 권선구', query: '수원시 권선구 어린이집' },
  { sido: '경기도', sigungu: '고양시 일산동구', query: '고양시 일산동구 어린이집' },
  { sido: '경기도', sigungu: '고양시 일산서구', query: '고양시 일산서구 어린이집' },
  { sido: '경기도', sigungu: '고양시 덕양구', query: '고양시 덕양구 어린이집' },
]

function normalize(value?: string): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function inferFacilityType(placeName: string): IFacility['type'] {
  if (placeName.includes('국립') || placeName.includes('국공립')) {
    return '국공립'
  }
  if (placeName.includes('가정')) {
    return '가정'
  }
  if (placeName.includes('직장') || placeName.includes('근로자')) {
    return '직장'
  }
  if (placeName.includes('협동') || placeName.includes('협동조합')) {
    return '협동'
  }
  if (placeName.includes('사회복지') || placeName.includes('복지')) {
    return '사회복지'
  }
  return '민간'
}

function inferDong(address: string, sido: string, sigungu: string): string {
  const normalized = normalize(address)
  const parts = normalized.split(' ')

  const matchPrefix = [sido, ...sigungu.split(' ')]
  if (parts.length > matchPrefix.length && matchPrefix.every((part, idx) => parts[idx] === part)) {
    return parts[matchPrefix.length] || ''
  }

  return ''
}

function makeDuplicateKey(doc: KakaoDocument, address: string, name: string): string {
  if (doc.id) {
    return `id:${doc.id}`
  }
  return `name-address:${normalize(name)}|${normalize(address)}`
}

async function searchKakao(query: string, page: number, kakaoKey: string): Promise<KakaoDocument[]> {
  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json')
  url.searchParams.set('query', query)
  url.searchParams.set('category_group_code', 'HP8')
  url.searchParams.set('size', '15')
  url.searchParams.set('page', String(page))

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `KakaoAK ${kakaoKey}`,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Kakao API 오류 (${response.status}): ${message}`)
  }

  const body = (await response.json()) as KakaoResponse
  return body.documents ?? []
}

async function existsInDotori(name: string, address: string, kakaoPlaceId?: string) {
  const orConditions: Array<Record<string, string>> = [{ name, address }]
  if (kakaoPlaceId) {
    orConditions.push({ kakaoPlaceId })
  }
  return Facility.exists({ $or: orConditions })
}

function buildFacilityPayload(
  doc: KakaoDocument,
  city: CityTarget,
  address: string,
): RecoverFacilityPayload {
  const longitude = Number(doc.x)
  const latitude = Number(doc.y)

  return {
    name: normalize(doc.place_name),
    type: inferFacilityType(doc.place_name),
    status: 'available',
    address,
    region: {
      sido: city.sido,
      sigungu: city.sigungu,
      dong: inferDong(address, city.sido, city.sigungu),
    },
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    phone: normalize(doc.phone) || undefined,
    capacity: {
      total: 0,
      current: 0,
      waiting: 0,
    },
    features: [],
    programs: [],
    rating: 0,
    reviewCount: 0,
    kakaoPlaceUrl: normalize(doc.place_url) || undefined,
    kakaoPlaceId: doc.id ? String(doc.id) : undefined,
    dataSource: 'kakao-keyword-recovery',
  }
}

async function recoverCity(
  target: CityTarget,
  kakaoKey: string,
): Promise<{ summary: RecoverSummary; inserts: RecoverFacilityPayload[] }> {
  const summary: RecoverSummary = {
    sigungu: target.sigungu,
    found: 0,
    newCandidates: 0,
    skipped: 0,
    inserted: 0,
  }

  const inserts: RecoverFacilityPayload[] = []
  const seen = new Set<string>()

  for (let page = 1; page <= 3; page++) {
    const documents = await searchKakao(target.query, page, kakaoKey)

    for (const doc of documents) {
      const name = normalize(doc.place_name)
      const address = normalize(doc.address_name || doc.road_address_name)

      if (!name || !address) {
        continue
      }

      const duplicateKey = makeDuplicateKey(doc, address, name)
      if (seen.has(duplicateKey)) {
        continue
      }
      seen.add(duplicateKey)

      summary.found += 1

      const exists = await existsInDotori(name, address, doc.id ? String(doc.id) : undefined)
      if (exists) {
        summary.skipped += 1
        continue
      }

      const longitude = Number(doc.x)
      const latitude = Number(doc.y)
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        continue
      }

      inserts.push(buildFacilityPayload(doc, target, address))
      summary.newCandidates += 1
    }
  }

  return { summary, inserts }
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const isDryRun = args.has('--dry-run')

  const MONGODB_URI = process.env.MONGODB_URI
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY

  if (!MONGODB_URI) {
    console.error('MONGODB_URI 환경변수가 없습니다.')
    process.exit(1)
  }

  if (!KAKAO_REST_API_KEY) {
    console.error('KAKAO_REST_API_KEY 환경변수가 없습니다.')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI, { dbName: 'dotori' })

  const results: RecoverSummary[] = []

  try {
    console.log(`복구 작업 시작 (dry-run=${isDryRun})`)

    for (const target of TARGET_CITIES) {
      console.log(`\n[${target.sigungu}] 검색 시작`)
      const { summary, inserts } = await recoverCity(target, KAKAO_REST_API_KEY)

      if (isDryRun) {
        summary.inserted = 0
        console.log(
          `[${target.sigungu}] 발견 ${summary.found}건, 신규 후보 ${summary.newCandidates}건, 중복 ${summary.skipped}건`,
        )
      } else {
        const inserted = inserts.length === 0 ? [] : await Facility.insertMany(inserts)
        summary.inserted = inserted.length
        console.log(
          `[${target.sigungu}] 발견 ${summary.found}건, 신규 후보 ${summary.newCandidates}건, 삽입 ${summary.inserted}건, 중복 ${summary.skipped}건`,
        )
      }

      results.push(summary)
    }

    console.log('\n=== 도시별 결과 ===')
    for (const summary of results) {
      if (isDryRun) {
        console.log(
          `${summary.sigungu}: 발견 ${summary.found}건 / 신규 삽입예상 ${summary.newCandidates}건 / 중복 ${summary.skipped}건`,
        )
      } else {
        console.log(
          `${summary.sigungu}: 신규 삽입 ${summary.inserted}건 / 중복 ${summary.skipped}건`,
        )
      }
    }
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('복구 스크립트 실행 오류:', error)
  process.exit(1)
})
