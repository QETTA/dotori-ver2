# 입소ai 배포 체크리스트

## 1. 사전 준비

### 1.1 계정 생성
- [ ] Vercel 계정 (https://vercel.com)
- [ ] Supabase 또는 Neon 계정 (PostgreSQL)
- [ ] Upstash 계정 (Redis, optional)
- [ ] 카카오 개발자 계정 (https://developers.kakao.com)
- [ ] 네이버 개발자 계정 (https://developers.naver.com)
- [ ] 토스페이먼츠 계정 (https://developers.tosspayments.com)
- [ ] 공공데이터포털 계정 (https://data.go.kr)
- [ ] 도메인 구매 (ipso.ai)

### 1.2 외부 서비스 설정

**카카오 앱 등록:**
- [ ] 카카오 개발자 → 앱 생성
- [ ] REST API 키 복사 → `KAKAO_CLIENT_ID`
- [ ] JavaScript 키 복사 → `NEXT_PUBLIC_KAKAO_KEY`
- [ ] Client Secret 설정 → `KAKAO_CLIENT_SECRET`
- [ ] 카카오 로그인 활성화
- [ ] Redirect URI: `https://ipso.ai/api/auth/callback/kakao`
- [ ] 동의항목: 닉네임, 프로필사진, 이메일

**네이버 앱 등록:**
- [ ] 네이버 개발자 → 앱 등록
- [ ] Client ID → `NAVER_CLIENT_ID`
- [ ] Client Secret → `NAVER_CLIENT_SECRET`
- [ ] Callback URL: `https://ipso.ai/api/auth/callback/naver`
- [ ] API 권한: 네아로 (회원 기본 정보)

**토스페이먼츠:**
- [ ] 상점 등록 + 심사
- [ ] 테스트 키 → 프로덕션 키 교체
- [ ] `TOSS_SECRET_KEY` (시크릿 키)
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY` (클라이언트 키)
- [ ] 웹훅 URL: `https://ipso.ai/api/payment/webhook`

**공공데이터포털:**
- [ ] 보육정보포탈 API 활용 신청
- [ ] 인증키 → `DATA_GO_KR_KEY`

---

## 2. 인프라 설정

### 2.1 데이터베이스 (Supabase 권장)
```bash
# Supabase 프로젝트 생성 후
# Connection string 복사 → DATABASE_URL

# 마이그레이션 실행
npx prisma migrate deploy

# 시드 데이터 (50개 서울 시설)
npx prisma db seed
```

### 2.2 Redis (Upstash, optional)
```bash
# Upstash 콘솔에서 DB 생성
# REST URL → REDIS_URL
# Token → REDIS_TOKEN
```

### 2.3 Vercel 배포
```bash
# 1. GitHub 레포 연결
vercel link

# 2. 환경변수 설정
vercel env pull

# 3. 배포
vercel --prod
```

---

## 3. 환경변수 체크리스트

### 필수 (Required)
| 변수 | 값 | 상태 |
|------|-----|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | [ ] |
| `NEXTAUTH_URL` | https://ipso.ai | [ ] |
| `NEXTAUTH_SECRET` | 32자+ 랜덤 문자열 | [ ] |
| `KAKAO_CLIENT_ID` | REST API 키 | [ ] |
| `KAKAO_CLIENT_SECRET` | 카카오 시크릿 | [ ] |
| `NEXT_PUBLIC_KAKAO_KEY` | JavaScript 키 | [ ] |
| `NAVER_CLIENT_ID` | 네이버 클라이언트 ID | [ ] |
| `NAVER_CLIENT_SECRET` | 네이버 시크릿 | [ ] |
| `TOSS_SECRET_KEY` | 토스 시크릿 키 | [ ] |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 클라이언트 키 | [ ] |
| `DATA_GO_KR_KEY` | 공공데이터 인증키 | [ ] |
| `CRON_SECRET` | 크론 인증 시크릿 | [ ] |

### 선택 (Optional)
| 변수 | 용도 | 상태 |
|------|------|------|
| `REDIS_URL` | Rate limiter | [ ] |
| `OPENAI_API_KEY` | AI 채팅 | [ ] |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | [ ] |
| `NEXT_PUBLIC_SENTRY_DSN` | 에러 트래킹 | [ ] |

---

## 4. 배포 후 검증

### 4.1 기능 테스트
- [ ] 랜딩 페이지 로드
- [ ] 카카오 로그인
- [ ] 네이버 로그인
- [ ] 온보딩 플로우
- [ ] 시설 탐색 + 검색
- [ ] 시설 상세 페이지
- [ ] 카카오맵 표시
- [ ] AI 채팅
- [ ] 시뮬레이션
- [ ] 알림 목록
- [ ] 즐겨찾기 토글
- [ ] 설정 페이지 (4탭)
- [ ] 결제 플로우 (테스트 모드)
- [ ] 관리자 대시보드

### 4.2 성능 검증
- [ ] Lighthouse 점수 > 90 (Performance)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] API 응답 < 200ms (p95)

### 4.3 보안 검증
- [ ] HTTPS 강제 리다이렉트
- [ ] CSP 헤더 확인
- [ ] HSTS 헤더 확인
- [ ] Rate limit 작동
- [ ] 인증 없이 보호 페이지 접근 시 리다이렉트

### 4.4 SEO 검증
- [ ] `/sitemap.xml` 접근 가능
- [ ] `/robots.txt` 접근 가능
- [ ] OG 이미지 렌더링 (`/api/og`)
- [ ] JSON-LD 구조화 데이터
- [ ] Google Search Console 등록

---

## 5. 모니터링 설정

### 5.1 Vercel
- [ ] Analytics 활성화
- [ ] Speed Insights 활성화
- [ ] Deployment protection (preview)
- [ ] 크론 작동 확인 (3am KST 시설 동기화)

### 5.2 외부
- [ ] Sentry 에러 트래킹 (선택)
- [ ] Uptime monitoring (BetterStack/UptimeRobot)
- [ ] `/api/health` 헬스체크 연결

---

## 6. 출시 전 최종

- [ ] `next build` 성공
- [ ] TypeScript 에러 0
- [ ] E2E 테스트 통과
- [ ] 개인정보처리방침 페이지
- [ ] 이용약관 페이지
- [ ] 서비스 소개 (about) 콘텐츠 최종 검수
- [ ] 프라이싱 금액 확정
- [ ] 카카오/네이버 앱 심사 완료
- [ ] 토스페이먼츠 정산 계좌 등록
- [ ] 도메인 SSL 인증서 확인

---

## Quick Deploy Commands

```bash
# 로컬 빌드 확인
npm run build

# Docker 로컬 테스트
docker compose up -d
npx prisma migrate deploy
npx prisma db seed

# Vercel 배포
git push origin main  # auto-deploy via GitHub integration

# 또는 수동
vercel --prod
```

---

**마지막 업데이트: 2026-02-15**
**프로젝트 버전: v0.4.0**
**총 파일: 203+, 코드: 20,000+ 줄**
