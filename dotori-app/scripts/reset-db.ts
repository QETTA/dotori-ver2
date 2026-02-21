/**
 * MongoDB 완전 리셋 + 엔진 맞춤 재설계 스크립트
 *
 * 실행: npx tsx --env-file=.env.local scripts/reset-db.ts
 *
 * 1. dotori DB의 모든 컬렉션 삭제
 * 2. 11개 컬렉션 생성 + 인덱스 설정
 * 3. 시설 500건 시드
 * 4. SystemConfig 초기값 설정
 * 5. 샘플 커뮤니티 게시물 시드
 */

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI 환경변수를 설정해주세요')
  process.exit(1)
}

// ═══════════════════════════════════════════
//  시설 시드 데이터
// ═══════════════════════════════════════════

const regions = [
  { sido: '서울특별시', sigungu: '강남구', dongs: ['역삼동', '삼성동', '대치동', '논현동', '청담동'] },
  { sido: '서울특별시', sigungu: '서초구', dongs: ['서초동', '반포동', '잠원동', '양재동'] },
  { sido: '서울특별시', sigungu: '송파구', dongs: ['잠실동', '방이동', '석촌동', '가락동'] },
  { sido: '서울특별시', sigungu: '마포구', dongs: ['합정동', '서교동', '연남동'] },
  { sido: '서울특별시', sigungu: '성동구', dongs: ['성수동', '금호동', '옥수동'] },
  { sido: '서울특별시', sigungu: '용산구', dongs: ['이태원동', '한남동', '용산동'] },
  { sido: '서울특별시', sigungu: '영등포구', dongs: ['여의도동', '당산동', '영등포동'] },
  { sido: '서울특별시', sigungu: '관악구', dongs: ['신림동', '봉천동'] },
  { sido: '서울특별시', sigungu: '동작구', dongs: ['사당동', '노량진동'] },
  { sido: '서울특별시', sigungu: '광진구', dongs: ['건대입구', '자양동', '구의동'] },
  { sido: '경기도', sigungu: '성남시', dongs: ['분당동', '정자동', '서현동'] },
  { sido: '경기도', sigungu: '수원시', dongs: ['영통동', '인계동', '매탄동'] },
  { sido: '경기도', sigungu: '용인시', dongs: ['수지구', '기흥구'] },
  { sido: '인천광역시', sigungu: '연수구', dongs: ['송도동', '연수동'] },
  { sido: '인천광역시', sigungu: '남동구', dongs: ['구월동', '간석동'] },
]

const types = ['국공립', '민간', '가정', '직장', '협동', '사회복지'] as const
const typeWeights = [0.15, 0.35, 0.25, 0.10, 0.05, 0.10]
const statuses = ['available', 'waiting', 'full'] as const
const featurePool = [
  '통학버스', '연장보육', '급식자체조리', '영어교육', '예체능특화',
  '소규모', '가정식급식', '텃밭체험', '직장보육', '부모참여',
  '숲체험', '유기농급식', '영아전담', '장애통합', '야간보육',
]
const programPool = [
  '누리과정', '영아보육', '방과후과정', '특수교육', '다문화',
  '숲놀이', '음악교육', '체육교육', '미술교육', '과학탐구',
]
const namePrefix = [
  '해피', '사랑', '별빛', '숲속', '무지개', '푸른', '햇살', '꿈나무',
  '은행', '다솜', '참좋은', '아이뜰', '동그라미', '하늘', '바다',
  '초록', '나무', '꽃잎', '산들', '예쁜', '소담', '미래', '도담',
  '새싹', '열린', '우리', '세종', '한울', '또래', '빛나는',
]

const centerCoords: Record<string, [number, number]> = {
  강남구: [37.497, 127.038], 서초구: [37.484, 127.015],
  송파구: [37.514, 127.106], 마포구: [37.553, 126.907],
  성동구: [37.563, 127.037], 용산구: [37.532, 126.990],
  영등포구: [37.526, 126.896], 관악구: [37.478, 126.951],
  동작구: [37.512, 126.940], 광진구: [37.538, 127.082],
  성남시: [37.420, 127.126], 수원시: [37.263, 127.029],
  용인시: [37.240, 127.178], 연수구: [37.410, 126.678],
  남동구: [37.449, 126.731],
}

