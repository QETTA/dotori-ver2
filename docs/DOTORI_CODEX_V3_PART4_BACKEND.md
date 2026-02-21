# 도토리 CODEX V3 — Part 4: MongoDB·인증·API·시드 데이터

> Part 1~3(프론트엔드)에 이어, 백엔드 전체를 다룬다.
> **Mongoose + NextAuth.js v5 + 카카오 로그인 + 시드 500개**

---

## 0. 아키텍처 요약

```
┌─────────────────────────────────────────────────┐
│                Next.js 15 (풀스택)                │
│                                                   │
│  ┌───────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ 프론트엔드  │  │ API 라우트 │  │ NextAuth.js v5│ │
│  │ (Part1~3)  │→│ /api/*    │→│ 카카오 OAuth   │ │
│  └───────────┘  └────┬─────┘  └───────┬───────┘ │
│                      │                │          │
│                      ▼                ▼          │
│              ┌──────────────────────────┐        │
│              │       Mongoose ODM       │        │
│              └────────────┬─────────────┘        │
│                           │                      │
└───────────────────────────┼──────────────────────┘
                            │
                    ┌───────▼───────┐
                    │ MongoDB Atlas │
                    │ (클라우드 DB)  │
                    └───────────────┘

컬렉션 구조:
├── users          (NextAuth + 도토리 프로필)
├── accounts       (NextAuth OAuth 계정)
├── sessions       (NextAuth 세션)
├── facilities     (어린이집 12,000+ 시설, MVP: 500개 시드)
├── waitlists      (대기 신청 기록)
├── alerts         (알림 설정)
├── chathistories  (토리챗 대화 기록)
└── posts          (이웃 커뮤니티 게시글)
```

---

## 1. 의존성 설치

```bash
cd dotori-app

# ── MongoDB ──
npm install mongoose@^8.14

# ── NextAuth.js v5 + MongoDB 어댑터 ──
npm install next-auth@beta @auth/mongodb-adapter mongodb

# ── 시드 생성 유틸 ──
npm install -D tsx
```

**패키지 설명:**

| 패키지 | 역할 |
|--------|------|
| `mongoose` | MongoDB ODM. 스키마 정의, 유효성 검사, 쿼리 빌더 |
| `next-auth@beta` | NextAuth.js v5. App Router 네이티브, 카카오 프로바이더 내장 |
| `@auth/mongodb-adapter` | NextAuth ↔ MongoDB 세션/계정 저장 |
| `mongodb` | MongoDB 네이티브 드라이버 (어댑터 내부 사용) |
| `tsx` | TypeScript 파일 직접 실행 (시드 스크립트용) |

---

## 2. 환경 변수

파일: `.env.local` (⚠️ .gitignore에 반드시 포함)

```bash
# ── MongoDB Atlas ──
MONGODB_URI=mongodb+srv://<사용자>:<비밀번호>@<클러스터>.mongodb.net/dotori?retryWrites=true&w=majority

# ── NextAuth.js ──
AUTH_SECRET=<openssl rand -base64 32 결과>

# ── 카카오 OAuth ──
AUTH_KAKAO_ID=<카카오 REST API 키>
AUTH_KAKAO_SECRET=<카카오 Client Secret>

# ── 앱 URL ──
NEXTAUTH_URL=http://localhost:3000
```

---

## 3. MongoDB 연결 (Mongoose 싱글턴)

파일: `src/lib/db.ts`

```typescript
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI 환경변수를 .env.local에 설정해주세요')
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

const cached = global.mongooseCache ?? { conn: null, promise: null }
if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'dotori',
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
```

파일: `src/lib/mongodb.ts` (NextAuth MongoDB 어댑터용)

```typescript
import { MongoClient, ServerApiVersion } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI 환경변수를 .env.local에 설정해주세요')
}

const uri = process.env.MONGODB_URI
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
```

---

## 4. next.config.ts 업데이트

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  serverExternalPackages: ['mongoose'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig
```

---

## 5. Mongoose 스키마 (6개 모델)

### 5-1. User — `src/models/User.ts`

```typescript
import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IUser extends Document {
  name: string
  email?: string
  emailVerified?: Date
  image?: string
  nickname: string
  children: {
    name: string
    birthDate: string
    gender: 'male' | 'female' | 'unspecified'
    specialNeeds?: string[]
  }[]
  region: {
    sido: string
    sigungu: string
    dong?: string
  }
  interests: mongoose.Types.ObjectId[]
  gpsVerified: boolean
  plan: 'free' | 'premium'
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

const ChildSchema = new Schema(
  {
    name: { type: String, required: true },
    birthDate: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'unspecified'], default: 'unspecified' },
    specialNeeds: [String],
  },
  { _id: true }
)

