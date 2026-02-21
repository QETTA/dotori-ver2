import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI 환경변수를 설정해주세요')
  process.exit(1)
}

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
const namePrefix = [
  '해피', '사랑', '별빛', '숲속', '무지개', '푸른', '햇살', '꿈나무',
  '은행', '다솜', '참좋은', '아이뜰', '동그라미', '하늘', '바다',
  '초록', '나무', '꽃잎', '산들', '예쁜', '소담', '미래', '도담',
  '새싹', '열린', '우리', '세종', '한울', '또래', '빛나는',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted<T>(arr: readonly T[], weights: number[]): T {
  const r = Math.random()
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += weights[i]
    if (r <= sum) return arr[i]
  }
  return arr[arr.length - 1]
}

function randomCoord(base: number, range: number): number {
  return +(base + (Math.random() - 0.5) * range).toFixed(6)
}

// Seoul center coords
const centerCoords: Record<string, [number, number]> = {
  강남구: [37.497, 127.038],
  서초구: [37.484, 127.015],
  송파구: [37.514, 127.106],
  마포구: [37.553, 126.907],
  성동구: [37.563, 127.037],
  용산구: [37.532, 126.990],
  영등포구: [37.526, 126.896],
  관악구: [37.478, 126.951],
  동작구: [37.512, 126.940],
  광진구: [37.538, 127.082],
  성남시: [37.420, 127.126],
  수원시: [37.263, 127.029],
  용인시: [37.240, 127.178],
  연수구: [37.410, 126.678],
  남동구: [37.449, 126.731],
}

async function seed() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI!, { dbName: 'dotori' })
  console.log('Connected.')

  const db = mongoose.connection.db!
  const collection = db.collection('facilities')

  // Drop existing
  await collection.deleteMany({})
  console.log('Cleared existing facilities.')

  const facilities = []
  let id = 0

  for (const region of regions) {
    const count = Math.floor(500 / regions.length) + (id < 500 % regions.length ? 1 : 0)
    const coords = centerCoords[region.sigungu] || [37.5, 127.0]

    for (let i = 0; i < count && facilities.length < 500; i++) {
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

      facilities.push({
        name: `${pick(namePrefix)}어린이집`,
        type,
        status,
        address: `${region.sido} ${region.sigungu} ${dong} ${100 + Math.floor(Math.random() * 900)}`,
        region: { sido: region.sido, sigungu: region.sigungu, dong },
        location: {
          type: 'Point',
          coordinates: [randomCoord(coords[1], 0.02), randomCoord(coords[0], 0.015)],
        },
        phone: `02-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        capacity: { total, current, waiting },
        features,
        programs: [],
        rating: +(3 + Math.random() * 2).toFixed(1),
        reviewCount: Math.floor(Math.random() * 50),
        evaluationGrade: pick(['A', 'B', 'C', null]),
        operatingHours: {
          open: '07:30',
          close: '19:30',
          extendedCare: features.includes('연장보육'),
        },
        images: [],
        dataSource: 'seed',
        lastSyncedAt: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  const result = await collection.insertMany(facilities)
  console.log(`Inserted ${result.insertedCount} facilities.`)

  // Create 2dsphere index
  await collection.createIndex({ location: '2dsphere' })
  await collection.createIndex({ 'region.sido': 1, 'region.sigungu': 1 })
  await collection.createIndex({ status: 1, type: 1 })
  await collection.createIndex({ name: 'text', address: 'text' })
  console.log('Indexes created.')

  await mongoose.disconnect()
  console.log('Done! Seeded 500 facilities across 15 regions.')
}

seed().catch(console.error)