// 지역별 전화번호 접두사
const areaCode: Record<string, string> = {
  서울특별시: '02', 경기도: '031', 인천광역시: '032',
}

// 다양한 영업시간 패턴
const operatingPatterns = [
  { open: '07:00', close: '19:00' },
  { open: '07:30', close: '19:30' },
  { open: '07:30', close: '20:00' },
  { open: '08:00', close: '18:00' },
  { open: '08:00', close: '19:00' },
  { open: '07:00', close: '22:00' }, // 야간보육
]

// 시설 이미지 placeholder pool
const imagePool = [
  '/brand/dotori-watermark.svg',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function pickWeighted<T>(arr: readonly T[], weights: number[]): T {
  const r = Math.random(); let sum = 0
  for (let i = 0; i < arr.length; i++) { sum += weights[i]; if (r <= sum) return arr[i] }
  return arr[arr.length - 1]
}
function randomCoord(base: number, range: number): number {
  return +(base + (Math.random() - 0.5) * range).toFixed(6)
}
function regionPhone(sido: string): string {
  const code = areaCode[sido] || '02'
  return `${code}-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

// ═══════════════════════════════════════════
//  메인 리셋 로직
// ═══════════════════════════════════════════

async function resetDB() {
  console.log('═══════════════════════════════════════')
  console.log('  MongoDB 완전 리셋 시작')
  console.log('═══════════════════════════════════════')

  // 1. 연결
  console.log('\n[1/7] MongoDB Atlas 연결 중...')
  await mongoose.connect(MONGODB_URI!, { dbName: 'dotori' })
  const db = mongoose.connection.db!
  console.log('  ✅ 연결 성공')

  // 2. 기존 컬렉션 전부 삭제
  console.log('\n[2/7] 기존 컬렉션 삭제...')
  const existing = await db.listCollections().toArray()
  for (const col of existing) {
    await db.dropCollection(col.name)
    console.log(`  🗑️  ${col.name} 삭제`)
  }
  if (existing.length === 0) console.log('  (삭제할 컬렉션 없음)')

  // 3. 11개 컬렉션 생성 + 인덱스
  console.log('\n[3/7] 11개 컬렉션 생성 + 인덱스 설정...')

  // --- facilities ---
  const facilities = db.collection('facilities')
  await facilities.createIndex({ location: '2dsphere' })
  await facilities.createIndex({ 'region.sido': 1, 'region.sigungu': 1 })
  await facilities.createIndex({ status: 1, type: 1 })
  await facilities.createIndex({ name: 'text', address: 'text' })
  await facilities.createIndex({ lastSyncedAt: -1 })
  await facilities.createIndex({ 'region.sido': 1, 'region.sigungu': 1, status: 1, lastSyncedAt: -1 })
  console.log('  ✅ facilities (6 indexes)')

  // --- users ---
  const users = db.collection('users')
  await users.createIndex({ email: 1 }, { unique: true, sparse: true })
  console.log('  ✅ users (1 index)')

  // --- waitlists ---
  const waitlists = db.collection('waitlists')
  await waitlists.createIndex({ userId: 1, facilityId: 1 }, { unique: true })
  await waitlists.createIndex({ facilityId: 1, status: 1 })
  console.log('  ✅ waitlists (2 indexes)')

  // --- alerts ---
  const alerts = db.collection('alerts')
  await alerts.createIndex({ userId: 1, facilityId: 1 })
  await alerts.createIndex({ active: 1, type: 1 })
  console.log('  ✅ alerts (2 indexes)')

  // --- chathistories ---
  const chathistories = db.collection('chathistories')
  await chathistories.createIndex({ userId: 1, createdAt: -1 })
  console.log('  ✅ chathistories (1 index)')

  // --- posts ---
  const posts = db.collection('posts')
  await posts.createIndex({ category: 1, createdAt: -1 })
  await posts.createIndex({ facilityTags: 1 })
  await posts.createIndex({ likes: -1, createdAt: -1 })
  console.log('  ✅ posts (3 indexes)')

  // --- actionintents ---
  const actionintents = db.collection('actionintents')
  await actionintents.createIndex({ userId: 1, status: 1 })
  await actionintents.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  console.log('  ✅ actionintents (2 indexes, TTL)')

  // --- actionexecutions ---
  const actionexecutions = db.collection('actionexecutions')
  await actionexecutions.createIndex({ idempotencyKey: 1 }, { unique: true })
  await actionexecutions.createIndex({ userId: 1, executedAt: -1 })
  console.log('  ✅ actionexecutions (2 indexes)')

  // --- facilitysnapshots ---
  const facilitysnapshots = db.collection('facilitysnapshots')
  await facilitysnapshots.createIndex({ facilityId: 1, snapshotAt: -1 })
  console.log('  ✅ facilitysnapshots (1 index)')

  // --- alimtalklogs ---
  const alimtalklogs = db.collection('alimtalklogs')
  await alimtalklogs.createIndex({ userId: 1, createdAt: -1 })
  await alimtalklogs.createIndex({ status: 1 })
  await alimtalklogs.createIndex({ templateId: 1 })
  console.log('  ✅ alimtalklogs (3 indexes)')

  // --- systemconfigs ---
  const systemconfigs = db.collection('systemconfigs')
  await systemconfigs.createIndex({ key: 1 }, { unique: true })
  console.log('  ✅ systemconfigs (1 index)')

  // 4. 시설 500건 시드
  console.log('\n[4/7] 시설 500건 시드...')
  const facilityDocs = []
  let id = 0

  for (const region of regions) {
    const count = Math.floor(500 / regions.length) + (id < 500 % regions.length ? 1 : 0)
    const coords = centerCoords[region.sigungu] || [37.5, 127.0]

    for (let i = 0; i < count && facilityDocs.length < 500; i++) {
      id++
      const type = pickWeighted(types, typeWeights)
      const status = pick(statuses)
      const dong = pick(region.dongs)
      const total = type === '가정' ? 15 + Math.floor(Math.random() * 10)
        : type === '직장' ? 30 + Math.floor(Math.random() * 20)
        : 40 + Math.floor(Math.random() * 80)
      const current = status === 'available'
        ? total - Math.floor(Math.random() * Math.max(1, Math.floor(total * 0.15)))
        : total
      const waiting = status === 'full'
        ? Math.floor(Math.random() * 25)
        : status === 'waiting'
          ? 1 + Math.floor(Math.random() * 15)
          : 0

      const numFeatures = 2 + Math.floor(Math.random() * 4)
      const features = [...new Set(Array.from({ length: numFeatures }, () => pick(featurePool)))]
      const numPrograms = 1 + Math.floor(Math.random() * 3)
      const programs = [...new Set(Array.from({ length: numPrograms }, () => pick(programPool)))]

      facilityDocs.push({
        name: `${pick(namePrefix)}어린이집`,
        type,
        status,
        address: `${region.sido} ${region.sigungu} ${dong} ${100 + Math.floor(Math.random() * 900)}`,
        region: { sido: region.sido, sigungu: region.sigungu, dong },
        location: {
          type: 'Point',
          coordinates: [randomCoord(coords[1], 0.02), randomCoord(coords[0], 0.015)],
        },
        phone: regionPhone(region.sido),
        capacity: { total, current, waiting },
        features,
        programs,
        rating: +(3 + Math.random() * 2).toFixed(1),
        reviewCount: Math.floor(Math.random() * 50),
        evaluationGrade: pick(['A', 'B', 'C', 'D', null]),
        operatingHours: {
          ...pick(operatingPatterns),
          extendedCare: features.includes('연장보육') || features.includes('야간보육'),
        },
        images: Math.random() > 0.6 ? [pick(imagePool)] : [],
        dataSource: 'seed',
        lastSyncedAt: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  const facilityResult = await facilities.insertMany(facilityDocs)
  console.log(`  ✅ ${facilityResult.insertedCount}건 삽입`)

  // 지역별 분포
  const regionDist: Record<string, number> = {}
  for (const f of facilityDocs) {
    const key = `${f.region.sigungu}`
    regionDist[key] = (regionDist[key] || 0) + 1
  }
  console.log('  📊 지역별:', Object.entries(regionDist).map(([k, v]) => `${k}(${v})`).join(', '))

  // 5. SystemConfig 초기값
  console.log('\n[5/7] SystemConfig 초기값 설정...')
  const configDocs = [
    { key: 'app.version', value: '2.0.0', description: '앱 버전', updatedAt: new Date() },
    { key: 'app.build', value: '2026.02.20', description: '빌드 날짜', updatedAt: new Date() },
    { key: 'data.lastSync', value: new Date().toISOString(), description: '마지막 시설 동기화 시각', updatedAt: new Date() },
    { key: 'data.source', value: '아이사랑포털 + 시드데이터', description: '데이터 출처', updatedAt: new Date() },
    { key: 'cron.toMonitor.intervalMin', value: '5', description: 'TO 모니터 크론 주기 (분)', updatedAt: new Date() },
    { key: 'ai.provider', value: 'anthropic', description: 'AI 프로바이더', updatedAt: new Date() },
    { key: 'ai.model', value: 'claude-opus-4-6', description: 'AI 모델', updatedAt: new Date() },
    { key: 'feature.chat', value: 'true', description: '토리챗 활성화', updatedAt: new Date() },
    { key: 'feature.community', value: 'true', description: '커뮤니티 활성화', updatedAt: new Date() },
    { key: 'feature.alimtalk', value: 'false', description: '알림톡 활성화', updatedAt: new Date() },
  ]
  await systemconfigs.insertMany(configDocs)
  console.log(`  ✅ ${configDocs.length}개 설정값 삽입`)

  // 6. 샘플 커뮤니티 게시물 (15건)
  console.log('\n[6/7] 샘플 커뮤니티 게시물 시드...')
  const samplePosts = [
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '도토리맘', avatar: null, verified: false },
      content: '강남구 국공립 어린이집 대기 순서가 어떻게 되나요? 작년에 신청했는데 아직 연락이 안 와서요.',
      category: 'question',
      facilityTags: ['국공립', '강남구'],
      likes: 12, likedBy: [], commentCount: 5,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '서초동아빠', avatar: null, verified: true },
      content: '서초구 별빛어린이집 다녀왔어요. 시설이 정말 깔끔하고 선생님들이 친절하세요. 연장보육도 잘 되고 있어서 직장맘한테 추천합니다.',
      category: 'review',
      facilityTags: ['서초구', '국공립'],
      likes: 28, likedBy: [], commentCount: 8,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '맘카페지기', avatar: null, verified: true },
      content: '2026년 상반기 어린이집 입소 신청 일정 공유합니다. 국공립은 3월 1일부터 온라인 접수 시작이고, 민간/가정은 수시 모집 중이에요.',
      category: 'info',
      facilityTags: [],
      likes: 45, likedBy: [], commentCount: 15,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '송파맘', avatar: null, verified: false },
      content: '잠실동 어린이집 비교해봤는데 가정어린이집이 소규모라 아이한테 더 맞는 것 같아요. 혹시 잠실 쪽 가정어린이집 추천해주실 분?',
      category: 'question',
      facilityTags: ['가정', '송파구'],
      likes: 8, likedBy: [], commentCount: 3,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '마포동네맘', avatar: null, verified: false },
      content: '합정동 무지개어린이집 평가인증 A등급 받았다고 하네요! 숲체험 프로그램이 좋다고 소문났는데 직접 가보니 정말 좋았어요.',
      category: 'review',
      facilityTags: ['마포구', '국공립'],
      likes: 33, likedBy: [], commentCount: 11,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '성수아빠', avatar: null, verified: false },
      content: '성동구 어린이집 긴급보육 정보 공유해요. 갑자기 출장이 잡혔을 때 긴급보육 신청하는 방법이에요.',
      category: 'info',
      facilityTags: ['성동구'],
      likes: 19, likedBy: [], commentCount: 6,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '분당맘', avatar: null, verified: true },
      content: '도토리 앱 정말 편하네요. 주변 어린이집 비교가 한눈에 되니까 고민 시간이 확 줄었어요. 대기 순번 알림도 좋고요!',
      category: 'feedback',
      facilityTags: [],
      likes: 52, likedBy: [], commentCount: 20,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '용인이맘', avatar: null, verified: false },
      content: '용인시 직장어린이집 리스트 정리해봤어요. 수지구, 기흥구 쪽 직장어린이집은 총 12곳이고 대부분 대기 상태에요.',
      category: 'info',
      facilityTags: ['용인시', '직장'],
      likes: 15, likedBy: [], commentCount: 4,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    // ── 추가 7건 ──
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '영등포워킹맘', avatar: null, verified: false },
      content: '여의도 직장어린이집 이용 중인데 저녁 7시 30분까지 연장보육 해줘서 정말 감사해요. 급식도 자체 조리라 안심이에요.',
      category: 'review',
      facilityTags: ['영등포구', '직장'],
      likes: 41, likedBy: [], commentCount: 13,
      createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '관악동주민', avatar: null, verified: false },
      content: '신림동 쪽 협동어린이집 경험 있으신 분 계세요? 부모 참여 활동이 많다고 들었는데 실제로 어떤가요?',
      category: 'question',
      facilityTags: ['관악구', '협동'],
      likes: 6, likedBy: [], commentCount: 9,
      createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '광진육아맘', avatar: null, verified: true },
      content: '건대입구 근처 어린이집 3곳 직접 방문 비교 리뷰입니다! 사랑어린이집은 놀이공간이 넓고, 해피어린이집은 영어교육이 강점, 무지개어린이집은 급식이 최고에요.',
      category: 'review',
      facilityTags: ['광진구'],
      likes: 67, likedBy: [], commentCount: 24,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '수원새내기맘', avatar: null, verified: false },
      content: '첫째 어린이집 보내는 건데 너무 불안하네요. 적응 기간 동안 어떻게 해야 하나요? 선배맘들 조언 부탁드려요.',
      category: 'question',
      facilityTags: [],
      likes: 23, likedBy: [], commentCount: 17,
      createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '동작맘', avatar: null, verified: false },
      content: '사당동 국공립어린이집 TO 소식! 오늘 확인했는데 사랑어린이집이 만 3세반 2자리 빈자리 생겼대요. 관심 있으신 분 빨리 신청하세요.',
      category: 'info',
      facilityTags: ['동작구', '국공립'],
      likes: 38, likedBy: [], commentCount: 7,
      createdAt: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '인천연수맘', avatar: null, verified: true },
      content: '송도 신도시 어린이집 장단점 정리해봤어요. 시설은 새거라 좋은데 주변에 자연환경이 부족한 게 아쉬워요. 숲체험은 차로 20분 이동해야 해요.',
      category: 'review',
      facilityTags: ['연수구'],
      likes: 31, likedBy: [], commentCount: 10,
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      authorId: new mongoose.Types.ObjectId(),
      author: { nickname: '성남아빠', avatar: null, verified: false },
      content: '도토리 앱에서 시설 비교 기능 써봤는데 정말 직관적이에요. 정원, 대기, 프로그램이 한눈에 보여서 결정하기 쉬웠습니다.',
      category: 'feedback',
      facilityTags: [],
      likes: 29, likedBy: [], commentCount: 5,
      createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
    },
  ]
  await posts.insertMany(samplePosts)
  console.log(`  ✅ ${samplePosts.length}개 게시물 삽입`)

  // 7. 검증
  console.log('\n[7/7] 검증...')
  const collections = await db.listCollections().toArray()
  console.log(`  📦 컬렉션 수: ${collections.length}`)

  let totalIndexes = 0
  for (const col of collections) {
    const c = db.collection(col.name)
    const count = await c.countDocuments()
    const indexes = await c.indexes()
    totalIndexes += indexes.length - 1 // _id 제외
    const indexNames = indexes.filter(i => i.name !== '_id_').map(i => i.name).join(', ')
    console.log(`  📋 ${col.name}: ${count}건, 인덱스: [${indexNames}]`)
  }

  console.log('\n═══════════════════════════════════════')
  console.log('  ✅ MongoDB 완전 리셋 완료!')
  console.log(`  📦 컬렉션: ${collections.length}개`)
  console.log(`  📊 인덱스: ${totalIndexes}개 (커스텀)`)
  console.log(`  🏢 시설: ${facilityDocs.length}건`)
  console.log(`  ⚙️  설정: ${configDocs.length}건`)
  console.log(`  📝 게시물: ${samplePosts.length}건`)
  console.log('═══════════════════════════════════════')

  await mongoose.disconnect()
}

resetDB().catch((err) => {
  console.error('❌ 리셋 실패:', err)
  process.exit(1)
})