const RegionSchema = new Schema(
  {
    sido: { type: String, default: '' },
    sigungu: { type: String, default: '' },
    dong: { type: String, default: '' },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    emailVerified: Date,
    image: String,
    nickname: { type: String, default: '' },
    children: { type: [ChildSchema], default: [] },
    region: { type: RegionSchema, default: () => ({}) },
    interests: [{ type: Schema.Types.ObjectId, ref: 'Facility' }],
    gpsVerified: { type: Boolean, default: false },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

UserSchema.index({ email: 1 }, { unique: true, sparse: true })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export default User
```

### 5-2. Facility — `src/models/Facility.ts`

```typescript
import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IFacility extends Document {
  name: string
  type: '국공립' | '민간' | '가정' | '직장' | '협동' | '사회복지'
  status: 'available' | 'waiting' | 'full'
  address: string
  region: { sido: string; sigungu: string; dong: string }
  location: { type: 'Point'; coordinates: [number, number] }
  phone?: string
  capacity: { total: number; current: number; waiting: number }
  features: string[]
  programs: string[]
  rating: number
  reviewCount: number
  evaluationGrade?: string
  operatingHours?: { open: string; close: string; extendedCare: boolean }
  images: string[]
  dataSource: string
  lastSyncedAt: Date
  createdAt: Date
  updatedAt: Date
}

const FacilitySchema = new Schema<IFacility>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['국공립', '민간', '가정', '직장', '협동', '사회복지'], required: true },
    status: { type: String, enum: ['available', 'waiting', 'full'], required: true },
    address: { type: String, required: true },
    region: {
      sido: { type: String, required: true },
      sigungu: { type: String, required: true },
      dong: { type: String, default: '' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    phone: String,
    capacity: {
      total: { type: Number, required: true },
      current: { type: Number, required: true },
      waiting: { type: Number, default: 0 },
    },
    features: { type: [String], default: [] },
    programs: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    evaluationGrade: { type: String, enum: ['A', 'B', 'C', 'D', null] },
    operatingHours: {
      open: String,
      close: String,
      extendedCare: { type: Boolean, default: false },
    },
    images: { type: [String], default: [] },
    dataSource: { type: String, default: 'seed' },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

FacilitySchema.index({ location: '2dsphere' })
FacilitySchema.index({ 'region.sido': 1, 'region.sigungu': 1 })
FacilitySchema.index({ status: 1, type: 1 })
FacilitySchema.index({ name: 'text', address: 'text' })

const Facility: Model<IFacility> =
  mongoose.models.Facility || mongoose.model<IFacility>('Facility', FacilitySchema)
export default Facility
```

### 5-3. Waitlist — `src/models/Waitlist.ts`
### 5-4. Alert — `src/models/Alert.ts`
### 5-5. ChatHistory — `src/models/ChatHistory.ts`
### 5-6. Post — `src/models/Post.ts`

(상세 스키마는 Part 4 원본 스펙 참조)

---

## 6. NextAuth.js v5 + 카카오 로그인

파일: `src/auth.ts`

```typescript
import NextAuth from 'next-auth'
import Kakao from 'next-auth/providers/kakao'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: 'dotori' }),
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string
      return session
    },
  },
})
```

---

## 7. API 라우트 맵

```
src/app/api/
├── auth/[...nextauth]/route.ts     NextAuth 핸들러
├── facilities/
│   ├── route.ts                   GET  시설 목록
│   ├── nearby/route.ts            GET  주변 시설 (GeoJSON)
│   └── [id]/route.ts              GET  시설 상세
├── waitlist/
│   ├── route.ts                   GET/POST 대기 목록/신청
│   └── [id]/route.ts              DELETE 대기 취소
├── alerts/route.ts                GET/POST 알림
├── users/me/
│   ├── route.ts                   GET/PATCH 프로필
│   └── interests/route.ts         POST/DELETE 관심 시설
└── posts/route.ts                 (Phase 2)
```

---

## 8. 시드 데이터 (500개)

파일: `scripts/seed.ts` — 15개 지역 × 6개 유형, 실제 비율 근사 생성

실행: `npx tsx --env-file=.env.local scripts/seed.ts`

---

## 9. 빌드 순서

```
□ 1. 의존성 설치
□ 2. .env.local 확인
□ 3. MongoDB Atlas 연결 확인
□ 4. src/lib/db.ts + mongodb.ts
□ 5. next.config.ts 업데이트 (serverExternalPackages)
□ 6. 6개 모델 생성
□ 7. 시드 500개 실행
□ 8. auth.ts + NextAuth route handler
□ 9. types/next-auth.d.ts
□ 10. AuthProvider + 레이아웃 수정
□ 11. 로그인 페이지
□ 12. API 라우트 7개
□ 13. src/lib/api.ts fetcher
□ 14. 카카오 로그인 테스트
□ 15. /api/facilities 500개 확인
□ 16. /api/facilities/nearby GeoJSON 확인
```

---

*DOTORI CODEX V3 Part 4 완료.*
*Part 1(셋업) + Part 2(컴포넌트) + Part 3(화면) + Part 4(백엔드) = 전체 Codex.*
